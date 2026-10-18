import { SymbolView } from "expo-symbols";
import medium from "expo-symbols/androidWeights/medium";
import { styled } from "nativewind";
import { Platform } from "react-native";

import { brand } from "@/brand";

import { cn } from "@/lib/cn";

import { icons, type IconName } from "./icons";
import { tones, type Tone } from "./tones";

// Maps the `text-*` tone class to the symbol's tint, so icon colors come from tokens.
const StyledSymbol = styled(SymbolView, {
  className: { target: "style", nativeStyleMapping: { color: "tintColor" } },
});

// On web the symbol only reads a `tintColor` prop (the className mapping
// above is native-only), so web gets the tone's brand color directly.
const webTint: Record<Tone, string> = {
  ink: brand.colors.ink,
  muted: brand.colors.inkMuted,
  subtle: brand.colors.inkSubtle,
  inverse: brand.colors.surface,
  primary: brand.colors.primary,
  accent: brand.colors.accent,
  success: brand.colors.success,
  danger: brand.colors.danger,
  info: brand.colors.info,
};

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
      tintColor={Platform.OS === "web" ? webTint[tone] : undefined}
      style={{ width: size, height: size }}
    />
  );
}
