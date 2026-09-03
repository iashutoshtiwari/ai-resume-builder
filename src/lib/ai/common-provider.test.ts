import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  CommonResumeAIProvider,
  resolveAiProvider,
} from "@/lib/ai/common-provider";
import { isAiConfigured } from "@/lib/ai/factory";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import type { GuidanceContext } from "@/features/guidance/schema";

const mockGuidance: GuidanceContext = {
  snapshotVersion: "test-snapshot",
  chunks: [
    {
      id: "er-bullets-car-star",
      title: "STAR Method",
      guidance: "Use STAR bullets.",
      sourceUrl: "https://www.reddit.com/r/EngineeringResumes/wiki/index/#wiki_bullet_points",
      sourceSection: "Bullet Points",
      reviewedAt: "2026-09-02",
      applicability: "general",
      tasks: ["tailor"],
      sections: ["experience"],
      tags: ["bullets"],
      mandatory: false,
    },
  ],
};

describe("AI Provider Resolution and Configuration", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves google when AI_PROVIDER=google or AI_PROVIDER=gemini (case-insensitive)", () => {
    vi.stubEnv("AI_PROVIDER", "google");
    expect(resolveAiProvider()).toBe("google");

    vi.stubEnv("AI_PROVIDER", "GOOGLE");
    expect(resolveAiProvider()).toBe("google");

    vi.stubEnv("AI_PROVIDER", "gemini");
    expect(resolveAiProvider()).toBe("google");

    vi.stubEnv("AI_PROVIDER", "Gemini");
    expect(resolveAiProvider()).toBe("google");
  });

  it("resolves openrouter when AI_PROVIDER=openrouter (case-insensitive)", () => {
    vi.stubEnv("AI_PROVIDER", "openrouter");
    expect(resolveAiProvider()).toBe("openrouter");

    vi.stubEnv("AI_PROVIDER", "OpenRouter");
    expect(resolveAiProvider()).toBe("openrouter");

    vi.stubEnv("AI_PROVIDER", "OPENROUTER");
    expect(resolveAiProvider()).toBe("openrouter");
  });

  it("auto-detects openrouter when only OPENROUTER_API_KEY is present", () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GOOGLE_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test-key");
    expect(resolveAiProvider()).toBe("openrouter");
  });

  it("defaults to google when AI_PROVIDER is unset and GEMINI_API_KEY is present", () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(resolveAiProvider()).toBe("google");
  });

  it("defaults to google when neither key is present", () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(resolveAiProvider()).toBe("google");
  });

  it("evaluates isAiConfigured accurately for both providers", () => {
    // Google mode
    vi.stubEnv("AI_PROVIDER", "google");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isAiConfigured()).toBe(false);

    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    expect(isAiConfigured()).toBe(true);

    // OpenRouter mode
    vi.stubEnv("AI_PROVIDER", "openrouter");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(isAiConfigured()).toBe(false);

    vi.stubEnv("OPENROUTER_API_KEY", "openrouter-key");
    expect(isAiConfigured()).toBe(true);
  });
});

describe("CommonResumeAIProvider Initialization", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws AI_NOT_CONFIGURED if Google API key is missing", () => {
    vi.stubEnv("AI_PROVIDER", "google");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(() => new CommonResumeAIProvider()).toThrow(/GEMINI_API_KEY/);
  });

  it("throws AI_NOT_CONFIGURED if OpenRouter API key is missing", () => {
    vi.stubEnv("AI_PROVIDER", "openrouter");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(() => new CommonResumeAIProvider()).toThrow(/OPENROUTER_API_KEY/);
  });

  it("succeeds when configured for OpenRouter", () => {
    vi.stubEnv("AI_PROVIDER", "openrouter");
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-v1-test");
    vi.stubEnv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct");

    const provider = new CommonResumeAIProvider();
    expect(provider.provider).toBe("openrouter");
    expect(provider.model).toBe("meta-llama/llama-3.3-70b-instruct");
  });

  it("succeeds when configured for Google AI Studio", () => {
    vi.stubEnv("AI_PROVIDER", "google");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const provider = new CommonResumeAIProvider();
    expect(provider.provider).toBe("google");
    expect(provider.model).toBe("gemini-3.6-flash");
  });
});

