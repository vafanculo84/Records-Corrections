import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  allowedDevOrigins: ["*.base44.app", "*.base44.com"],
};

export default nextConfig;
