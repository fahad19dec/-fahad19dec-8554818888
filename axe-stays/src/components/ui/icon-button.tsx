import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import type { IconName } from "./icons";
import type { Tone } from "./tones";

const variants = {
  muted: "bg-surface-muted",
  surface: "bg-surface", // on photos and colored backgrounds
  ghost: "", // inside fields and rows
  outline: "border border-border bg-surface", // back button on auth screens
  primary: "bg-primary", // send in Ask's input
} as const;

const sizes = {
  md: { container: "size-14", icon: 24 },
  bar: { container: "size-13", icon: 22 }, // beside Search's bar
  nav: { container: "size-12", icon: 22 },
  send: { container: "size-10", icon: 20 },
  sm: { container: "size-9", icon: 18 },
} as const;

export type IconButtonProps = Omit<PressableProps, "children" | "style"> & {
  icon: IconName;
  /** Required: icon-only controls have no visible label. */
  accessibilityLabel: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  tone?: Tone;
  selected?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  variant = "muted",
  size = "md",
  tone = "ink",
  selected,
  disabled,
  className,
  style,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected }}
      disabled={disabled}
      hitSlop={size === "sm" ? 6 : undefined}
      className={cn(
        "items-center justify-center rounded-full active:opacity-70",
        variants[variant],
        sizes[size].container,
        disabled && "opacity-40",
        className,
      )}
      style={style}
      {...props}
    >
      <Icon name={icon} size={sizes[size].icon} tone={tone} />
    </Pressable>
  );
}
