import { describe, expect, it, beforeEach } from "vitest";
import { getCachedAiResponse, setCachedAiResponse, _resetAiCache } from "@/lib/ai/cache";

describe("AI Response Cache", () => {
  beforeEach(() => {
    _resetAiCache();
  });

  it("stores and retrieves cached value", () => {
    setCachedAiResponse("key-1", { test: "data" });
    const cached = getCachedAiResponse<{ test: string }>("key-1");
    expect(cached).toEqual({ test: "data" });
  });

  it("returns undefined for non-existent or expired keys", () => {
    setCachedAiResponse("key-expired", { test: "old" }, -100);
    expect(getCachedAiResponse("key-expired")).toBeUndefined();
    expect(getCachedAiResponse("key-missing")).toBeUndefined();
  });
});
