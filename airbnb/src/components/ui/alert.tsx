import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import { Text } from "./text";

const tones = {
  success: { container: "bg-success-soft", tone: "success", icon: "success" },
  danger: { container: "bg-danger-soft", tone: "danger", icon: "error" },
} as const;

export function Alert({
  message,
  tone = "success",
  onDismiss,
  className,
  style,
}: {
  message: string;
  tone?: keyof typeof tones;
  onDismiss?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = tones[tone];
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={cn("min-h-12 flex-row items-center gap-3 rounded-md corner-squircle px-4 py-3", t.container, className)}
      style={style}
    >
      <Icon name={t.icon} size={28} tone={t.tone} />
      <Text variant="caption" tone={t.tone} className="flex-1">
        {message}
      </Text>
      {onDismiss && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={12}
          onPress={onDismiss}
          className="active:opacity-70"
        >
          <Icon name="close" size={18} tone={t.tone} />
        </Pressable>
      )}
    </View>
  );
}
