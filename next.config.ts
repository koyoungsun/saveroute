import type { NextConfig } from "next";

const APP_BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  process.env.VERCEL_DEPLOYMENT_ID?.slice(0, 8) ??
  `local-${Date.now().toString(36)}`;

const nextConfig: NextConfig = {
  // Allow same-WiFi mobile devices to load dev assets (/_next/*) via LAN IP.
  allowedDevOrigins: ["192.168.0.*", "192.168.1.*"],
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: APP_BUILD_ID,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
