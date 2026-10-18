import { View, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import type { IconName } from "./icons";
import { Text } from "./text";
import type { Tone } from "./tones";

const tones = {
  primary: { container: "bg-primary-soft", text: "ink" },
  success: { container: "bg-success-soft", text: "success" },
  promo: { container: "bg-promo-soft", text: "ink" },
  info: { container: "bg-info-soft", text: "info" },
} as const satisfies Record<string, { container: string; text: Tone }>;

export function Badge({
  label,
  tone = "primary",
  icon,
  className,
  style,
}: {
  label: string;
  tone?: keyof typeof tones;
  icon?: IconName;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = tones[tone];
  return (
    <View
      className={cn("h-9 flex-row items-center gap-2 self-start rounded-full px-4", t.container, className)}
      style={style}
    >
      {/* The star keeps the brand yellow, as in the sheet's "Guest favorite" tag. */}
      {icon && <Icon name={icon} size={18} tone={icon === "star" ? "primary" : t.text} />}
      <Text variant="caption" tone={t.text}>
        {label}
      </Text>
    </View>
  );
}
