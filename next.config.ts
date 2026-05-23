import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow same-WiFi mobile devices to load dev assets (/_next/*) via LAN IP.
  allowedDevOrigins: ["192.168.0.*", "192.168.1.*"],
};

export default nextConfig;
