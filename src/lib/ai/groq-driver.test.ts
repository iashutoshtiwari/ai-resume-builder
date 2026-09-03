import { describe, expect, it, vi, beforeEach } from "vitest";
import { callGroq, configuredGroqModel } from "@/lib/ai/groq-driver";
import { AppError } from "@/lib/ai/errors";

describe("Groq Driver", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to openai/gpt-oss-120b model", () => {
    expect(configuredGroqModel()).toBe("openai/gpt-oss-120b");
  });

  it("sends valid OpenAI-compatible chat completion payload and returns message content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ resume: { basics: { name: "Jane Doe" } } }),
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await callGroq(["system prompt", "user prompt"], "llama-3.3-70b-versatile", "gsk-test");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer gsk-test");
    expect(JSON.parse(options.body)).toMatchObject({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "system prompt" },
        { role: "user", content: "user prompt" },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(result);
    expect(parsed.resume.basics.name).toBe("Jane Doe");
  });

  it("maps 401 status to AI_NOT_CONFIGURED error without retry", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: { message: "Invalid API Key" } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      callGroq(["system", "user"], "llama-3.3-70b-versatile", "invalid-key"),
    ).rejects.toThrow(AppError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
