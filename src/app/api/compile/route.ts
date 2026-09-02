import { z } from "zod";

export const runtime = "nodejs";

const CompileRequestSchema = z.object({
  source: z.string().min(1).max(2_000_000),
  engine: z.enum(["pdflatex", "xelatex"]).optional().default("pdflatex"),
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(240),
        content: z.string().max(10_000_000),
      })
    )
    .optional(),
});

export async function GET() {
  const compilerUrl = process.env.LATEX_COMPILER_URL?.trim();
  if (!compilerUrl) {
    return Response.json({
      available: false,
      configured: false,
      message: "LATEX_COMPILER_URL environment variable is not configured.",
    });
  }

  try {
    const healthUrl = `${compilerUrl.replace(/\/$/, "")}/health`;
    const res = await fetch(healthUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return Response.json({
        available: true,
        configured: true,
        engines: (data as { engines?: string[] }).engines ?? ["pdflatex", "xelatex"],
      });
    }
    return Response.json({
      available: false,
      configured: true,
      message: `Compiler service returned HTTP ${res.status}`,
    });
  } catch (error) {
    return Response.json({
      available: false,
      configured: true,
      message: error instanceof Error ? error.message : "Unable to reach compiler service",
    });
  }
}

export async function POST(request: Request) {
  const compilerUrl = process.env.LATEX_COMPILER_URL?.trim();

  if (!compilerUrl) {
    return Response.json(
      {
        success: false,
        errors: [
          {
            code: "runtime",
            message:
              "Remote LaTeX compiler is not configured. Set LATEX_COMPILER_URL in your environment or use the local WebAssembly compiler.",
          },
        ],
        logs: "LATEX_COMPILER_URL environment variable is empty.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        errors: [{ code: "runtime", message: "Invalid JSON payload in request." }],
        logs: "",
      },
      { status: 400 }
    );
  }

  const parsed = CompileRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        errors: [{ code: "runtime", message: parsed.error.issues[0]?.message || "Invalid compile parameters." }],
        logs: "",
      },
      { status: 400 }
    );
  }

  const targetUrl = `${compilerUrl.replace(/\/$/, "")}/compile`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(45_000),
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    const message = isTimeout
      ? "Remote compilation timed out after 45 seconds (Cloud Run cold start or heavy document)."
      : error instanceof Error
      ? error.message
      : "Failed to connect to remote LaTeX compiler.";

    return Response.json(
      {
        success: false,
        errors: [{ code: "runtime", message }],
        logs: `Error forwarding to ${targetUrl}: ${message}`,
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
