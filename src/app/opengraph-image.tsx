import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";
export const alt = "ArqeloCV — AI Resume Builder for Software Engineers";
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
          padding: "72px 80px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#fafafa",
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(34, 197, 94, 0.12) 0%, transparent 45%), radial-gradient(circle at 0% 100%, rgba(24, 24, 27, 0.8) 0%, transparent 50%)",
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
                border: "1.5px solid rgba(34, 197, 94, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#22c55e",
                fontSize: 26,
                fontWeight: 900,
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              A
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#f4f4f5" }}>
              ArqeloCV
            </span>
          </div>

          <div
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              border: "1px solid #27272a",
              backgroundColor: "#18181b",
              fontSize: 14,
              color: "#a1a1aa",
              fontFamily: "monospace",
              letterSpacing: "0.06em",
            }}
          >
            PDF · DOCX · LATEX
          </div>
        </div>

        {/* Center Hero Message */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1000px" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#22c55e",
              fontFamily: "monospace",
            }}
          >
            AI Resume Builder for Software Engineers
          </div>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              margin: 0,
              color: "#ffffff",
            }}
          >
            Tailored to the job.
            <br />
            <span style={{ color: "#a1a1aa" }}>Grounded in your actual experience.</span>
          </h1>
          <p
            style={{
              fontSize: 22,
              lineHeight: 1.45,
              color: "#a1a1aa",
              margin: 0,
              marginTop: "4px",
            }}
          >
            Build, improve, and tailor your engineering resume with AI. Factual accuracy safeguards, deterministic LaTeX output, and ATS-ready PDF exports.
          </p>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #27272a",
            paddingTop: "24px",
          }}
        >
          <div style={{ fontSize: 18, color: "#22c55e", fontFamily: "monospace", fontWeight: 600 }}>
            {siteConfig.url.replace("https://", "")}
          </div>
          <div style={{ fontSize: 14, color: "#71717a", fontFamily: "monospace" }}>
            Deterministic LaTeX · Zero Hallucinations · ATS-Friendly
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
