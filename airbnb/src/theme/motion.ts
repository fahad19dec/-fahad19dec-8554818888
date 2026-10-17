import { Easing, cubicBezier } from "react-native-reanimated";

// Motion tokens for Reanimated and other JS-driven animation.
// Visual tokens (color, type, spacing, radius, shadow) live in src/global.css.
export const motion = {
  fast: 150, // state feedback: press, toggle
  base: 250, // element transitions: enter/exit
  slow: 400, // large surfaces: sheets, screens
  stagger: 40, // between list items entering
  pulse: 900, // one leg of a loading skeleton's pulse
  press: { scale: 0.97, duration: 120 },
  // Strong ease-out for UI, ease-in-out for on-screen movement. Never ease-in.
  easeOut: Easing.bezier(0.23, 1, 0.32, 1), // withTiming, layout builders
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  cssEaseOut: cubicBezier(0.23, 1, 0.32, 1), // Reanimated CSS transitions
  cssEaseInOut: cubicBezier(0.77, 0, 0.175, 1), // Reanimated CSS animations that loop
  spring: { duration: 400, dampingRatio: 1 }, // settle without overshoot
} as const;
