import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: "http://localhost:3001/auth/:path*",
      },
      {
        source: "/transcript/:path*",
        destination: "http://localhost:3001/transcript/:path*",
      },
      {
        source: "/academic-sessions",
        destination: "http://localhost:3001/academic-sessions",
      },
      {
        source: "/students",
        destination: "http://localhost:3001/students",
      },
    ];
  },
};

export default nextConfig;
