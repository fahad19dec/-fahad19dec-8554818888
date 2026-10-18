// Writes src/theme/brand.generated.css from brand.config.js: every brand
// color as a Tailwind theme token. metro.config.js runs this on every start,
// so the CSS always matches the config. Don't edit the generated file.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "src/theme/brand.generated.css");

const kebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function brandThemeCss() {
  delete require.cache[require.resolve("../brand.config")];
  const brand = require("../brand.config");
  const lines = Object.entries(brand.colors).map(([key, value]) => `  --color-${kebab(key)}: ${value};`);
  return [
    "/* Generated from brand.config.js by scripts/brand-theme.js. Don't edit. */",
    "@theme {",
    "  /* Only brand colors exist; Tailwind's default palette is removed. */",
    "  --color-*: initial;",
    ...lines,
    "}",
    "",
  ].join("\n");
}

function writeBrandTheme() {
  const css = brandThemeCss();
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (current !== css) fs.writeFileSync(target, css);
}

module.exports = { writeBrandTheme, brandThemeCss };

if (require.main === module) writeBrandTheme();
