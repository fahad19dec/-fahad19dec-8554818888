import type { ConfigContext, ExpoConfig } from "expo/config";

import brand from "./brand.config";

// app.json holds the config; the brand's name, IDs and icon colors come from
// brand.config.js. The browser-only demo (EXPO_PUBLIC_DEMO=1, see
// scripts/build-demo.mjs) has no server, so it exports a single-page app.
export default ({ config }: ConfigContext): ExpoConfig => {
  const demo = process.env.EXPO_PUBLIC_DEMO === "1";
  return {
    ...(config as ExpoConfig),
    name: brand.name,
    slug: brand.slug,
    scheme: brand.scheme,
    ios: { ...config.ios, bundleIdentifier: brand.appId },
    android: {
      ...config.android,
      package: brand.appId,
      adaptiveIcon: { ...config.android?.adaptiveIcon, backgroundColor: brand.icon.background },
    },
    web: { ...config.web, output: demo ? "single" : config.web?.output },
    plugins: (config.plugins ?? []).map((plugin) =>
      Array.isArray(plugin) && plugin[0] === "expo-splash-screen"
        ? [plugin[0], { ...plugin[1], backgroundColor: brand.icon.background }]
        : plugin,
    ),
  };
};
