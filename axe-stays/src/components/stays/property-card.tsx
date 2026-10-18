import { Image as RNImage } from "expo-image";
import { styled } from "nativewind";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { Icon, PressableScale, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { placeLabel, ratingLabel, type StayCardData } from "@/lib/stays";

const Image = styled(RNImage, { className: "style" });

// The large photo card on Home. The whole card opens the stay, so the chevron
// is decorative and hidden from screen readers.
export function PropertyCard({
  property,
  onPress,
  className,
  style,
}: {
  property: StayCardData;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const place = placeLabel(property);
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={onPress}
      accessibilityLabel={`${property.title}, ${place}, ${property.rating > 0 ? `rated ${property.rating.toFixed(1)}` : "new listing"}, $${property.pricePerNight} a night`}
      className={cn("h-68 overflow-hidden rounded-xl bg-surface-muted", className)}
      style={style}
    >
      <Image
        source={{ uri: property.imageUrl }}
        contentFit="cover"
        transition={200}
        className="absolute inset-0"
      />
      {/* Keeps the white text legible on bright photos. */}
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-ink/75 to-transparent" />

      <View className="absolute top-3 right-3 h-10 flex-row items-center gap-1.5 rounded-full bg-surface px-4">
        <Icon name="star" size={18} />
        <Text variant="subtitle">{ratingLabel(property.rating)}</Text>
      </View>

      <View className="absolute right-32 bottom-5 left-5 gap-1">
        <View className="flex-row items-center gap-1.5">
          <Icon name="marker" size={18} tone="inverse" />
          <Text variant="caption" tone="inverse">
            {place}
          </Text>
        </View>
        <Text variant="heading" tone="inverse" numberOfLines={2}>
          {property.title}
        </Text>
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute right-4 bottom-4 size-14 items-center justify-center rounded-full bg-surface"
      >
        <Icon name="chevronRight" size={24} />
      </View>
    </PressableScale>
  );
}
