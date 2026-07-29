import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

// @ducanh2912/next-pwa injects a `webpack` key into the config unconditionally
// (even when `disable: true`), which Next.js 16 treats as an incompatible
// webpack config for Turbopack (the default in dev). Since PWA is disabled in
// dev anyway, skip the wrapper entirely so `next dev` runs on Turbopack.
// @ts-ignore
const withPWA = isDev
  ? null
  : require("@ducanh2912/next-pwa").default({
      dest: "public",
      cacheOnFrontEndNav: true,
      aggressiveFrontEndNavCaching: true,
      reloadOnOnline: true,
      disable: false,
      workboxOptions: {
        disableDevLogs: true,
      },
    });

export default isDev ? nextConfig : withPWA(nextConfig);
