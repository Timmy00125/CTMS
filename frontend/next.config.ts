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
        source: "/academic-sessions/:path*",
        destination: "http://localhost:3001/academic-sessions/:path*",
      },
      {
        source: "/students",
        destination: "http://localhost:3001/students",
      },
      {
        source: "/students/:path*",
        destination: "http://localhost:3001/students/:path*",
      },
      {
        source: "/grades/:path*",
        destination: "http://localhost:3001/grades/:path*",
      },
      {
        source: "/gpa/:path*",
        destination: "http://localhost:3001/gpa/:path*",
      },
      {
        source: "/ingestion/:path*",
        destination: "http://localhost:3001/ingestion/:path*",
      },
      {
        source: "/courses",
        destination: "http://localhost:3001/courses",
      },
      {
        source: "/courses/:path*",
        destination: "http://localhost:3001/courses/:path*",
      },
    ];
  },
};

export default nextConfig;
