import type { ReactNode } from "react";
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import type { IconName } from "./icons";
import { Spinner } from "./spinner";
import { Text } from "./text";

const variants = {
  primary: { container: "bg-primary", text: "button" },
  secondary: { container: "border border-border bg-surface", text: "buttonSecondary" },
  danger: { container: "bg-danger-soft", text: "button" }, // confirming a delete
} as const;

const sizes = {
  lg: { container: "h-16 px-5", icon: 22 }, // "Book this stay"
  md: { container: "h-14 px-6", icon: 22 },
  sm: { container: "h-10 px-4", icon: 18 },
} as const;

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  title: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Leading mark next to the title, e.g. a provider logo. */
  icon?: ReactNode;
  /** Pinned to the trailing edge, e.g. the arrow on "Book this stay". */
  trailingIcon?: IconName;
  loading?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  icon,
  trailingIcon,
  loading,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const s = sizes[size];
  const inactive = !!(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      disabled={inactive}
      className={cn(
        "flex-row items-center justify-center gap-3 rounded-full active:opacity-70",
        variants[variant].container,
        s.container,
        disabled && "opacity-40",
        className,
      )}
      style={style}
      {...props}
    >
      {loading ? (
        <Spinner tone="ink" />
      ) : (
        <>
          {icon}
          <Text variant={size === "sm" ? "label" : variants[variant].text}>{title}</Text>
          {trailingIcon && (
            <View className="absolute right-6">
              <Icon name={trailingIcon} size={s.icon} />
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}
