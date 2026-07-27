import type { NextConfig } from "next";
// @ts-ignore
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "sunu-boutik-cache",
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

export default withPWA(nextConfig);
