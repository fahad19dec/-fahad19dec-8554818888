import { View } from "react-native";

import { Icon, Text } from "@/components/ui";
import type { StayTag } from "@/lib/search/query";

// Up to four highlights, each a quarter of the row, so fewer stay left-aligned.
export function AmenityRow({ tags }: { tags: StayTag[] }) {
  return (
    <View accessible accessibilityLabel={`Highlights: ${tags.map((t) => t.label).join(", ")}`} className="flex-row">
      {tags.map((tag) => (
        <View key={tag.key} className="w-1/4 items-center gap-2.5">
          <Icon name={tag.icon} size={28} />
          <Text variant="caption" numberOfLines={1}>
            {tag.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
