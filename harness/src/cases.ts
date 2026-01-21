import type { TranslationCase } from "./types";

/**
 * Stub: Inject test cases here.
 * 
 * Each case has:
 * - spl: The Splunk SPL query to translate
 * - expectedApl: The expected Axiom APL output
 * 
 * Pull real examples from:
 * - .agents/skills/spl-to-apl/reference/examples.md
 * - tests/test-queries.md
 */
export const testCases: TranslationCase[] = [
  // TODO: Add real translation cases
  // Example structure:
  // {
  //   id: "basic-search",
  //   name: "Basic index search",
  //   spl: `index=main sourcetype=access_combined`,
  //   expectedApl: `['main'] | where sourcetype == "access_combined"`,
  //   category: "basic",
  // },
];

export function loadCases(): TranslationCase[] {
  return testCases;
}

export function loadCasesFromJson(jsonPath: string): TranslationCase[] {
  const file = Bun.file(jsonPath);
  return file.json() as Promise<TranslationCase[]> as unknown as TranslationCase[];
}
