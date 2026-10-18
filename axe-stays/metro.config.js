const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const { writeBrandTheme } = require("./scripts/brand-theme");

// Brand colors (brand.config.js) become theme tokens before anything bundles.
writeBrandTheme();

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
