import { z } from "zod";

export const runtime = "nodejs";

const CompileRequestSchema = z.object({
  source: z.string().min(1).max(200_000, "This LaTeX document is too large to compile."),
  engine: z.enum(["pdflatex", "xelatex"]).optional().default("pdflatex"),
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(240).regex(/^[^\\/:*?"<>|]+$/, "Use a plain filename without folders."),
        content: z.string().max(8_000_000),
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
      message: "PDF compilation is not configured for this environment.",
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
      message: "PDF compilation is temporarily unavailable. Please try again shortly.",
    });
  } catch {
    return Response.json({
      available: false,
      configured: true,
      message: "PDF compilation is temporarily unavailable. Please try again shortly.",
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
              "PDF compilation is not configured for this environment. You can still edit and download the LaTeX source.",
          },
        ],
        logs: "",
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
      ? "PDF compilation took too long and was stopped. Please try again."
      : "PDF compilation is temporarily unavailable. Please try again shortly.";

    return Response.json(
      {
        success: false,
        errors: [{ code: "runtime", message }],
        logs: "",
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
