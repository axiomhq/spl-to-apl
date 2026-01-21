export interface TranslationCase {
  id: string;
  name: string;
  spl: string;
  expectedApl: string;
  category?: string;
}

export interface TranslationResult {
  caseId: string;
  skillVariant: "original" | "compressed";
  inputSpl: string;
  expectedApl: string;
  generatedApl: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  success: boolean;
  errorMessage?: string;
}

export interface SkillVariant {
  name: "original" | "compressed";
  path: string;
  tokenCount: number;
}

export interface HarnessConfig {
  cases: TranslationCase[];
  skills: SkillVariant[];
  runs: number;
}

export interface ComparisonReport {
  timestamp: string;
  config: HarnessConfig;
  results: TranslationResult[];
  summary: {
    original: VariantSummary;
    compressed: VariantSummary;
  };
}

export interface VariantSummary {
  skillTokenCount: number;
  averageLatencyMs: number;
  averageOutputTokens: number;
  successRate: number;
  totalRuns: number;
}
