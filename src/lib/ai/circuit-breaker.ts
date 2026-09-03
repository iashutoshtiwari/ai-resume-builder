import "server-only";

interface DailyRecord {
  date: string;
  count: number;
}

const DEFAULT_DAILY_LIMIT = 500;

let currentRecord: DailyRecord = {
  date: new Date().toISOString().slice(0, 10),
  count: 0,
};

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureCurrentDate(): void {
  const today = getTodayString();
  if (currentRecord.date !== today) {
    currentRecord = { date: today, count: 0 };
  }
}

export function configuredDailyLimit(): number {
  const envVal = process.env.DAILY_AI_REQUEST_LIMIT?.trim();
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_DAILY_LIMIT;
}

export function checkDailyBudget(maxLimitOverride?: number): {
  allowed: boolean;
  remaining: number;
  totalToday: number;
  limit: number;
} {
  if (process.env.DISABLE_CIRCUIT_BREAKER === "true") {
    return { allowed: true, remaining: 9999, totalToday: 0, limit: 9999 };
  }

  ensureCurrentDate();
  const limit = maxLimitOverride ?? configuredDailyLimit();

  if (currentRecord.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      totalToday: currentRecord.count,
      limit,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - currentRecord.count),
    totalToday: currentRecord.count,
    limit,
  };
}

export function recordAiRequest(): void {
  ensureCurrentDate();
  currentRecord.count += 1;
}

export function _resetCircuitBreaker(): void {
  currentRecord = { date: getTodayString(), count: 0 };
}
