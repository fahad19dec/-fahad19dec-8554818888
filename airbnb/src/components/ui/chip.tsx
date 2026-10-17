import type { StyleProp, ViewStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import type { IconName } from "./icons";
import { PressableScale, type PressableScaleProps } from "./pressable-scale";
import { Text } from "./text";

const sizes = {
  md: { container: "h-12", text: "label", icon: 20 },
  sm: { container: "h-11", text: "footnote", icon: 18 },
  xs: { container: "h-9", text: "label", icon: 16 }, // Search's constraint chips
} as const;

const selectedTones = {
  lavender: "border-lavender bg-lavender",
  primary: "border-primary bg-primary",
} as const;

// Unselected look: outlined for filters, filled gray for Home's categories.
const variants = {
  outline: { idle: "border-border bg-surface", padding: { md: "px-6", sm: "px-4", xs: "px-4" } },
  filled: { idle: "border-surface-muted bg-surface-muted", padding: { md: "px-4", sm: "px-3", xs: "px-4" } },
} as const;

export type ChipProps = Omit<PressableScaleProps, "children" | "style"> & {
  label: string;
  selected?: boolean;
  /** Fill when selected: lavender for filters, primary for categories. */
  tone?: keyof typeof selectedTones;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  icon?: IconName;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({
  label,
  selected,
  tone = "lavender",
  variant = "outline",
  size = "md",
  icon,
  className,
  style,
  ...props
}: ChipProps) {
  const s = sizes[size];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      transitionProperty={["backgroundColor", "borderColor"]}
      className={cn(
        "flex-row items-center gap-2 rounded-full border",
        s.container,
        variants[variant].padding[size],
        selected ? selectedTones[tone] : variants[variant].idle,
        className,
      )}
      style={style}
      {...props}
    >
      {icon && <Icon name={icon} size={s.icon} />}
      <Text variant={s.text}>{label}</Text>
    </PressableScale>
  );
}
