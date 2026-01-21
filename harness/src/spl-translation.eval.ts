import { experimental_Eval as Eval } from "@axiomhq/ai/evals";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { wrapAISDKModel } from "@axiomhq/ai";
import { testCases } from "./cases";

const model = wrapAISDKModel(gateway("google/gemini-2.5-flash"));

async function loadSkillContent(variant: "original" | "compressed"): Promise<string> {
  const path = variant === "original" 
    ? "../.agents/skills/spl-to-apl/SKILL.md"
    : "../.agents/skills/spl-to-apl/SKILL.draft.md";
  return Bun.file(path).text();
}

async function translateSplToApl(spl: string, skillVariant: "original" | "compressed"): Promise<string> {
  const skillContent = await loadSkillContent(skillVariant);
  
  const systemPrompt = `You are an expert at translating Splunk SPL queries to Axiom APL queries.

${skillContent}

Translate the following SPL query to APL. Output ONLY the APL query, no explanation.`;

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: spl,
    temperature: 0,
  });

  return result.text.trim();
}

/**
 * Scorer: Check if generated APL matches expected APL exactly
 */
function ExactMatch(input: string, output: string, expected: string): number {
  return output === expected ? 1 : 0;
}

/**
 * Scorer: Check if key APL operators are present
 * More lenient - allows for variation in formatting
 */
function KeyOperatorsPresent(input: string, output: string, expected: string): number {
  const expectedLower = expected.toLowerCase();
  const outputLower = output.toLowerCase();
  
  const keyPatterns = [
    /\bsummarize\b/,
    /\bwhere\b/,
    /\bextend\b/,
    /\bproject\b/,
    /\border by\b/,
    /\btake\b/,
    /\bjoin\b/,
    /\bunion\b/,
    /\bmv-expand\b/,
    /\bparse\b/,
    /\bextract\b/,
    /\bcount\(\)/,
    /\bcountif\b/,
    /\bdcount\b/,
    /\bbin\b/,
    /\btop\b/,
    /\barg_max\b/,
    /\barg_min\b/,
  ];
  
  let matchedOperators = 0;
  let expectedOperators = 0;
  
  for (const pattern of keyPatterns) {
    if (pattern.test(expectedLower)) {
      expectedOperators++;
      if (pattern.test(outputLower)) {
        matchedOperators++;
      }
    }
  }
  
  return expectedOperators > 0 ? matchedOperators / expectedOperators : 1;
}

/**
 * Scorer: Check if dataset reference is correct
 */
function DatasetCorrect(input: string, output: string, expected: string): number {
  const datasetMatch = expected.match(/\['([^']+)'\]/);
  if (!datasetMatch) return 1;
  
  const expectedDataset = datasetMatch[1];
  return output.includes(`['${expectedDataset}']`) ? 1 : 0;
}

/**
 * Scorer: Check if time filtering is present when expected
 */
function TimeFilterPresent(input: string, output: string, expected: string): number {
  const expectsTimeFilter = expected.includes("_time between") || expected.includes("ago(");
  if (!expectsTimeFilter) return 1;
  
  const hasTimeFilter = output.includes("_time between") || output.includes("ago(") || output.includes("_time >=");
  return hasTimeFilter ? 1 : 0;
}

// Original skill evaluation
Eval("spl-translation-original", {
  data: async () => testCases.map(tc => ({
    input: tc.spl,
    expected: tc.expectedApl,
  })),
  
  task: async (input: string) => {
    return translateSplToApl(input, "original");
  },
  
  scorers: [ExactMatch, KeyOperatorsPresent, DatasetCorrect, TimeFilterPresent],
  threshold: 0.7,
});

// Compressed skill evaluation
Eval("spl-translation-compressed", {
  data: async () => testCases.map(tc => ({
    input: tc.spl,
    expected: tc.expectedApl,
  })),
  
  task: async (input: string) => {
    return translateSplToApl(input, "compressed");
  },
  
  scorers: [ExactMatch, KeyOperatorsPresent, DatasetCorrect, TimeFilterPresent],
  threshold: 0.7,
});
