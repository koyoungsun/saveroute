import type { NextConfig } from "next";

const VERCEL_GIT_COMMIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
const VERCEL_DEPLOYMENT_ID = process.env.VERCEL_DEPLOYMENT_ID ?? "";
const VERCEL_URL = process.env.VERCEL_URL ?? "";
const VERCEL_ENV = process.env.VERCEL_ENV ?? "";

const APP_BUILD_ID =
  VERCEL_GIT_COMMIT_SHA.slice(0, 7) ||
  VERCEL_DEPLOYMENT_ID.slice(0, 8) ||
  `local-${Date.now().toString(36)}`;

const nextConfig: NextConfig = {
  // Allow same-WiFi mobile devices to load dev assets (/_next/*) via LAN IP.
  allowedDevOrigins: ["192.168.0.*", "192.168.1.*"],
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: APP_BUILD_ID,
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: VERCEL_GIT_COMMIT_SHA,
    NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID: VERCEL_DEPLOYMENT_ID,
    NEXT_PUBLIC_VERCEL_URL: VERCEL_URL,
    NEXT_PUBLIC_VERCEL_ENV: VERCEL_ENV,
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
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/share-modal.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/debug-build",
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
