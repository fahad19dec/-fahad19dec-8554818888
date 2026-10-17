import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import { Text } from "./text";

export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  accessibilityLabel,
  className,
  style,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** What is being counted, e.g. "Guests". */
  accessibilityLabel: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const canDecrement = value > min;
  const canIncrement = value < max;
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: String(value) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 1 : -1)}
      className={cn("h-12 flex-row items-center self-start rounded-full border border-border bg-surface px-1", className)}
      style={style}
    >
      <Pressable
        disabled={!canDecrement}
        onPress={() => step(-1)}
        className={cn("size-10 items-center justify-center active:opacity-70", !canDecrement && "opacity-40")}
      >
        <Icon name="minus" size={20} />
      </Pressable>
      <Text variant="subtitle" className="min-w-8 text-center">
        {value}
      </Text>
      <Pressable
        disabled={!canIncrement}
        onPress={() => step(1)}
        className={cn("size-10 items-center justify-center active:opacity-70", !canIncrement && "opacity-40")}
      >
        <Icon name="plus" size={20} />
      </Pressable>
    </View>
  );
}
