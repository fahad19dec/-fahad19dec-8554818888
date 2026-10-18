import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import type { IconName } from "./icons";
import { Text } from "./text";

export type SegmentOption<T extends string> = { value: T; label: string; icon?: IconName };

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessibilityRole="tablist"
      className={cn("h-12 flex-row rounded-full bg-surface-muted p-1", className)}
      style={style}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              "flex-1 flex-row items-center justify-center gap-2 rounded-full active:opacity-70",
              selected && "bg-ink",
            )}
          >
            {option.icon && <Icon name={option.icon} size={20} tone={selected ? "inverse" : "ink"} />}
            <Text variant="label" tone={selected ? "inverse" : "ink"}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
