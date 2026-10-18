import * as Haptics from "expo-haptics";
import { Image as RNImage } from "expo-image";
import { styled } from "nativewind";
import { View } from "react-native";

import { Icon, PressableScale, Skeleton, Text } from "@/components/ui";
import { useFavorite } from "@/lib/favorites";
import type { StayTag } from "@/lib/search/query";
import { placeLabel, ratingLabel, type SearchStay } from "@/lib/stays";

const Image = styled(RNImage, { className: "style" });

// A Search result: photo on the left, details on the right. The card opens the
// stay; the heart has its own press and doesn't.
export function ResultCard({ stay, tags, onPress }: { stay: SearchStay; tags: StayTag[]; onPress?: () => void }) {
  const place = placeLabel(stay);
  return (
    // The heart is a sibling of the pressable area, so VoiceOver reaches both.
    <View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${stay.title}, ${place}, ${stay.rating > 0 ? `rated ${stay.rating.toFixed(1)} from ${stay.reviewCount} reviews` : "new listing"}, ${tags.map((t) => t.label).join(", ")}, $${stay.pricePerNight} a night`}
        onPress={onPress}
        className="flex-row gap-3.5 rounded-xl bg-surface shadow-card"
      >
      <Image
        source={{ uri: stay.imageUrl }}
        accessibilityLabel={stay.imageAlt ?? undefined}
        contentFit="cover"
        transition={200}
        // Stretches with the details, so large text never overflows the card.
        className="min-h-40 w-37 self-stretch rounded-md bg-surface-muted"
      />

      {/* pb-3 keeps the price off the card's bottom edge. */}
      <View className="flex-1 justify-between pr-1 pb-3">
        <View>
          {/* Leaves room for the heart, which sits over the top-right corner. */}
          <Text variant="cardTitle" numberOfLines={2} className="mr-12">
            {stay.title}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-1">
            <Icon name="marker" size={15} tone="subtle" />
            <Text variant="caption" tone="subtle" numberOfLines={1} className="flex-1">
              {place}
            </Text>
          </View>
          <View className="mt-1 flex-row items-center gap-1">
            <Icon name="star" size={16} tone="primary" />
            <Text variant="label">
              {ratingLabel(stay.rating)}
              {stay.reviewCount > 0 && (
                <Text variant="label" tone="subtle">
                  {" "}({stay.reviewCount})
                </Text>
              )}
            </Text>
          </View>
          {tags.length > 0 && (
            <View className="mt-2 flex-row gap-1.5">
              {tags.map((tag) => (
                <ResultTag key={tag.key} tag={tag} />
              ))}
            </View>
          )}
        </View>
        <View className="flex-row items-baseline gap-1.5">
          <Text variant="title">${stay.pricePerNight}</Text>
          <Text variant="label" tone="subtle">
            / night
          </Text>
        </View>
      </View>

      </PressableScale>
      <Heart id={stay.id} title={stay.title} />
    </View>
  );
}

export function ResultTag({ tag }: { tag: StayTag }) {
  return (
    <View className="h-6.5 shrink flex-row items-center gap-1 rounded-full bg-surface-muted px-2.5">
      <Icon name={tag.icon} size={14} />
      <Text variant="footnote" numberOfLines={1} className="shrink">
        {tag.label}
      </Text>
    </View>
  );
}

// Session-only favorite. One selection tick per toggle, with the icon swap.
function Heart({ id, title }: { id: string; title: string }) {
  const [saved, toggle] = useFavorite(id);
  return (
    <View className="absolute top-1 right-1">
      <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Save ${title}`}
      accessibilityState={{ selected: saved }}
      hitSlop={4}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        toggle();
      }}
      className="size-11 items-center justify-center rounded-full bg-surface-muted"
    >
      <Icon name={saved ? "heartFill" : "heart"} size={22} tone={saved ? "danger" : "ink"} />
    </PressableScale>
    </View>
  );
}

export function ResultCardSkeleton() {
  return (
    <View className="flex-row gap-3.5">
      <Skeleton className="h-40 w-37 rounded-md" />
      <View className="flex-1 gap-3 py-2">
        <Skeleton className="h-5 w-4/5 rounded-full" />
        <Skeleton className="h-4 w-3/5 rounded-full" />
        <Skeleton className="h-4 w-2/5 rounded-full" />
        <Skeleton className="mt-auto mb-2 h-6 w-1/3 rounded-full" />
      </View>
    </View>
  );
}
