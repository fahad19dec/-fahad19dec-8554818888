import { View } from "react-native";

import { Text } from "@/components/ui";
import type { PolicyBlock } from "@/lib/stays";

// Renders a policy's Portable Text word for word. The schema only allows
// paragraphs, h3 headings, bullet lists and strong, so that's all this knows;
// anything else falls back to its plain text.
export function PolicyBody({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <View className="gap-3">
      {blocks.map((block) => {
        const spans = (block.children ?? []).map((span) => (
          // Strong is the semibold step at body size, never a second font class.
          <Text key={span._key} variant={span.marks?.includes("strong") ? "subtitle" : "body"}>
            {span.text}
          </Text>
        ));
        if (block.style === "h3") {
          return (
            <Text key={block._key} variant="subtitle" accessibilityRole="header" className="mt-1">
              {(block.children ?? []).map((s) => s.text).join("")}
            </Text>
          );
        }
        if (block.listItem) {
          return (
            <View key={block._key} className="flex-row gap-2 pl-1">
              <Text>•</Text>
              <Text className="flex-1">{spans}</Text>
            </View>
          );
        }
        return <Text key={block._key}>{spans}</Text>;
      })}
    </View>
  );
}
