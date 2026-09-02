import "server-only";
import { GeminiResumeAIProvider } from "@/lib/ai/gemini-provider";

export function getResumeAIProvider() {
  return new GeminiResumeAIProvider();
}

