import { Image as RNImage } from "expo-image";
import { styled } from "nativewind";
import { useState } from "react";
import { FlatList, useWindowDimensions, View } from "react-native";

import { Text } from "@/components/ui";
import type { StayDetails } from "@/lib/stays";

const Image = styled(RNImage, { className: "style" });

// Full-width photos that page sideways, with a "1 / 5" counter. The overlay
// buttons belong to the screen and sit on top of this.
export function PhotoGallery({ photos, title }: { photos: StayDetails["photos"]; title: string }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  return (
    <View className="h-87 bg-surface-muted">
      <FlatList
        data={photos}
        keyExtractor={(photo, i) => `${i}-${photo.url}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        // Each page is sized by a plain View: react-native-web rejects a numeric
        // width merged into a styled image, and "h-full" collapses in a
        // horizontal list on web.
        renderItem={({ item, index: i }) => (
          <View className="h-87" style={{ width }}>
            <Image
              source={{ uri: item.url }}
              accessibilityLabel={item.alt ?? `${title}, photo ${i + 1}`}
              contentFit="cover"
              transition={200}
              className="absolute inset-0"
            />
          </View>
        )}
      />
      {photos.length > 1 && (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}
          className="absolute right-3 bottom-5 h-8.5 justify-center rounded-full bg-ink/80 px-3.5"
        >
          <Text variant="subtitle" tone="inverse">
            {index + 1} / {photos.length}
          </Text>
        </View>
      )}
    </View>
  );
}
