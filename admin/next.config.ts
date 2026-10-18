import path from "node:path";

import type { NextConfig } from "next";

// The dashboard imports the guest app's data layer and brand straight from
// ../axe-stays (see tsconfig paths), so Turbopack's root is the repo root.
// Every page is gated on the signed-in admin and reads the live database, so
// pages render per request (no Cache Components).
const nextConfig: NextConfig = {
  cacheComponents: false,
  turbopack: {
    root: path.join(__dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  outputFileTracingRoot: path.join(__dirname, ".."),
  experimental: {
    // Admin listing form uploads photos through a server action.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
