import type { StyleProp, ViewStyle } from "react-native";
import Animated, { css, useReducedMotion } from "react-native-reanimated";

import { cn } from "@/lib/cn";
import { motion } from "@/theme";

const pulse = css.keyframes({ from: { opacity: 1 }, to: { opacity: 0.5 } });

// A gray placeholder in the shape of content that's loading. It pulses on the
// UI thread as a CSS animation; with Reduce Motion it holds still.
export function Skeleton({ className, style }: { className?: string; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      className={cn("bg-surface-muted", className)}
      style={[
        reduced
          ? null
          : {
              animationName: pulse,
              animationDuration: motion.pulse,
              animationDirection: "alternate",
              animationIterationCount: "infinite",
              animationTimingFunction: motion.cssEaseInOut,
            },
        style,
      ]}
    />
  );
}
