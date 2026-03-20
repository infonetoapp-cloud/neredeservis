import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline' https:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-src 'self' https://challenges.cloudflare.com https://www.openstreetmap.org https://openstreetmap.org",
              "connect-src 'self' https: wss:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
