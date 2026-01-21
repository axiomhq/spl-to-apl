import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { wrapModel } from "./instrumentation";
import type { TranslationCase, TranslationResult, SkillVariant } from "./types";

async function loadSkillContent(skillPath: string): Promise<string> {
  const file = Bun.file(skillPath);
  return file.text();
}

const model = wrapModel(openai("gpt-4o-mini"));

export async function translate(
  testCase: TranslationCase,
  skill: SkillVariant
): Promise<TranslationResult> {
  const skillContent = await loadSkillContent(skill.path);
  const startTime = performance.now();

  let generatedApl = "";
  let success = false;
  let errorMessage: string | undefined;
  let inputTokens = 0;
  let outputTokens = 0;

  const systemPrompt = `You are an expert at translating Splunk SPL queries to Axiom APL queries.

${skillContent}

Translate the following SPL query to APL. Output ONLY the APL query, no explanation.`;

  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: testCase.spl,
      temperature: 0,
    });

    generatedApl = result.text.trim();
    inputTokens = result.usage.inputTokens ?? 0;
    outputTokens = result.usage.outputTokens ?? 0;
    success = true;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    success = false;
  }

  const latencyMs = performance.now() - startTime;

  return {
    caseId: testCase.id,
    skillVariant: skill.name,
    inputSpl: testCase.spl,
    expectedApl: testCase.expectedApl,
    generatedApl,
    latencyMs,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    success,
    errorMessage,
  };
}
