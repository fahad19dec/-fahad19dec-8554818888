import type { StyleProp, ViewStyle } from "react-native";

import { EmptyState } from "@/components/ui";
import { isConnectionError } from "@/lib/api";

export { isConnectionError };

// The error state for a screen that couldn't load, worded by cause.
export function LoadError({
  error,
  subject,
  onRetry,
  className,
  style,
}: {
  error: Error;
  /** What failed to load, e.g. "stays" or "this stay". */
  subject: string;
  onRetry: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const offline = isConnectionError(error);
  return (
    <EmptyState
      icon={offline ? "wifiOff" : "warning"}
      title={offline ? "Can’t connect" : "Something went wrong"}
      message={offline ? "Check your connection and try again." : `We couldn’t load ${subject} right now. Try again in a moment.`}
      action={{ title: "Try again", onPress: onRetry }}
      className={className}
      style={style}
    />
  );
}
