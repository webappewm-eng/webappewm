import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com"
      },
      {
        protocol: "https",
        hostname: "engineer-with-me-blog.firebasestorage.app"
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/icons/icon.svg",
        destination: "/icon.svg"
      },
      {
        source: "/favicon.ico",
        destination: "/icon.svg"
      }
    ];
  }
};

export default nextConfig;
