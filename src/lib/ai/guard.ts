import "server-only";

import { AppError } from "@/lib/ai/errors";
import { verifyOrigin } from "@/lib/ai/origin-guard";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { checkDailyBudget, recordAiRequest } from "@/lib/ai/circuit-breaker";

export async function enforceAiRouteGuard(
  request: Request,
  tier: "heavy" | "medium" = "medium",
): Promise<void> {
  // 1. Origin & CSRF verification
  const originCheck = verifyOrigin(request);
  if (!originCheck.allowed) {
    throw new AppError("FORBIDDEN", originCheck.reason || "Forbidden origin.", 403, false);
  }

  // 2. Global daily budget circuit breaker
  const budgetCheck = checkDailyBudget();
  if (!budgetCheck.allowed) {
    throw new AppError(
      "DAILY_QUOTA_EXCEEDED",
      `The application has reached its daily AI request capacity (${budgetCheck.limit} requests/day). Please try again tomorrow or configure your own API key.`,
      503,
      false,
    );
  }

  // 3. Sliding-window IP rate limiter
  const rateCheck = checkRateLimit(request, tier);
  if (!rateCheck.allowed) {
    throw new AppError(
      "RATE_LIMITED",
      `Too many AI requests from this IP. Please wait ${rateCheck.retryAfter} seconds before trying again.`,
      429,
      true,
      { retryAfter: rateCheck.retryAfter },
    );
  }

  // 4. Record request towards daily total
  recordAiRequest();
}
