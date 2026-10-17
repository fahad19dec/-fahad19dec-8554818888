import * as Haptics from "expo-haptics";
import { ScrollView, View } from "react-native";

import { Chip, Icon, PressableScale, Text, type IconName } from "@/components/ui";
import { activeFilters, type StayFilters } from "@/lib/search/filters";

// One-tap filters under the search bar, in one scrolling row that bleeds to
// the screen edges. Each toggles one filter; the full set is in FilterSheet.
type Quick = {
  key: string;
  label: string;
  icon?: IconName;
  on: (f: StayFilters) => boolean;
  toggle: (f: StayFilters, on: boolean) => StayFilters;
};

const toggled = <T,>(list: T[], value: T, on: boolean) => (on ? [...list, value] : list.filter((v) => v !== value));

const quick: Quick[] = [
  {
    key: "pets",
    label: "Pet Friendly",
    icon: "pets",
    on: (f) => f.pets === true,
    toggle: (f, on) => ({ ...f, pets: on ? true : undefined }),
  },
  {
    key: "price",
    label: "Under $300",
    on: (f) => f.maxPrice === 300 && f.minPrice === undefined,
    toggle: (f, on) => ({ ...f, minPrice: undefined, maxPrice: on ? 300 : undefined }),
  },
  ...(["hotTub", "pool", "workspace"] as const).map(
    (a): Quick => ({
      key: a,
      label: { hotTub: "Hot Tub", pool: "Pool", workspace: "Workspace" }[a],
      icon: a,
      on: (f) => f.amenities.includes(a),
      toggle: (f, on) => ({ ...f, amenities: toggled(f.amenities, a, on) }),
    }),
  ),
  {
    key: "rating",
    label: "4.8+ rating",
    icon: "star",
    on: (f) => f.minRating === 4.8,
    toggle: (f, on) => ({ ...f, minRating: on ? 4.8 : undefined }),
  },
  {
    key: "superhost",
    label: "Superhost",
    icon: "rosette",
    on: (f) => f.superhost === true,
    toggle: (f, on) => ({ ...f, superhost: on || undefined }),
  },
  {
    key: "flexible",
    label: "Flexible cancellation",
    on: (f) => f.cancellation.includes("flexible-cancellation"),
    toggle: (f, on) => ({ ...f, cancellation: toggled(f.cancellation, "flexible-cancellation", on) }),
  },
];

export function QuickFilters({ filters, onChange }: { filters: StayFilters; onChange: (filters: StayFilters) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerClassName="gap-2.5 px-4">
      {quick.map((q) => {
        const selected = q.on(filters);
        return (
          <Chip
            key={q.key}
            label={q.label}
            icon={q.icon}
            size="xs"
            variant="filled"
            tone="lavender"
            selected={selected}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(q.toggle(filters, !selected));
            }}
          />
        );
      })}
    </ScrollView>
  );
}

// What's applied, each removable, with "Clear all" once there are two.
export function ActiveFilters({
  filters,
  onChange,
  onClearAll,
}: {
  filters: StayFilters;
  onChange: (filters: StayFilters) => void;
  onClearAll: () => void;
}) {
  const chips = activeFilters(filters);
  if (!chips.length) return null;
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <PressableScale
          key={chip.key}
          accessibilityRole="button"
          accessibilityLabel={`Remove filter ${chip.label}`}
          onPress={() => onChange(chip.clear(filters))}
          className="h-8 flex-row items-center gap-1.5 rounded-full bg-lavender-soft pr-2.5 pl-3"
        >
          <Text variant="footnote">{chip.label}</Text>
          <Icon name="close" size={14} />
        </PressableScale>
      ))}
      {chips.length > 1 && (
        <PressableScale accessibilityRole="button" onPress={onClearAll} className="h-8 justify-center px-2">
          <Text variant="link">Clear all</Text>
        </PressableScale>
      )}
    </View>
  );
}
