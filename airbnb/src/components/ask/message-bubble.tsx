import { View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

// Roam's notes sit left on gray, the guest's questions right on lavender.
export function MessageBubble({ from, text }: { from: "roam" | "guest"; text: string }) {
  return (
    <View
      className={cn(
        "rounded-lg px-4 py-3",
        from === "guest" ? "ml-12 self-end bg-lavender" : "mr-12 self-start bg-surface-muted",
      )}
    >
      <Text>{text}</Text>
    </View>
  );
}
