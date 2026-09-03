import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "AI Resume Builder — Evidence-Grounded LaTeX Resume Tailoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          padding: "64px 72px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#fafafa",
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(24, 24, 27, 0.8) 0%, transparent 60%)",
          border: "12px solid #18181b",
        }}
      >
        {/* Top Header / Branding */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                border: "1.5px solid rgba(34, 197, 94, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#22c55e",
                fontSize: 26,
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {"{ }"}
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "#f4f4f5" }}>
              AI Resume Builder
            </span>
          </div>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 9999,
              border: "1px solid #27272a",
              backgroundColor: "#18181b",
              fontSize: 14,
              color: "#a1a1aa",
              fontFamily: "monospace",
              letterSpacing: "0.08em",
            }}
          >
            PDF · DOCX · LATEX · WASM
          </div>
        </div>

        {/* Center Hero Message */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#22c55e",
              fontFamily: "monospace",
            }}
          >
            Evidence-Grounded Resume Tailoring
          </div>
          <h1
            style={{
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: 0,
              color: "#ffffff",
            }}
          >
            Tailor for any job description.
            <br />
            <span style={{ color: "#a1a1aa" }}>Zero hallucinations. Deterministic LaTeX.</span>
          </h1>
          <p
            style={{
              fontSize: 22,
              lineHeight: 1.4,
              color: "#71717a",
              margin: 0,
              marginTop: "8px",
            }}
          >
            Every bullet change is grounded in verifiable candidate evidence, checked with Zod schemas, and rendered through a dedicated TeX service.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
          {[
            { title: "ATS Guaranteed", subtitle: "Clean LaTeX glyphs & standard fonts" },
            { title: "TeX Live PDF", subtitle: "Compiles through a dedicated service" },
            { title: "Client-Side Privacy", subtitle: "Resumes never stored in remote DBs" },
            { title: "Atomic Diffs", subtitle: "Inspect & approve every modification" },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "16px 18px",
                backgroundColor: "#121215",
                border: "1px solid #27272a",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5" }}>
                {feature.title}
              </div>
              <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.3 }}>
                {feature.subtitle}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
