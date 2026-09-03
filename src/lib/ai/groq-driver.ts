import "server-only";

import { AppError } from "@/lib/ai/errors";
import { delay } from "@/lib/utils";

const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

export function configuredGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

export async function callGroq(
  prompt: [system: string, user: string],
  model: string,
  apiKey: string,
  maxOutputTokens = 2000,
  jsonSchema?: unknown,
): Promise<string> {
  let lastError: unknown;
  let currentModel = model;
  let useStructuredSchema = Boolean(jsonSchema);

  // Approximate tokens from prompt characters (~3.5 chars per token)
  const approxPromptTokens = Math.ceil((prompt[0].length + prompt[1].length) / 3.5);

  // If using an 8,000 TPM limit model and prompt is large, switch to groq/compound (70,000 TPM) or cap max_tokens
  let effectiveMaxTokens = maxOutputTokens;
  if (currentModel !== "groq/compound" && approxPromptTokens + effectiveMaxTokens > 7500) {
    if (approxPromptTokens > 5500) {
      currentModel = "groq/compound";
    } else {
      effectiveMaxTokens = Math.max(800, 7500 - approxPromptTokens);
    }
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const responseFormat =
        useStructuredSchema && jsonSchema
          ? {
              type: "json_schema",
              json_schema: {
                name: "response",
                schema: jsonSchema,
              },
            }
          : { type: "json_object" };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { role: "system", content: prompt[0] },
            { role: "user", content: prompt[1] },
          ],
          temperature: 0.1,
          response_format: responseFormat,
          max_tokens: effectiveMaxTokens,
        }),
        signal: AbortSignal.timeout(45_000),
      });


      if (!response.ok) {
        let errorData: { error?: { message?: string; code?: string | number } } | null = null;
        try {
          errorData = (await response.json()) as { error?: { message?: string; code?: string | number } };
        } catch {
          // Response was not JSON
        }

        const message = errorData?.error?.message || response.statusText || `HTTP ${response.status}`;
        const status = response.status;

        // Auto-failover on TPM rate limit (HTTP 413 or TPM message) to groq/compound (70,000 TPM limit)
        const isTpmLimit =
          status === 413 ||
          message.toLowerCase().includes("tokens per minute") ||
          message.toLowerCase().includes("limit 8000");

        if (isTpmLimit && currentModel !== "groq/compound") {
          currentModel = "groq/compound";
          effectiveMaxTokens = Math.min(maxOutputTokens, 2500);
          continue;
        }

        // Auto-failover if json_schema structured output is not supported by the model
        if (
          status === 400 &&
          useStructuredSchema &&
          (message.toLowerCase().includes("json_schema") ||
            message.toLowerCase().includes("response_format") ||
            message.toLowerCase().includes("schema"))
        ) {
          useStructuredSchema = false;
          continue;
        }


        if (status === 401 || status === 403) {
          throw new AppError(
            "AI_NOT_CONFIGURED",
            `Groq authentication failed: ${message}. Check GROQ_API_KEY.`,
            401,
            false,
          );
        }

        if (status === 404) {
          throw new AppError(
            "INVALID_MODEL",
            `Groq model "${model}" is not available: ${message}. Check GROQ_MODEL.`,
            400,
            false,
          );
        }

        if (status === 429) {
          if (attempt < 2) {
            await delay(300 * 2 ** attempt);
            continue;
          }
          throw new AppError(
            "RATE_LIMITED",
            `Groq rate limit reached: ${message}. Please try again shortly.`,
            429,
            true,
          );
        }

        if (status >= 500) {
          if (attempt < 2) {
            await delay(300 * 2 ** attempt);
            continue;
          }
          throw new AppError(
            "PROVIDER_UNAVAILABLE",
            `Groq service is temporarily unavailable: ${message}.`,
            503,
            true,
          );
        }

        throw new AppError(
          "INVALID_MODEL_OUTPUT",
          `Groq request failed with HTTP ${status}: ${message}`,
          status >= 400 && status < 500 ? 400 : 502,
          status >= 500,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string" || !content.trim()) {
        throw new AppError(
          "INVALID_MODEL_OUTPUT",
          "Groq returned an empty response.",
          502,
          true,
        );
      }

      return content;
    } catch (error) {
      lastError = error;
      if (error instanceof AppError && !error.retryable) throw error;
      if (attempt < 2) {
        await delay(300 * 2 ** attempt);
        continue;
      }
      break;
    }
  }

  if (lastError instanceof AppError) throw lastError;

  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  if (msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("aborted")) {
    throw new AppError(
      "REQUEST_TIMEOUT",
      "Groq did not respond within 45 seconds. Please try again.",
      504,
      true,
    );
  }

  throw new AppError(
    "PROVIDER_UNAVAILABLE",
    `Failed to connect to Groq: ${msg}`,
    503,
    true,
  );
}
