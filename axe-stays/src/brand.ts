import config from "../brand.config";

// The brand (brand.config.js) for app code: its name, copy, logo and colors.
// Style with theme classes (bg-primary…); read `brand.colors` only where a
// component takes a color value instead of a class, like the SVG logo.
export const brand = config;

/** Puts the brand name into stored text written with a {{brand}} placeholder (the sample policies). */
export const withBrand = (text: string) => text.replaceAll("{{brand}}", brand.name);
