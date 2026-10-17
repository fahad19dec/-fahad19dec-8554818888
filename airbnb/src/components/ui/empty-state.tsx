import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";

import { cn } from "@/lib/cn";
import { motion } from "@/theme";

import { Button } from "./button";
import { Icon } from "./icon";
import type { IconName } from "./icons";
import { Text } from "./text";

type Action = { title: string; onPress: () => void };

// Opacity only, so it fades in even with Reduce Motion on.
const enter = FadeIn.duration(200).easing(motion.easeOut).reduceMotion(ReduceMotion.Never);

// What a screen shows instead of content: nothing matched, nothing exists yet,
// or loading failed. It says why and offers the next step.
export function EmptyState({
  icon,
  title,
  message,
  action,
  secondaryAction,
  children,
  className,
  style,
}: {
  icon: IconName;
  title: string;
  message: string;
  action?: Action;
  secondaryAction?: Action;
  /** Shown between the message and the buttons, e.g. search constraints. */
  children?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={enter}
      accessibilityLiveRegion="polite"
      className={cn("items-center gap-3 px-6", className)}
      style={style}
    >
      <View className="mb-1 size-18 items-center justify-center rounded-full bg-surface-muted">
        <Icon name={icon} size={32} />
      </View>
      <Text variant="title" accessibilityRole="header" className="text-center">
        {title}
      </Text>
      <Text tone="muted" className="text-center">
        {message}
      </Text>
      {children}
      {(action || secondaryAction) && (
        <View className="mt-2 flex-row gap-3">
          {secondaryAction && (
            <Button title={secondaryAction.title} variant="secondary" size="sm" onPress={secondaryAction.onPress} />
          )}
          {action && <Button title={action.title} size="sm" onPress={action.onPress} />}
        </View>
      )}
    </Animated.View>
  );
}