describe("CommonResumeAIProvider Execution (OpenRouter Backend)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("successfully parses resume JSON via OpenRouter driver", async () => {
    const mockResumeResponse = {
      resume: sampleResume,
      warnings: [],
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(mockResumeResponse),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const provider = new CommonResumeAIProvider({
      provider: "openrouter",
      apiKey: "sk-or-test-key",
      model: "google/gemini-2.5-flash",
    });

    const result = await provider.parseLatexResume("Jane Doe resume source");
    expect(result.importer).toBe("ai");
    expect(result.resume.basics.name).toBe(sampleResume.basics.name);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-or-test-key",
        }),
      }),
    );
  });

  it("extracts JSON wrapped in markdown code fences from OpenRouter", async () => {
    const mockResumeResponse = {
      resume: sampleResume,
      warnings: [],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `\`\`\`json\n${JSON.stringify(mockResumeResponse)}\n\`\`\``,
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const provider = new CommonResumeAIProvider({
      provider: "openrouter",
      apiKey: "sk-or-test-key",
    });

    const result = await provider.parseLatexResume("Resume content");
    expect(result.resume.basics.name).toBe(sampleResume.basics.name);
  });

  it("repairs malformed output on first attempt and succeeds on repair", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      // First attempt: invalid JSON
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "{ malformed json",
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      // Second attempt (repair): valid JSON
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({ resume: sampleResume, warnings: [] }),
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const provider = new CommonResumeAIProvider({
      provider: "openrouter",
      apiKey: "sk-or-test-key",
    });

    const result = await provider.parseLatexResume("Jane Doe content");
    expect(result.resume.basics.name).toBe(sampleResume.basics.name);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("handles 401 authentication error without retrying", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { message: "Invalid API key", code: 401 },
        }),
        { status: 401, statusText: "Unauthorized" },
      ),
    );

    const provider = new CommonResumeAIProvider({
      provider: "openrouter",
      apiKey: "bad-key",
    });

    await expect(provider.parseLatexResume("content")).rejects.toThrow(/authentication failed/i);
    // Should NOT retry on 401
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("handles 402 insufficient credits error without retrying or entering repair loops", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message:
              "This request requires more credits, or fewer max_tokens. You requested up to 65535 tokens, but can only afford 16000.",
            code: 402,
          },
        }),
        { status: 402, statusText: "Payment Required" },
      ),
    );

    const provider = new CommonResumeAIProvider({
      provider: "openrouter",
      apiKey: "sk-or-test-key",
    });

    await expect(provider.parseLatexResume("content")).rejects.toThrow(/not have enough credit/i);
    // Should NOT retry or enter repair loop on 402
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("passes configured max_tokens to OpenRouter request body", async () => {
    vi.stubEnv("OPENROUTER_MAX_TOKENS", "4096");

    let capturedBody: { max_tokens?: number } | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string) as { max_tokens?: number };
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ resume: sampleResume, warnings: [] }) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const provider = new CommonResumeAIProvider({
      provider: "openrouter",
      apiKey: "sk-or-test-key",
    });

    await provider.parseLatexResume("content");
    expect(capturedBody?.max_tokens).toBe(4096);
  });

  it("retries on 429 rate limit with exponential backoff", async () => {
    const validOutput = { resume: sampleResume, warnings: [] };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      // Attempt 1: 429
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: "Rate limit reached", code: 429 } }),
          { status: 429, statusText: "Too Many Requests" },
        ),
      )
      // Attempt 2: 200 OK
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(validOutput) } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const provider = new CommonResumeAIProvider({
      provider: "openrouter",
      apiKey: "sk-or-test-key",
    });

    const result = await provider.parseLatexResume("content");
    expect(result.resume.basics.name).toBe(sampleResume.basics.name);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("analyzes job and validates comparison using mock guidance", async () => {
    const mockAnalysisResponse = {
      analysis: {
        company: "Acme",
        role: "Engineer",
        summary: "Role summary",
        requirements: [
          {
            id: "req-1",
            text: "TypeScript experience",
            category: "technology",
            importance: "required",
          },
        ],
        keywords: ["TypeScript"],
        primaryResponsibilities: ["Develop software"],
        senioritySignals: ["Mid-level"],
        domainSignals: ["Web"],
      },
      comparison: {
        entries: [
          {
            requirementId: "req-1",
            status: "supported",
            explanation: "Candidate has TypeScript experience.",
            evidence: [
              {
                type: "skill",
                entityId: "skills-languages",
                itemId: "skill-typescript",
                quote: "TypeScript",
              },
            ],
          },
        ],
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(mockAnalysisResponse),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const provider = new CommonResumeAIProvider({
      provider: "openrouter",
      apiKey: "sk-or-test-key",
    });

    const result = await provider.analyzeJob(
      sampleResume,
      {
        company: "Acme",
        role: "Engineer",
        description: "Looking for a TypeScript engineer.",
      },
      mockGuidance,
    );

    expect(result.analysis.company).toBe("Acme");
    expect(result.comparison.entries).toHaveLength(1);
  });
});
