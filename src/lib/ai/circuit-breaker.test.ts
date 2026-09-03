import { describe, expect, it, beforeEach } from "vitest";
import {
  checkDailyBudget,
  recordAiRequest,
  _resetCircuitBreaker,
} from "@/lib/ai/circuit-breaker";

describe("Circuit Breaker", () => {
  beforeEach(() => {
    _resetCircuitBreaker();
  });

  it("permits requests within daily budget limit", () => {
    const status = checkDailyBudget(5);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(5);
    expect(status.totalToday).toBe(0);
  });

  it("increments usage and accurately tracks remaining requests", () => {
    recordAiRequest();
    recordAiRequest();

    const status = checkDailyBudget(5);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(3);
    expect(status.totalToday).toBe(2);
  });

  it("trips circuit breaker when daily limit is exhausted", () => {
    for (let i = 0; i < 4; i++) {
      recordAiRequest();
    }

    const status = checkDailyBudget(4);
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
    expect(status.totalToday).toBe(4);
  });
});
