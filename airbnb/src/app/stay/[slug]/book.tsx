import { Image as RNImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { styled } from "nativewind";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadError } from "@/components/load-error";
import { PolicyCard } from "@/components/stay/policy-card";
import { Badge, Button, EmptyState, Icon, IconButton, Skeleton, Text } from "@/components/ui";
import { useStay } from "@/hooks/use-stay";
import { formatPrice, priceLines } from "@/lib/stay-details";
import { placeLabel, type StayDetails } from "@/lib/stays";

const Image = styled(RNImage, { className: "style" });

// Room under the content for the pinned bar (button 64 + note + padding).
const CONFIRM_BAR_SPACE = 116;

// "Book this stay" lands here: what the booking will cover, from the stay's own
// fields. Dates, guests and payment don't exist yet, so Confirm stays disabled.
export default function BookScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stay, error, retry } = useStay(slug);

  const back = () => (router.canGoBack() ? router.back() : router.replace({ pathname: "/stay/[slug]", params: { slug } }));

  let body;
  if (stay === null) {
    body = (
      <View className="flex-1 justify-center">
        <EmptyState
          icon="pinOff"
          title="This stay isn’t available"
          message="It may have been removed by its host."
          action={{ title: "Back", onPress: back }}
        />
      </View>
    );
  } else if (!stay && error) {
    body = (
      <View className="flex-1 justify-center">
        <LoadError error={error} subject="this stay" onRetry={retry} />
      </View>
    );
  } else if (!stay) {
    body = <BookSkeleton />;
  } else {
    body = (
      <>
        <ScrollView
          contentContainerClassName="px-5 pt-5"
          contentContainerStyle={{ paddingBottom: CONFIRM_BAR_SPACE + insets.bottom }}
        >
          <StaySummary stay={stay} />
          <Divider />
          <TripDetails stay={stay} />
          <Divider />
          <PriceDetails stay={stay} />
          {stay.cancellationPolicy && (
            <>
              <Divider />
              <Text variant="title" accessibilityRole="header">
                Cancellation
              </Text>
              <View className="-mx-1 mt-3">
                <PolicyCard
                  icon="policy"
                  title={stay.cancellationPolicy.title}
                  subtitle={stay.cancellationPolicy.summary}
                  onPress={() => {
                    router.push({ pathname: "/stay/[slug]/policies", params: { slug, section: "cancellation" } });
                  }}
                />
              </View>
            </>
          )}
        </ScrollView>

        <View
          className="absolute inset-x-0 bottom-0 gap-2 border-t border-border bg-surface px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Button title="Confirm and pay" size="lg" disabled />
          <Text variant="caption" tone="muted" className="text-center">
            Booking opens soon in Roam.
          </Text>
        </View>
      </>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-row items-center gap-3 border-b border-border px-5 py-2">
        <IconButton icon="chevronLeft" size="nav" accessibilityLabel="Back" onPress={back} />
        <Text variant="title" accessibilityRole="header" className="flex-1">
          Confirm your stay
        </Text>
      </View>
      {body}
    </View>
  );
}

function Divider() {
  return <View className="my-5 h-px bg-border" />;
}

function StaySummary({ stay }: { stay: StayDetails }) {
  const photo = stay.photos[0];
  return (
    <View className="flex-row items-center gap-4">
      <Image
        source={photo ? { uri: photo.url } : undefined}
        accessibilityLabel={photo?.alt ?? undefined}
        contentFit="cover"
        transition={200}
        className="h-24 w-28 rounded-md bg-surface-muted"
      />
      <View className="flex-1 gap-1">
        <Text variant="cardTitle" numberOfLines={2}>
          {stay.title}
        </Text>
        <View className="flex-row items-center gap-1">
          <Icon name="marker" size={15} tone="subtle" />
          <Text variant="caption" tone="subtle" numberOfLines={1} className="flex-1">
            {placeLabel(stay)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Icon name="star" size={16} tone="primary" />
          <Text variant="label">
            {stay.rating.toFixed(1)}{" "}
            <Text variant="label" tone="subtle">
              ({stay.reviewCount})
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

function TripDetails({ stay }: { stay: StayDetails }) {
  return (
    <>
      <Text variant="title" accessibilityRole="header">
        Your trip
      </Text>
      <View className="mt-4 gap-4">
        <TripRow label="Dates" value="Add dates" />
        <TripRow label="Guests" value={stay.maxGuests ? `Up to ${stay.maxGuests} guests` : "Add guests"} />
      </View>
    </>
  );
}

function TripRow({ label, value }: { label: string; value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}. Coming soon`} className="flex-row items-center gap-4">
      <View className="flex-1">
        <Text variant="subtitle">{label}</Text>
        <Text variant="caption" tone="subtle">
          {value}
        </Text>
      </View>
      <Badge label="Coming soon" />
    </View>
  );
}

function PriceDetails({ stay }: { stay: StayDetails }) {
  const { lines, total } = priceLines(stay);
  return (
    <>
      <Text variant="title" accessibilityRole="header">
        Price details
      </Text>
      <View className="mt-4 gap-3">
        {lines.map((line) => (
          <View key={line.key} className="flex-row justify-between gap-4">
            <Text>{line.label}</Text>
            <Text>{formatPrice(line.amount)}</Text>
          </View>
        ))}
        <View className="h-px bg-border" />
        <View className="flex-row justify-between gap-4">
          <Text variant="subtitle">Total</Text>
          <Text variant="subtitle">{formatPrice(total)}</Text>
        </View>
      </View>
    </>
  );
}

function BookSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading booking" className="gap-4 px-5 pt-5">
      <View className="flex-row items-center gap-4">
        <Skeleton className="h-24 w-28 rounded-md" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-4/5 rounded-full" />
          <Skeleton className="h-4 w-3/5 rounded-full" />
          <Skeleton className="h-4 w-2/5 rounded-full" />
        </View>
      </View>
      <Skeleton className="mt-4 h-6 w-1/3 rounded-full" />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-12 rounded-lg" />
    </View>
  );
}
