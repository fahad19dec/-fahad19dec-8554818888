import type { Ref } from "react";
import { TextInput, View, type StyleProp, type ViewStyle } from "react-native";

import { Icon, PressableScale, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

// The gray query bar on Search. Submitting sends the trimmed text; the filters
// button opens every filter and shows how many are on.
export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onFilters,
  filterCount = 0,
  ref,
  className,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string) => void;
  onFilters: () => void;
  filterCount?: number;
  ref?: Ref<TextInput>;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className={cn("h-13 flex-row items-center gap-3 rounded-full bg-surface-muted pr-4 pl-4", className)}
      style={style}
    >
      <Icon name="search" size={22} />
      <TextInput
        ref={ref}
        accessibilityLabel="Search stays"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit(value.trim())}
        placeholder="Search stays"
        returnKeyType="search"
        submitBehavior="blurAndSubmit"
        autoCorrect={false}
        clearButtonMode="while-editing"
        className="h-full flex-1 font-jakarta-medium text-input text-ink placeholder:text-ink-subtle selection:text-accent"
      />
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={filterCount ? `Filters, ${filterCount} on` : "Filters"}
        hitSlop={8}
        onPress={onFilters}
        className="flex-row items-center gap-1"
      >
        <Icon name="filters" size={22} />
        {filterCount > 0 && (
          <View className="h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5">
            <Text variant="footnote" tone="inverse">
              {filterCount}
            </Text>
          </View>
        )}
      </PressableScale>
    </View>
  );
}
