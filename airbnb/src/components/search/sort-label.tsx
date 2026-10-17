import { View } from "react-native";

import { Icon, Text } from "@/components/ui";
import { sortLabels, type SortOption } from "@/lib/search/filters";

// "Sort by Best match ⌄": the trigger both platform menus wrap.
export function SortLabel({ value }: { value: SortOption }) {
  return (
    <View className="flex-row items-center gap-1">
      <Text variant="lead">Sort by</Text>
      <Text variant="subtitle">{sortLabels[value]}</Text>
      <Icon name="chevronDown" size={18} className="ml-1" />
    </View>
  );
}
