import { describe, expect, it, afterEach, vi } from "vitest";
import { verifyOrigin } from "@/lib/ai/origin-guard";

describe("Origin Guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("permits same-origin requests in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const req = new Request("https://airesume.app/api/ai/tailor", {
      headers: {
        host: "airesume.app",
        origin: "https://airesume.app",
        "sec-fetch-site": "same-origin",
      },
    });

    const result = verifyOrigin(req);
    expect(result.allowed).toBe(true);
  });

  it("blocks cross-site Sec-Fetch-Site requests in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const req = new Request("https://airesume.app/api/ai/tailor", {
      headers: {
        host: "airesume.app",
        origin: "https://evil-site.com",
        "sec-fetch-site": "cross-site",
      },
    });

    const result = verifyOrigin(req);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/forbidden|cross-origin/i);
  });

  it("blocks mismatched origin headers in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const req = new Request("https://airesume.app/api/ai/tailor", {
      headers: {
        host: "airesume.app",
        origin: "https://imposter-site.com",
      },
    });

    const result = verifyOrigin(req);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/mismatch/i);
  });
});
