import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "10.77.136.214",
    "http://10.77.136.214:3000",
    "http://10.77.136.214",
  ],
  devIndicators: false,
};

export default nextConfig;
