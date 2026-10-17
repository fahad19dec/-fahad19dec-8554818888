import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Text } from "@/components/ui";
import { stayTotal } from "@/lib/stay-details";
import type { StayDetails } from "@/lib/stays";

// Pinned under the scroll view. The total covers the shortest stay allowed plus
// cleaning, until guests can pick dates.
export function PriceBar({ stay, onBook }: { stay: StayDetails; onBook: () => void }) {
  const insets = useSafeAreaInsets();
  const { nights, total } = stayTotal(stay);
  const nightsLabel = nights === 1 ? "1 night" : `${nights} nights`;

  return (
    <View
      className="absolute inset-x-0 bottom-0 flex-row items-center gap-4 border-t border-border bg-surface px-5 pt-4"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <View
        accessible
        accessibilityLabel={`$${stay.pricePerNight} a night. $${total.toLocaleString("en-US")} total for ${nightsLabel}${stay.cleaningFee ? ", including cleaning" : ""}`}
        className="shrink-0"
      >
        <View className="flex-row items-baseline">
          <Text variant="heading">${stay.pricePerNight}</Text>
          <Text> / night</Text>
        </View>
        <Text tone="subtle" numberOfLines={1}>
          ${total.toLocaleString("en-US")} total · {nightsLabel}
        </Text>
      </View>
      {/* Takes the width the price leaves, so the total never truncates. */}
      <Button title="Book this stay" size="lg" onPress={onBook} className="flex-1" />
    </View>
  );
}
