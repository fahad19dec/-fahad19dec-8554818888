import { useState, type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { motion } from "@/theme";

export type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  children?: ReactNode;
  /** Extra style properties to ease alongside the press, e.g. backgroundColor. */
  transitionProperty?: ("backgroundColor" | "borderColor" | "opacity")[];
  /** Applies to the visible surface, which is what scales. */
  className?: string;
  style?: StyleProp<ViewStyle>;
};

// Press feedback for button-like surfaces: shrinks to 0.97 on press-in, as a
// UI-thread CSS transition. With Reduce Motion on, only color transitions run.
export function PressableScale({
  transitionProperty = [],
  onPressIn,
  onPressOut,
  children,
  className,
  style,
  ...props
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      pressRetentionOffset={16}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      {...props}
    >
      <Animated.View
        className={className}
        style={[
          {
            transform: [{ scale: pressed && !reduced ? motion.press.scale : 1 }],
            transitionProperty: ["transform", ...transitionProperty],
            transitionDuration: [motion.press.duration, ...transitionProperty.map(() => motion.fast)],
            transitionTimingFunction: motion.cssEaseOut,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
