import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { cn } from "@/lib/cn";

import { tones, type Tone } from "./tones";

// The type ramp. Each step pairs a size token with a font family, since
// custom fonts get their weight from the family, not from fontWeight.
export const textVariants = {
  display: "font-jakarta-bold text-display",
  jumbo: "font-jakarta-bold text-jumbo",
  hero: "font-jakarta-bold text-hero",
  headline: "font-jakarta-bold text-headline",
  heading: "font-jakarta-bold text-heading",
  stayTitle: "font-jakarta-bold text-stay-title",
  cardTitle: "font-jakarta-bold text-card-title",
  stat: "font-jakarta-bold text-stat",
  title: "font-jakarta-bold text-title",
  subtitle: "font-jakarta-semibold text-subtitle",
  body: "font-jakarta text-body",
  lead: "font-jakarta-medium text-lead",
  label: "font-jakarta-medium text-label",
  link: "font-jakarta-semibold text-label underline",
  button: "font-jakarta-semibold text-button",
  buttonSecondary: "font-jakarta-medium text-button",
  caption: "font-jakarta-medium text-caption",
  footnote: "font-jakarta-medium text-footnote",
} as const;

export type TextVariant = keyof typeof textVariants;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: Tone;
  /** Layout classes only; size, family and color come from `variant` and `tone`. */
  className?: string;
};

export function Text({ variant = "body", tone = "ink", className, ...props }: TextProps) {
  return <RNText className={cn(textVariants[variant], tones[tone], className)} {...props} />;
}
