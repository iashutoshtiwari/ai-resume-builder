export type ApiErrorCode =
  | "BAD_REQUEST"
  | "PAYLOAD_TOO_LARGE"
  | "AI_NOT_CONFIGURED"
  | "INVALID_MODEL"
  | "RATE_LIMITED"
  | "INSUFFICIENT_CREDITS"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_MODEL_OUTPUT"
  | "SEMANTIC_VALIDATION_FAILED"
  | "REQUEST_TIMEOUT"
  | "FORBIDDEN"
  | "DAILY_QUOTA_EXCEEDED";

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly retryable = false,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function apiErrorResponse(error: unknown): Response {
  const appError = error instanceof AppError
    ? error
    : new AppError("PROVIDER_UNAVAILABLE", "The AI provider could not complete this request.", 502, true);
  return Response.json(
    {
      error: {
        code: appError.code,
        message: appError.message,
        retryable: appError.retryable,
        ...(process.env.NODE_ENV !== "production" && appError.details ? { details: appError.details } : {}),
      },
    },
    { status: appError.status },
  );
}
