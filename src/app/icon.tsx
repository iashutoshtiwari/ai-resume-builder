import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          border: "1.5px solid rgba(34, 197, 94, 0.6)",
          borderRadius: 6,
          color: "#22c55e",
          fontSize: 16,
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
