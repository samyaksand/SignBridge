import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    dangerouslyAllowSVG: true,
    // Cloudflare Workers has no image optimization server; all images here
    // are local SVGs/static files already sized at render time.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
