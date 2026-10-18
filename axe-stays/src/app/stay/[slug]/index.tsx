import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadError } from "@/components/load-error";
import { AmenityRow } from "@/components/stay/amenity-row";
import { GoodToKnow } from "@/components/stay/good-to-know";
import { HostSection } from "@/components/stay/host-section";
import { PhotoButton } from "@/components/stay/photo-button";
import { PhotoGallery } from "@/components/stay/photo-gallery";
import { PolicyCard } from "@/components/stay/policy-card";
import { PriceBar } from "@/components/stay/price-bar";
import { RatingBox } from "@/components/stay/rating-box";
import { StaySkeleton } from "@/components/stay/stay-skeleton";
import { Alert, EmptyState, Icon, Text } from "@/components/ui";
import { useStay } from "@/hooks/use-stay";
import { useFavorite } from "@/lib/favorites";
import { stayTags } from "@/lib/search/query";
import { placeLabel } from "@/lib/stays";
import { brand } from "@/brand";

// Room under the content for the pinned price bar (button 64 + padding).
const PRICE_BAR_SPACE = 112;
// The gallery's visible height (h-87 less the 8 pt the body overlaps).
const PHOTO_HEIGHT = 340;

export default function StayScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stay, error, retry, refresh, refreshing, refreshError, clearRefreshError } = useStay(slug);
  const [saved, toggleSaved] = useFavorite(stay?.id ?? slug);
  // Light status bar over the photo, dark once white content is under it.
  const [pastPhoto, setPastPhoto] = useState(false);

  const tags = useMemo(
    () =>
      stay
        ? stayTags(
            { amenities: stay.amenities, petsAllowed: stay.houseRules?.petsAllowed ?? false },
            { amenities: [], pets: false },
            4,
          )
        : [],
    [stay],
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  const openPolicies = (from: "cancellation" | "good_to_know") => {
    router.push({
      pathname: "/stay/[slug]/policies",
      params: from === "cancellation" ? { slug, section: "cancellation" } : { slug },
    });
  };

  const backButton = (
    <View className="absolute left-5" style={{ top: insets.top + 4 }}>
      <PhotoButton icon="chevronLeft" accessibilityLabel="Back" onPress={back} />
    </View>
  );

  if (!stay) {
    return (
      <View className="flex-1 bg-surface">
        <StatusBar style="dark" />
        {stay === null ? (
          <View className="flex-1 justify-center">
            <EmptyState
              icon="pinOff"
              title="This stay isn’t available"
              message="It may have been removed by its host."
              action={{ title: "Back", onPress: back }}
            />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center">
            <LoadError error={error} subject="this stay" onRetry={retry} />
          </View>
        ) : (
          <StaySkeleton />
        )}
        {backButton}
      </View>
    );
  }

  const place = placeLabel(stay);

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style={pastPhoto ? "dark" : "light"} />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        scrollEventThrottle={32}
        onScroll={(e) => {
          const past = e.nativeEvent.contentOffset.y > PHOTO_HEIGHT - insets.top;
          if (past !== pastPhoto) setPastPhoto(past);
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: PRICE_BAR_SPACE + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refresh();
            }}
          />
        }
      >
        <PhotoGallery photos={stay.photos} title={stay.title} />

        <View className="-mt-2 rounded-t-sm bg-surface px-5 pt-5">
          {refreshError && (
            <Alert
              tone="danger"
              message="Couldn’t refresh. Showing what you had."
              onDismiss={clearRefreshError}
              className="mb-5"
            />
          )}
          <View className="flex-row items-start gap-4">
            <Text variant="stayTitle" accessibilityRole="header" numberOfLines={3} className="flex-1">
              {stay.title}
            </Text>
            <RatingBox rating={stay.rating} reviewCount={stay.reviewCount} />
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            <Icon name="marker" size={20} />
            <Text>{place}</Text>
          </View>

          {tags.length > 0 && (
            <>
              <View className="mt-5">
                <AmenityRow tags={tags} />
              </View>
              <View className="mt-5 h-px bg-border" />
            </>
          )}

          <GoodToKnow rules={stay.houseRules} onShowAll={() => openPolicies("good_to_know")} />
          <View className="mt-5 h-px bg-border" />

          <View className="-mx-1 mt-1.5 gap-2.5">
            <PolicyCard
              icon="chat"
              tile
              title="Ask about this stay"
              subtitle="Cancellation, house rules, pets, check-in and more."
              onPress={() => router.push({ pathname: "/stay/[slug]/ask", params: { slug } })}
            />
            {stay.cancellationPolicy && (
              <PolicyCard
                icon="policy"
                title={stay.cancellationPolicy.title}
                subtitle={stay.cancellationPolicy.summary}
                onPress={() => openPolicies("cancellation")}
              />
            )}
          </View>

          {stay.host && (
            <>
              <View className="mt-2.5 h-px bg-border" />
              <HostSection host={stay.host} />
            </>
          )}
        </View>
      </ScrollView>

      {backButton}
      <View className="absolute right-5 flex-row gap-2.5" style={{ top: insets.top + 4 }}>
        <PhotoButton
          icon="share"
          accessibilityLabel={`Share ${stay.title}`}
          onPress={() => {
            Share.share({ message: `${stay.title} in ${place}, $${stay.pricePerNight} a night on ${brand.name}` }).catch(() => {});
          }}
        />
        <PhotoButton
          icon={saved ? "heartFill" : "heart"}
          tone={saved ? "danger" : "ink"}
          accessibilityLabel={`Save ${stay.title}`}
          accessibilityState={{ selected: saved }}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            toggleSaved();
          }}
        />
      </View>

      <PriceBar
        stay={stay}
        onBook={() => {
          router.push({ pathname: "/stay/[slug]/book", params: { slug } });
        }}
      />
    </View>
  );
}
