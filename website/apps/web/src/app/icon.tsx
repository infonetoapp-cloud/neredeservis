import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
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
          background:
            "radial-gradient(circle at 20% 20%, rgba(37,99,235,0.35), transparent 45%), linear-gradient(160deg, #f8fafc 0%, #e0e7ff 100%)",
          borderRadius: "7px",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          fontWeight: 800,
          fontSize: 14,
          color: "#1d4ed8",
        }}
      >
        NS
      </div>
    ),
    size,
  );
}
