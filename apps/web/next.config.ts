import type { NextConfig } from "next";

const backend = (process.env.API_INTERNAL_ORIGIN ?? "http://127.0.0.1:8000").replace(/\/$/, "");

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // All browser requests go to the Next.js origin. The upstream API sets
    // a host-only HttpOnly cookie through this same-origin reverse proxy.
    return [
      { source: "/api/auth/:path*", destination: `${backend}/api/v1/auth/:path*` },
      { source: "/api/workspaces", destination: `${backend}/api/v1/workspaces` },
      { source: "/api/workspaces/:path*", destination: `${backend}/api/v1/workspaces/:path*` },
    ];
  },
};

export default config;

