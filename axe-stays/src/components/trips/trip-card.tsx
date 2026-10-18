import { Image as RNImage } from "expo-image";
import { styled } from "nativewind";
import { View } from "react-native";

import { Badge, PressableScale, Text } from "@/components/ui";
import type { Trip } from "@/hooks/use-trips";
import { formatCents } from "@/lib/booking/pricing";
import { tripDates, tripGroup } from "@/lib/trips";

const Image = styled(RNImage, { className: "style" });

const statusBadge = {
  upcoming: { label: "Confirmed", tone: "success" },
  past: { label: "Completed", tone: "info" },
  cancelled: { label: "Cancelled", tone: "promo" },
} as const;

// A trip in the Trips list: photo, stay, dates, total and status.
export function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const status = statusBadge[tripGroup(trip)];
  const place = [trip.stay.city, trip.stay.region || trip.stay.country].filter(Boolean).join(", ");
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${trip.stay.title}, ${tripDates(trip.checkIn, trip.checkOut)}, ${status.label}`}
      onPress={onPress}
      className="flex-row gap-3 rounded-lg border border-border bg-surface p-3"
    >
      <View className="size-22 overflow-hidden rounded-md bg-surface-muted">
        {trip.stay.photoUrl && <Image source={{ uri: trip.stay.photoUrl }} contentFit="cover" className="absolute inset-0" />}
      </View>
      <View className="flex-1 gap-1">
        <Text variant="cardTitle" numberOfLines={2}>
          {trip.stay.title}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {place}
        </Text>
        <Text variant="caption">{tripDates(trip.checkIn, trip.checkOut)}</Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Badge label={status.label} tone={status.tone} />
          <Text variant="caption" tone="muted">
            {formatCents(trip.totalCents)}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
