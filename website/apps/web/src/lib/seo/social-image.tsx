import { ImageResponse } from "next/og";

type SocialImageOptions = {
  width: number;
  height: number;
  badgeLabel: string;
};

const baseStyles = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  padding: "64px",
  background:
    "radial-gradient(circle at 15% 20%, rgba(37,99,235,0.22), transparent 45%), radial-gradient(circle at 85% 15%, rgba(15,23,42,0.12), transparent 45%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  color: "#0f172a",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};

export function createNeredeServisSocialImage(options: SocialImageOptions) {
  const { width, height, badgeLabel } = options;

  return new ImageResponse(
    (
      <div style={baseStyles}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                border: "1px solid rgba(37,99,235,0.25)",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1d4ed8",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              NS
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: 700 }}>NeredeServis</div>
              <div style={{ fontSize: "16px", color: "#475569" }}>
                Servis operasyon platformu
              </div>
            </div>
          </div>
          <div
            style={{
              borderRadius: "999px",
              border: "1px solid rgba(15,23,42,0.1)",
              background: "rgba(255,255,255,0.9)",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            {badgeLabel}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "58px",
              lineHeight: "1.06",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              maxWidth: "86%",
            }}
          >
            Canli operasyon, rota yonetimi ve sefer kontrolu
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#334155",
              maxWidth: "78%",
              lineHeight: "1.35",
            }}
          >
            Firma ve bireysel sofor akislarini tek web panelde yonetin.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#1e293b",
            fontSize: "18px",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "999px",
              background: "#10b981",
            }}
          />
          app.neredeservis.app
        </div>
      </div>
    ),
    { width, height },
  );
}

