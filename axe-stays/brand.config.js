// @ts-check
// The brand: name, copy, logo and every color, in one place.
//
// Change this file to rebrand the app, then restart the dev server:
// - Colors become the theme tokens (bg-primary, text-ink…) through
//   src/theme/brand.generated.css, which metro.config.js writes on start.
// - Name, slug, scheme and IDs feed app.config.ts.
// - Copy and the logo are read in the app through src/brand.ts.
// - App icons and the splash image are drawn from `logo` and `icon` by
//   `python3 scripts/brand-icons.py` (needs Pillow); rerun it after changes.

module.exports = {
  name: "Axe Stays",
  /** Shown as the wordmark beside the logo. */
  wordmark: "Axe Stays",
  tagline: "Stays worth the trip",
  /** Used for package names, storage keys and the demo password. */
  slug: "axe-stays",
  /** Deep link scheme: axestays://stay/<slug>. */
  scheme: "axestays",
  /** iOS bundle identifier and Android package. */
  appId: "com.axestays.app",
  /** The badge on a guest's profile. */
  memberBadge: "Axe Stays Explorer",
  supportName: "Axe Stays support",

  // Theme colors. Keys become Tailwind tokens (camelCase → kebab-case:
  // primarySoft → bg-primary-soft). Components pick colors by role, so keep
  // the keys and change the values.
  colors: {
    primary: "#ff7a3d", // ember orange: main buttons, selected category, stars
    primarySoft: "#ffede3",
    secondary: "#a9c4d4", // axe-blade steel: selected filters, the guest's Ask bubbles
    secondarySoft: "#eef4f8", // focused fields, active filter chips
    secondaryMuted: "#d9e6ee", // icon tiles on secondary cards
    accent: "#1e6b52", // pine: links and text selection
    ink: "#14181f", // charcoal text and icons
    inkMuted: "#5f6773",
    inkSubtle: "#9aa3ae",
    surface: "#ffffff",
    surfaceMuted: "#f3f5f6",
    border: "#e2e6e9",
    glass: "rgba(255, 255, 255, 0.7)",
    scrim: "rgba(20, 24, 31, 0.45)", // dark pill on photos
    scrimBorder: "rgba(255, 255, 255, 0.35)",
    success: "#1a7f50",
    successSoft: "#e3f4ec",
    danger: "#e03a45",
    dangerSoft: "#fde4ea",
    promoSoft: "#fee9f0",
    info: "#1d3fbf",
    infoSoft: "#eaf0fd",
  },

  // The logo: an axe in a 100×100 box. `handle` runs bottom to top with
  // round ends; `head` and `poll` are polygons.
  logo: {
    handle: [
      [19.1, 83.2],
      [49.1, 17.2],
    ],
    handleWidth: 9,
    head: [
      [49.0, 17.4], [80.9, 19.8], [80.7, 23.5], [80.3, 27.0], [79.7, 30.5], [78.9, 33.9],
      [77.8, 37.2], [76.5, 40.3], [75.0, 43.4], [73.2, 46.3], [71.2, 49.2], [69.0, 51.9],
      [66.6, 54.6], [63.9, 57.1], [42.8, 31.1],
    ],
    poll: [
      [49.0, 17.4],
      [40.5, 16.8],
      [35.9, 26.8],
      [42.8, 31.1],
    ],
    handleColor: "#f3e3cf", // ash wood, on dark backgrounds
    headColor: "#ff7a3d",
  },

  /** App icon and splash. */
  icon: {
    background: "#14181f",
  },
};
