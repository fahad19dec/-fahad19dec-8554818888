import type { ConfigContext, ExpoConfig } from "expo/config";

// app.json holds the config. The browser-only demo (EXPO_PUBLIC_DEMO=1, see
// scripts/build-demo.mjs) has no server, so it exports a single-page app.
export default ({ config }: ConfigContext): ExpoConfig => {
  const demo = process.env.EXPO_PUBLIC_DEMO === "1";
  return {
    ...(config as ExpoConfig),
    web: { ...config.web, output: demo ? "single" : config.web?.output },
  };
};
