import { SymbolView } from "expo-symbols";
import medium from "expo-symbols/androidWeights/medium";
import { styled } from "nativewind";

import { cn } from "@/lib/cn";

import { icons, type IconName } from "./icons";
import { tones, type Tone } from "./tones";

// Maps the `text-*` tone class to the symbol's tint, so icon colors come from tokens.
const StyledSymbol = styled(SymbolView, {
  className: { target: "style", nativeStyleMapping: { color: "tintColor" } },
});

export function Icon({
  name,
  size = 24,
  tone = "ink",
  className,
}: {
  name: IconName;
  size?: number;
  tone?: Tone;
  /** Layout classes only; color comes from `tone`. */
  className?: string;
}) {
  return (
    <StyledSymbol
      name={icons[name]}
      size={size}
      // Medium matches the sheet's 2px line icons better than the default regular.
      weight={{ ios: "medium", android: medium }}
      className={cn(tones[tone], className)}
      style={{ width: size, height: size }}
    />
  );
}
