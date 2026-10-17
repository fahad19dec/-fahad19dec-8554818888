import { View } from "react-native";

import { Icon, PressableScale, Text, type IconName } from "@/components/ui";
import { cn } from "@/lib/cn";

// The lavender rows on a stay ("Ask about policies", its cancellation policy)
// and on Profile. `tile` puts the icon on a darker square, as the Ask row has
// in the design; without one the row is only as tall as its text.
export function PolicyCard({
  icon,
  title,
  subtitle,
  tile,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string | null;
  tile?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle].filter(Boolean).join(". ")}
      onPress={onPress}
      transitionProperty={["opacity"]}
      className="flex-row items-center gap-4 rounded-lg bg-lavender-soft py-3 pr-4 pl-3"
    >
      <View className={cn("w-13.5 items-center justify-center rounded-md", tile && "h-13.5 bg-lavender-muted")}>
        <Icon name={icon} size={tile ? 28 : 30} tone="accent" />
      </View>
      <View className="flex-1">
        <Text variant="subtitle">{title}</Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={2} className="mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Icon name="chevronRight" size={22} tone="accent" />
    </PressableScale>
  );
}
