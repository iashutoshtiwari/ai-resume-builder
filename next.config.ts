import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    resolveAlias: {
      "blake3-wasm/browser.js": "./src/lib/vendor/blake3-shim.ts",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
