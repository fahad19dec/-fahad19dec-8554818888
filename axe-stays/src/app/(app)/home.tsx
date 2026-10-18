import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition, ReduceMotion } from "react-native-reanimated";

import { Wordmark } from "@/components/brand/wordmark";
import { categories, CategoryChips, type Category } from "@/components/home/category-chips";
import { LoadError } from "@/components/load-error";
import { PropertyCard } from "@/components/stays/property-card";
import { SearchPrompt } from "@/components/stays/search-prompt";
import { Alert, EmptyState, Icon, IconButton, PressableScale, Skeleton, Text } from "@/components/ui";
import { useHomeStays } from "@/hooks/use-home-stays";
import { motion } from "@/theme";

// Changing the category fades cards in and out and eases the rest into place.
// Fades survive Reduce Motion, the movement doesn't.
const cardEnter = FadeIn.duration(200).easing(motion.easeOut).reduceMotion(ReduceMotion.Never);
const cardExit = FadeOut.duration(150).easing(motion.easeOut).reduceMotion(ReduceMotion.Never);
const cardLayout = LinearTransition.duration(motion.base).easing(motion.easeInOut).reduceMotion(ReduceMotion.System);

export default function Home() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("all");
  const [prompt, setPrompt] = useState("");

  const { stays, error, retry, refresh, refreshing, refreshError, clearRefreshError } = useHomeStays(category);
  const categoryIcon = categories.find((c) => c.value === category)?.icon ?? "homeFill";

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="px-5 pt-2 pb-8"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            refresh();
          }}
        />
      }
    >
      <StatusBar style="dark" />

      <View className="flex-row items-start justify-between">
        <View className="shrink pt-4">
          <Wordmark />
        </View>
        <IconButton icon="person" variant="muted" size="md" accessibilityLabel="Profile" onPress={() => router.navigate("/profile")} />
      </View>

      {/* An icon, not an emoji: Plus Jakarta Sans has no emoji glyphs, so iOS draws "?". */}
      <View className="mt-3 flex-row items-center gap-1.5">
        <Text variant="title" tone="muted">
          Hey there
        </Text>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name="wave" size={22} tone="primary" />
        </View>
      </View>
      <View className="mt-1 flex-row items-center gap-4">
        <Text variant="jumbo" accessibilityRole="header" className="flex-1">
          {"Find your\nnext stay"}
        </Text>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={() => router.navigate("/search")}
          className="h-22 w-16 items-center justify-center rounded-xl bg-surface-muted"
        >
          <Icon name="search" size={26} />
        </PressableScale>
      </View>

      <SearchPrompt
        value={prompt}
        onChangeText={setPrompt}
        onSubmit={(q) => {
          router.navigate({ pathname: "/search", params: { q } });
        }}
        className="mt-5"
      />

      <View className="mt-5">
        <CategoryChips value={category} onChange={setCategory} />
      </View>

      {refreshError && stays && (
        <Alert
          tone="danger"
          message="Couldn’t refresh. Showing what you had."
          onDismiss={clearRefreshError}
          className="mt-7"
        />
      )}

      {stays ? (
        stays.length > 0 ? (
          // The first list appears without entrances; only category changes animate.
          <LayoutAnimationConfig skipEntering>
            <View className="mt-7 gap-5">
              {stays.map((property) => (
                <Animated.View key={property.id} entering={cardEnter} exiting={cardExit} layout={cardLayout}>
                  <PropertyCard property={property} onPress={() => router.push(`/stay/${property.slug}`)} />
                </Animated.View>
              ))}
            </View>
          </LayoutAnimationConfig>
        ) : (
          <EmptyState
            icon={categoryIcon}
            title="No stays here yet"
            message="Try another category, or describe your stay above."
            action={category === "all" ? undefined : { title: "Show all stays", onPress: () => setCategory("all") }}
            className="mt-10"
          />
        )
      ) : error ? (
        <LoadError error={error} subject="stays" onRetry={retry} className="mt-10" />
      ) : (
        <View className="mt-7 gap-5" accessibilityLabel="Loading stays" accessible>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-68 rounded-xl" />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
