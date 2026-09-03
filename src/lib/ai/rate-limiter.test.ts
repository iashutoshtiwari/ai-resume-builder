import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, _resetRateLimiter, getClientIp } from "@/lib/ai/rate-limiter";

describe("Rate Limiter", () => {
  beforeEach(() => {
    _resetRateLimiter();
  });

  it("extracts client IP from Cloudflare header", () => {
    const req = new Request("https://example.com/api", {
      headers: { "cf-connecting-ip": "203.0.113.195" },
    });
    expect(getClientIp(req)).toBe("203.0.113.195");
  });

  it("extracts client IP from x-forwarded-for first address", () => {
    const req = new Request("https://example.com/api", {
      headers: { "x-forwarded-for": "198.51.100.1, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("198.51.100.1");
  });

  it("permits requests within allowed threshold and tracks remaining count", () => {
    const req = new Request("https://example.com/api", {
      headers: { "x-real-ip": "1.2.3.4" },
    });

    const first = checkRateLimit(req, "medium", { maxRequests: 3, windowMs: 10000 });
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = checkRateLimit(req, "medium", { maxRequests: 3, windowMs: 10000 });
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);

    const third = checkRateLimit(req, "medium", { maxRequests: 3, windowMs: 10000 });
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks requests exceeding threshold with retryAfter", () => {
    const req = new Request("https://example.com/api", {
      headers: { "x-real-ip": "5.6.7.8" },
    });

    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, "heavy", { maxRequests: 3, windowMs: 60000 });
    }

    const blocked = checkRateLimit(req, "heavy", { maxRequests: 3, windowMs: 60000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.remaining).toBe(0);
  });
});
