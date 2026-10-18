import { useWindowDimensions, View } from "react-native";

import { brand } from "@/brand";
import { Text } from "@/components/ui";

import { LogoMark } from "./logo-mark";

// "heading" leaves line height below the baseline; the tighter "headline"
// clipped the descender of the "y" because the name is kept to one line.
const sizes = {
  lg: { text: "heading", mark: 42 },
  header: { text: "heading", mark: 42 },
  md: { text: "heading", mark: 34 },
} as const;

// Below this width the full name doesn't fit beside a header button at the large sizes.
const NARROW = 360;

// The brand's axe mark and its wordmark, both from brand.config.js.
export function Wordmark({ size = "lg" }: { size?: keyof typeof sizes }) {
  const narrow = useWindowDimensions().width < NARROW;
  const s = sizes[narrow ? "md" : size];
  return (
    <View className="shrink flex-row items-center gap-2" accessible accessibilityRole="header" accessibilityLabel={brand.name}>
      <LogoMark size={s.mark} />
      {/* Shrinks rather than pushing the header's buttons off narrow screens. */}
      <Text variant={s.text} numberOfLines={1} className="shrink">
        {brand.wordmark}
      </Text>
    </View>
  );
}
