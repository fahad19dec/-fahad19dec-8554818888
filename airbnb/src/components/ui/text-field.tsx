import { useState, type ReactNode, type Ref } from "react";
import { Pressable, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import type { IconName } from "./icons";
import { Text } from "./text";

export type TextFieldProps = Omit<TextInputProps, "style" | "secureTextEntry"> & {
  icon?: IconName;
  /** Trailing control, e.g. a filter button on the search field. */
  accessory?: ReactNode;
  /** Masks the value and adds a show/hide toggle. */
  secure?: boolean;
  /** Shown above the value, inside the field (the auth forms' two-line layout). */
  label?: string;
  invalid?: boolean;
  ref?: Ref<TextInput>;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function TextField({
  icon,
  accessory,
  secure,
  label,
  invalid,
  ref,
  className,
  style,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const input = (
    <TextInput
      ref={ref}
      accessibilityLabel={label}
      className={cn(
        "font-jakarta text-body text-ink placeholder:text-ink-subtle selection:text-lavender",
        label ? "h-6 py-0" : "h-full flex-1",
      )}
      secureTextEntry={secure && !revealed}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...props}
    />
  );

  return (
    <View
      className={cn(
        "flex-row items-center rounded-lg corner-squircle border-2",
        label ? "h-16 gap-7 px-5" : "h-14 gap-3 px-4",
        invalid
          ? "border-danger bg-danger-soft"
          : focused
            ? "border-lavender bg-lavender-soft"
            : "border-border/50 bg-surface-muted",
        className,
      )}
      style={style}
    >
      {icon && <Icon name={icon} />}
      {label ? (
        <View className="flex-1">
          <Text variant="label">{label}</Text>
          {input}
        </View>
      ) : (
        input
      )}
      {secure ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={revealed ? "Hide password" : "Show password"}
          hitSlop={12}
          onPress={() => setRevealed((r) => !r)}
          className="active:opacity-70"
        >
          <Icon name={revealed ? "eye" : "eyeOff"} />
        </Pressable>
      ) : (
        accessory
      )}
    </View>
  );
}
