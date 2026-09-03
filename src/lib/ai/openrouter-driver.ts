import "server-only";

import { AppError } from "@/lib/ai/errors";
import { delay } from "@/lib/utils";

const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash";
// Resume JSON is deliberately bounded by Zod. 4K leaves enough credit headroom
// for common OpenRouter free/low-credit accounts while still covering normal jobs.
const DEFAULT_OPENROUTER_MAX_TOKENS = 4096;
const MAX_OPENROUTER_MAX_TOKENS = 8192;

export function configuredOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}

function configuredOpenRouterMaxTokens(): number {
  const envVal = process.env.OPENROUTER_MAX_TOKENS?.trim();
  if (envVal) {
    const parsed = Number.parseInt(envVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return Math.min(parsed, MAX_OPENROUTER_MAX_TOKENS);
  }
  return DEFAULT_OPENROUTER_MAX_TOKENS;
}

export async function callOpenRouter(
  prompt: [system: string, user: string],
  model: string,
  apiKey: string,
  jsonSchema?: unknown,
): Promise<string> {
  const currentMaxTokens = configuredOpenRouterMaxTokens();
  let lastError: unknown;
  let useStructuredSchema = Boolean(jsonSchema);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const responseFormat =
        useStructuredSchema && jsonSchema
          ? {
              type: "json_schema",
              json_schema: {
                name: "response",
                strict: true,
                schema: jsonSchema,
              },
            }
          : { type: "json_object" };

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "https://arqelo.ashutoshtiwari.dev",
          "X-Title": "ArqeloCV",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: prompt[0] },
            { role: "user", content: prompt[1] },
          ],
          temperature: 0.1,
          response_format: responseFormat,
          max_tokens: currentMaxTokens,
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (!response.ok) {
        let errorData: { error?: { message?: string; code?: string | number } } | null = null;
        try {
          errorData = (await response.json()) as { error?: { message?: string; code?: string | number } };
        } catch {
          // Response body was not JSON
        }

        const message = errorData?.error?.message || response.statusText || `HTTP ${response.status}`;
        const status = response.status;

        // Auto-failover if json_schema structured output is not supported by the provider/model
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
            `OpenRouter authentication failed: ${message}. Check OPENROUTER_API_KEY.`,
            401,
            false,
          );
        }

        if (status === 402 || message.toLowerCase().includes("credits") || message.toLowerCase().includes("afford")) {
          throw new AppError(
            "INSUFFICIENT_CREDITS",
            "OpenRouter does not have enough credit for this response size. Reduce OPENROUTER_MAX_TOKENS or add OpenRouter credits, then try again.",
            402,
            false,
          );
        }

        if (status === 404) {
          throw new AppError(
            "INVALID_MODEL",
            `OpenRouter model "${model}" is not available: ${message}. Check OPENROUTER_MODEL.`,
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
            `OpenRouter rate limit or credit quota reached: ${message}. Please try again shortly.`,
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
            `OpenRouter service is temporarily unavailable: ${message}.`,
            503,
            true,
          );
        }

        throw new AppError(
          "INVALID_MODEL_OUTPUT",
          `OpenRouter request failed (${status}): ${message}`,
          status,
          false,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new AppError("INVALID_MODEL_OUTPUT", "OpenRouter returned an empty response.", 502, true);
      }

      return content;
    } catch (error) {
      lastError = error;

      if (error instanceof AppError && !error.retryable) {
        throw error;
      }

      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" ||
          error.message.toLowerCase().includes("timeout") ||
          error.message.toLowerCase().includes("aborted"));

      if (isTimeout) {
        throw new AppError(
          "REQUEST_TIMEOUT",
          "OpenRouter did not respond within 45 seconds. Please try again.",
          504,
          true,
        );
      }

      if (attempt === 2) {
        break;
      }

      await delay(300 * 2 ** attempt);
    }
  }

  if (lastError instanceof AppError) {
    throw lastError;
  }

  throw new AppError(
    "PROVIDER_UNAVAILABLE",
    lastError instanceof Error ? lastError.message : "OpenRouter service is temporarily unavailable.",
    503,
    true,
  );
}
