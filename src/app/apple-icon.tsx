import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          border: "4px solid rgba(34, 197, 94, 0.6)",
          borderRadius: 36,
          color: "#22c55e",
          fontSize: 90,
          fontWeight: 800,
          fontFamily: "monospace",
        }}
      >
        {"{}"}
      </div>
    ),
    { ...size }
  );
}
