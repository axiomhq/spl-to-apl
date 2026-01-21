import { readFile } from "node:fs/promises";
import { encode } from "gpt-tokenizer";
import { flushTraces } from "./instrumentation";
import { translate } from "./translator";
import type {
  HarnessConfig,
  TranslationCase,
  TranslationResult,
  SkillVariant,
  ComparisonReport,
  VariantSummary,
} from "./types";

const SKILL_BASE = "../.agents/skills/spl-to-apl";

async function countTokens(filePath: string): Promise<number> {
  const content = await readFile(filePath, "utf-8");
  return encode(content).length;
}

async function loadSkillVariants(): Promise<SkillVariant[]> {
  const originalPath = `${SKILL_BASE}/SKILL.md`;
  const compressedPath = `${SKILL_BASE}/SKILL.draft.md`;

  return [
    {
      name: "original",
      path: originalPath,
      tokenCount: await countTokens(originalPath),
    },
    {
      name: "compressed",
      path: compressedPath,
      tokenCount: await countTokens(compressedPath),
    },
  ];
}

function summarize(
  results: TranslationResult[],
  skill: SkillVariant
): VariantSummary {
  const variantResults = results.filter((r) => r.skillVariant === skill.name);
  const successfulResults = variantResults.filter((r) => r.success);

  return {
    skillTokenCount: skill.tokenCount,
    averageLatencyMs:
      successfulResults.reduce((sum, r) => sum + r.latencyMs, 0) /
      (successfulResults.length || 1),
    averageOutputTokens:
      successfulResults.reduce((sum, r) => sum + r.outputTokens, 0) /
      (successfulResults.length || 1),
    successRate: successfulResults.length / (variantResults.length || 1),
    totalRuns: variantResults.length,
  };
}

export async function runHarness(
  cases: TranslationCase[],
  runsPerCase = 1
): Promise<ComparisonReport> {
  const skills = await loadSkillVariants();
  const [originalSkill, compressedSkill] = skills;
  
  if (!originalSkill || !compressedSkill) {
    throw new Error("Missing skill variants");
  }
  
  const results: TranslationResult[] = [];

  console.log(`Running harness with ${cases.length} cases, ${runsPerCase} runs each`);
  console.log(`Skills: original (${originalSkill.tokenCount} tokens), compressed (${compressedSkill.tokenCount} tokens)`);

  for (const testCase of cases) {
    for (let run = 0; run < runsPerCase; run++) {
      for (const skill of skills) {
        console.log(`  [${skill.name}] ${testCase.id} (run ${run + 1}/${runsPerCase})`);
        const result = await translate(testCase, skill);
        results.push(result);
      }
    }
  }

  await flushTraces();

  const config: HarnessConfig = {
    cases,
    skills,
    runs: runsPerCase,
  };

  return {
    timestamp: new Date().toISOString(),
    config,
    results,
    summary: {
      original: summarize(results, originalSkill),
      compressed: summarize(results, compressedSkill),
    },
  };
}

export function printReport(report: ComparisonReport): void {
  console.log("\n=== Comparison Report ===");
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Cases: ${report.config.cases.length}, Runs per case: ${report.config.runs}`);

  console.log("\n--- Original Skill ---");
  console.log(`  Token count: ${report.summary.original.skillTokenCount}`);
  console.log(`  Avg latency: ${report.summary.original.averageLatencyMs.toFixed(2)}ms`);
  console.log(`  Avg output tokens: ${report.summary.original.averageOutputTokens.toFixed(2)}`);
  console.log(`  Success rate: ${(report.summary.original.successRate * 100).toFixed(1)}%`);

  console.log("\n--- Compressed Skill ---");
  console.log(`  Token count: ${report.summary.compressed.skillTokenCount}`);
  console.log(`  Avg latency: ${report.summary.compressed.averageLatencyMs.toFixed(2)}ms`);
  console.log(`  Avg output tokens: ${report.summary.compressed.averageOutputTokens.toFixed(2)}`);
  console.log(`  Success rate: ${(report.summary.compressed.successRate * 100).toFixed(1)}%`);

  console.log("\n--- Token Savings ---");
  const saved = report.summary.original.skillTokenCount - report.summary.compressed.skillTokenCount;
  const pct = (saved / report.summary.original.skillTokenCount) * 100;
  console.log(`  Saved: ${saved} tokens (${pct.toFixed(1)}%)`);
}
