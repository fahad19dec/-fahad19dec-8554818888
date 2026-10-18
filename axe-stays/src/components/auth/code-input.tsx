import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

const LENGTH = 6;

// One hidden input under six cells, so paste and one-time-code autofill work.
export function CodeInput({
  value,
  onChange,
  invalid,
  editable = true,
}: {
  value: string;
  onChange: (code: string) => void;
  invalid?: boolean;
  editable?: boolean;
}) {
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, LENGTH - 1);

  return (
    <Pressable onPress={() => input.current?.focus()} accessible={false}>
      <View className="flex-row gap-2.5" pointerEvents="none">
        {Array.from({ length: LENGTH }, (_, i) => (
          <View
            key={i}
            className={cn(
              "h-16 flex-1 items-center justify-center rounded-lg corner-squircle border-2",
              invalid
                ? "border-danger bg-danger-soft"
                : focused && i === active
                  ? "border-lavender bg-lavender-soft"
                  : "border-border/50 bg-surface-muted",
            )}
          >
            <Text variant="title">{value[i] ?? ""}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={input}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, LENGTH))}
        editable={editable}
        autoFocus
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        accessibilityLabel="6-digit code"
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 text-surface opacity-0"
      />
    </Pressable>
  );
}
