import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 18% 18%, rgba(37,99,235,0.2), transparent 45%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            width: 98,
            height: 98,
            borderRadius: 28,
            border: "1px solid rgba(37,99,235,0.24)",
            background: "rgba(255,255,255,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1d4ed8",
            fontSize: 40,
            fontWeight: 800,
          }}
        >
          NS
        </div>
      </div>
    ),
    size,
  );
}
