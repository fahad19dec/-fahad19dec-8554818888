import { Pressable, View } from "react-native";

import { Text } from "@/components/ui";

export function AuthFooter({
  prompt,
  action,
  onPress,
  disabled,
}: {
  prompt: string;
  action: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <Text variant="label" tone="muted">
        {prompt}
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        hitSlop={12}
        onPress={onPress}
        className="active:opacity-70"
      >
        {disabled ? (
          <Text variant="label" tone="muted">
            {action}
          </Text>
        ) : (
          <Text variant="link">{action}</Text>
        )}
      </Pressable>
    </View>
  );
}
