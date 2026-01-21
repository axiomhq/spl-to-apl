import { wrapAISDKModel } from "@axiomhq/ai";
import type { LanguageModel } from "ai";

export function wrapModel(model: LanguageModel): LanguageModel {
  // wrapAISDKModel handles both V1 and V2 models
  return wrapAISDKModel(model as Parameters<typeof wrapAISDKModel>[0]);
}

export async function flushTraces(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
}
