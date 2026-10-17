// Foreground colors shared by Text and Icon. Pick by meaning, not by hue.
export const tones = {
  ink: "text-ink",
  muted: "text-ink-muted",
  subtle: "text-ink-subtle",
  inverse: "text-surface",
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  danger: "text-danger",
  info: "text-info",
} as const;

export type Tone = keyof typeof tones;
