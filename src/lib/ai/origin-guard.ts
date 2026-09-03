import "server-only";

export function verifyOrigin(request: Request): { allowed: boolean; reason?: string } {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.DISABLE_ORIGIN_GUARD === "true"
  ) {
    return { allowed: true };
  }

  // 1. Check Sec-Fetch-Site header (browser security metadata)
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite && secFetchSite === "cross-site") {
    return {
      allowed: false,
      reason: "Cross-origin requests to AI endpoints are forbidden.",
    };
  }

  // 2. Validate Origin header against current Host
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      const hostWithoutPort = host.split(":")[0];
      const originHostWithoutPort = originUrl.hostname;

      // Allow localhost in development
      const isLocal =
        (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") &&
        (originHostWithoutPort === "localhost" || originHostWithoutPort === "127.0.0.1");

      if (!isLocal && originHostWithoutPort !== hostWithoutPort) {
        return {
          allowed: false,
          reason: `Origin mismatch: request from ${originUrl.host} not permitted.`,
        };
      }
    } catch {
      return {
        allowed: false,
        reason: "Invalid origin header.",
      };
    }
  }

  return { allowed: true };
}
