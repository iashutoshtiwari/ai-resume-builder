import "server-only";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIGS: Record<"heavy" | "medium", RateLimitConfig> = {
  // Heavy: parse-resume, tailor, build-resume (6 calls per 10 mins per IP)
  heavy: {
    windowMs: 10 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_HEAVY_MAX ?? "6", 10),
  },
  // Medium: analyze-job, proofread (12 calls per 10 mins per IP)
  medium: {
    windowMs: 10 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MEDIUM_MAX ?? "12", 10),
  },
};

// In-memory store: ip:tier -> array of timestamps
const requestLog = new Map<string, number[]>();

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "127.0.0.1";
}

export function checkRateLimit(
  request: Request,
  tier: "heavy" | "medium" = "medium",
  configOverride?: Partial<RateLimitConfig>,
): { allowed: boolean; retryAfter?: number; remaining: number } {
  // Allow disabling rate limiting in test or local if explicitly set
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    return { allowed: true, remaining: 999 };
  }

  const baseConfig = DEFAULT_CONFIGS[tier];
  const windowMs = configOverride?.windowMs ?? baseConfig.windowMs;
  const maxRequests = configOverride?.maxRequests ?? baseConfig.maxRequests;

  const ip = getClientIp(request);
  const key = `${ip}:${tier}`;
  const now = Date.now();

  const timestamps = (requestLog.get(key) ?? []).filter(
    (time) => now - time < windowMs,
  );

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      retryAfter,
      remaining: 0,
    };
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);

  // Periodic cleanup if store grows beyond 5,000 entries
  if (requestLog.size > 5000) {
    for (const [k, times] of requestLog.entries()) {
      const active = times.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        requestLog.delete(k);
      } else {
        requestLog.set(k, active);
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - timestamps.length),
  };
}

export function _resetRateLimiter(): void {
  requestLog.clear();
}
