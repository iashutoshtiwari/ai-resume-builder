import "server-only";

import {
  CommonResumeAIProvider,
  resolveAiProvider,
  type AIProviderType,
} from "@/lib/ai/common-provider";
import type { ResumeAIProvider } from "@/lib/ai/provider";

export type { AIProviderType };
export { resolveAiProvider };

export function isAiConfigured(providerOverride?: AIProviderType): boolean {
  const provider = resolveAiProvider(providerOverride);
  if (provider === "groq") {
    return Boolean(process.env.GROQ_API_KEY?.trim());
  }
  if (provider === "openrouter") {
    return Boolean(process.env.OPENROUTER_API_KEY?.trim());
  }
  return Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
  );
}

export interface ProviderMetadata {
  id: AIProviderType;
  name: string;
  badge: string;
  configured: boolean;
  model: string;
  description: string;
}

export function getAvailableAiProviders(): ProviderMetadata[] {
  const hasGoogle = Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
  );
  const hasGroq = Boolean(process.env.GROQ_API_KEY?.trim());
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());

  return [
    {
      id: "google",
      name: "Google Gemini",
      badge: "Google AI",
      configured: hasGoogle,
      model: process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash",
      description: "Google AI Studio Pro / Free tier",
    },
    {
      id: "groq",
      name: "Groq LPU",
      badge: "14.4k/day Free",
      configured: hasGroq,
      model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b",
      description: "Ultra-fast ~300 tok/s free tier",
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      badge: "Multi-Model",
      configured: hasOpenRouter,
      model: process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash",
      description: "Community & frontier models gateway",
    },
  ];
}

export function getResumeAIProvider(providerOverride?: AIProviderType): ResumeAIProvider {
  return new CommonResumeAIProvider({ provider: providerOverride });
}
