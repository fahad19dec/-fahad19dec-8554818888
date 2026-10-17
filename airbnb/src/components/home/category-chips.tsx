import * as Haptics from "expo-haptics";
import { View } from "react-native";

import { Chip, type IconName } from "@/components/ui";
import type { PropertyType } from "@/lib/stays";

export type Category = PropertyType | "all";

export const categories: { value: Category; label: string; icon: IconName }[] = [
  { value: "all", label: "All Stays", icon: "homeFill" },
  { value: "cabin", label: "Cabins", icon: "cabin" },
  { value: "beach", label: "Beach", icon: "beach" },
  { value: "city", label: "City", icon: "city" },
  { value: "villa", label: "Villas", icon: "villa" },
];

// One selection tick per change, in the same frame as the chip's color change.
export function CategoryChips({ value, onChange }: { value: Category; onChange: (value: Category) => void }) {
  return (
    <View accessibilityRole="tablist" className="flex-row flex-wrap gap-2">
      {categories.map((c) => (
        <Chip
          key={c.value}
          label={c.label}
          icon={c.icon}
          tone="primary"
          variant="filled"
          selected={c.value === value}
          onPress={() => {
            if (c.value === value) return;
            Haptics.selectionAsync().catch(() => {});
            onChange(c.value);
          }}
        />
      ))}
    </View>
  );
}
