import { View } from "react-native";

import { brand } from "@/brand";
import { Text } from "@/components/ui";

import { LogoMark } from "./logo-mark";

const sizes = {
  lg: { text: "display", mark: 60 },
  header: { text: "jumbo", mark: 54 },
  md: { text: "heading", mark: 34 },
} as const;

// The brand's axe mark and its lowercase name, both from brand.config.js.
export function Wordmark({ size = "lg" }: { size?: keyof typeof sizes }) {
  const s = sizes[size];
  return (
    <View className="flex-row items-center gap-2" accessible accessibilityRole="header" accessibilityLabel={brand.name}>
      <LogoMark size={s.mark} />
      <Text variant={s.text}>{brand.wordmark}</Text>
    </View>
  );
}
