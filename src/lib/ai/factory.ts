import "server-only";

import {
  CommonResumeAIProvider,
  resolveAiProvider,
  type AIProviderType,
} from "@/lib/ai/common-provider";
import type { ResumeAIProvider } from "@/lib/ai/provider";

export type { AIProviderType };
export { resolveAiProvider };

export function isAiConfigured(): boolean {
  const provider = resolveAiProvider();
  if (provider === "openrouter") {
    return Boolean(process.env.OPENROUTER_API_KEY?.trim());
  }
  return Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
  );
}


export function getResumeAIProvider(): ResumeAIProvider {
  return new CommonResumeAIProvider();
}
