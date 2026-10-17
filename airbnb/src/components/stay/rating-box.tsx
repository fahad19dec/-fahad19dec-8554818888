import { View } from "react-native";

import { Icon, Text } from "@/components/ui";
import { ratingLabel } from "@/lib/stays";

export function RatingBox({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <View
      accessible
      accessibilityLabel={rating > 0 ? `Rated ${rating.toFixed(1)} from ${reviewCount} reviews` : "New listing, no ratings yet"}
      className="items-center rounded-lg bg-surface-muted px-4 py-2.5"
    >
      <View className="flex-row items-center gap-1">
        <Icon name="star" size={20} tone="primary" />
        <Text variant="title">{ratingLabel(rating)}</Text>
      </View>
      <Text variant="lead" tone="subtle">
        {reviewCount > 0 ? `(${reviewCount})` : "No reviews"}
      </Text>
    </View>
  );
}
