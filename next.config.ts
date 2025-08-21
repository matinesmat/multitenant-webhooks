// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Either of these works. Choose one approach:
    // 1) Simple domains allowlist:
    domains: ["i.pravatar.cc"],

    // 2) Or more explicit remote patterns:
    // remotePatterns: [
    //   {
    //     protocol: "https",
    //     hostname: "i.pravatar.cc",
    //   },
    // ],
  },
};

export default nextConfig;
