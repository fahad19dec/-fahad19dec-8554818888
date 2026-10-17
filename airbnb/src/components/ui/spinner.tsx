import { ActivityIndicator } from "react-native";
import { styled } from "nativewind";

import { cn } from "@/lib/cn";

import { tones, type Tone } from "./tones";

// Lets the spinner take its color from a token class.
const StyledIndicator = styled(ActivityIndicator, {
  className: { target: "style", nativeStyleMapping: { color: "color" } },
});

export function Spinner({
  tone = "muted",
  size = "small",
  accessibilityLabel,
  className,
}: {
  tone?: Tone;
  size?: "small" | "large";
  accessibilityLabel?: string;
  /** Layout classes only; color comes from `tone`. */
  className?: string;
}) {
  return (
    <StyledIndicator
      size={size}
      accessibilityLabel={accessibilityLabel}
      className={cn(tones[tone], className)}
    />
  );
}
