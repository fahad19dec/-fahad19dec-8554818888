import { Image as RNImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brand } from "@/brand";
import { DateRangeCalendar } from "@/components/booking/date-range-calendar";
import { LoadError } from "@/components/load-error";
import { PolicyCard } from "@/components/stay/policy-card";
import { Alert, Button, EmptyState, Icon, IconButton, Skeleton, Stepper, Text } from "@/components/ui";
import { useStay } from "@/hooks/use-stay";
import { ApiError, staysChanged } from "@/lib/api";
import { formatCents, quote, quoteProblems, SERVICE_FEE_RATE, type PricedStay, type Quote, type QuoteInput } from "@/lib/booking/pricing";
import { useAuthedApi, useSession } from "@/lib/session";
import { placeLabel, ratingLabel, type StayDetails } from "@/lib/stays";

const Image = styled(RNImage, { className: "style" });

// Room under the content for the pinned bar (button 64 + note + padding).
const CONFIRM_BAR_SPACE = 116;

/** The fields pricing reads, with the API's nulls as "not set". */
const priced = (stay: StayDetails): PricedStay => ({
  pricePerNight: stay.pricePerNight,
  cleaningFee: stay.cleaningFee ?? undefined,
  minNights: stay.minNights ?? undefined,
  weeklyDiscountPercent: stay.weeklyDiscountPercent ?? undefined,
  maxGuests: stay.maxGuests ?? 1,
  houseRules: stay.houseRules,
});

const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// "Book this stay": dates, guests and pets, the price as the server will
// charge it (src/lib/booking/pricing.ts), then a simulated payment. Signed-out
// guests are sent to sign in first and come back here.
export default function BookScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stay, error, retry, refresh } = useStay(slug);
  const { isSignedIn, account } = useSession();
  const request = useAuthedApi();

  const [dates, setDates] = useState<{ checkIn?: string; checkOut?: string }>({});
  const [guests, setGuests] = useState(1);
  const [pets, setPets] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; fields?: Record<string, string> } | null>(null);

  const back = () => (router.canGoBack() ? router.back() : router.replace({ pathname: "/stay/[slug]", params: { slug } }));

  const input: QuoteInput | null =
    dates.checkIn && dates.checkOut ? { checkIn: dates.checkIn, checkOut: dates.checkOut, guests, pets } : null;
  const problems = stay && input ? quoteProblems(priced(stay), input) : null;
  const price = stay && input && !problems ? quote(priced(stay), input) : null;
  const banned = account?.status === "banned";

  const confirm = async () => {
    if (!stay || !input || !price) return;
    if (!isSignedIn) return router.push("/sign-in");
    setSubmitting(true);
    setServerError(null);
    try {
      const booking = await request<{ id: string }>("/api/bookings", { method: "POST", json: { slug, ...input } });
      staysChanged();
      router.replace({ pathname: "/trips/[id]", params: { id: booking.id, booked: "1" } });
    } catch (e) {
      const message =
        e instanceof ApiError && e.code === "dates_unavailable"
          ? "Someone just booked some of those nights. Pick other dates."
          : e instanceof ApiError && e.code === "account_suspended"
            ? "Your account is suspended, so you can’t book."
            : e instanceof ApiError && e.code === "invalid_booking"
              ? "Check the dates and guests."
              : e instanceof ApiError && e.status === 0
                ? "Can’t reach the server. Check your connection."
                : "Couldn’t book this stay. Try again.";
      setServerError({ message, fields: e instanceof ApiError ? e.fields : undefined });
      if (e instanceof ApiError && e.code === "dates_unavailable") {
        setDates({});
        refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

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
    const problem = serverError?.fields ? Object.values(serverError.fields)[0] : problems ? Object.values(problems)[0] : null;
    const ready = !!price && !banned;
    body = (
      <>
        <ScrollView
          contentContainerClassName="px-5 pt-5"
          contentContainerStyle={{ paddingBottom: CONFIRM_BAR_SPACE + insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          <StaySummary stay={stay} />
          {banned && <Alert tone="danger" message="Your account is suspended, so you can’t book. Contact support." className="mt-5" />}
          {serverError && <Alert tone="danger" message={serverError.message} onDismiss={() => setServerError(null)} className="mt-5" />}
          <Divider />
          <Text variant="title" accessibilityRole="header">
            Dates
          </Text>
          <Text variant="caption" tone="muted" className="mt-1">
            {dates.checkIn && dates.checkOut
              ? `${shortDate(dates.checkIn)} – ${shortDate(dates.checkOut)}`
              : dates.checkIn
                ? `Check-in ${shortDate(dates.checkIn)}. Now pick check-out.`
                : `Pick check-in, then check-out.${stay.minNights && stay.minNights > 1 ? ` At least ${stay.minNights} nights.` : ""}`}
          </Text>
          <View className="mt-4">
            <DateRangeCalendar checkIn={dates.checkIn} checkOut={dates.checkOut} booked={stay.booked ?? []} onChange={setDates} />
          </View>
          <Divider />
          <Text variant="title" accessibilityRole="header">
            Who’s coming
          </Text>
          <View className="mt-4 gap-4">
            <CountRow label="Guests" hint={`Up to ${stay.maxGuests ?? 1}`} value={guests} min={1} max={stay.maxGuests ?? 1} onChange={setGuests} />
            {stay.houseRules.petsAllowed && (
              <CountRow
                label="Pets"
                hint={stay.houseRules.petFee ? `$${stay.houseRules.petFee} pet fee per stay` : "No pet fee"}
                value={pets}
                min={0}
                max={stay.houseRules.maxPets ?? 5}
                onChange={setPets}
              />
            )}
          </View>
          <Divider />
          <PriceDetails stay={stay} price={price} />
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
          <Button
            title={!isSignedIn ? "Sign in to book" : price ? `Confirm and pay ${formatCents(price.totalCents)}` : "Confirm and pay"}
            size="lg"
            loading={submitting}
            disabled={isSignedIn ? !ready : !price}
            onPress={confirm}
          />
          <Text variant="caption" tone={problem ? "danger" : "muted"} className="text-center">
            {problem ?? "Demo payment: no card is charged."}
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

function CountRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-1">
        <Text variant="subtitle">{label}</Text>
        <Text variant="caption" tone="subtle">
          {hint}
        </Text>
      </View>
      <Stepper value={value} min={min} max={max} accessibilityLabel={label} onChange={onChange} />
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
            {ratingLabel(stay.rating)}
            {stay.reviewCount > 0 && (
              <Text variant="label" tone="subtle">
                {" "}({stay.reviewCount})
              </Text>
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

function PriceDetails({ stay, price }: { stay: StayDetails; price: Quote | null }) {
  if (!price) {
    return (
      <>
        <Text variant="title" accessibilityRole="header">
          Price details
        </Text>
        <Text variant="body" tone="muted" className="mt-2">
          ${stay.pricePerNight} a night, plus cleaning and a {Math.round(SERVICE_FEE_RATE * 100)}% service fee. Pick dates to see the total.
        </Text>
      </>
    );
  }
  const lines = [
    { key: "nights", label: `$${stay.pricePerNight} × ${price.nights === 1 ? "1 night" : `${price.nights} nights`}`, cents: price.nightlyTotalCents },
    price.discountCents ? { key: "discount", label: "Weekly discount", cents: -price.discountCents } : null,
    price.cleaningCents ? { key: "cleaning", label: "Cleaning fee", cents: price.cleaningCents } : null,
    price.petFeeCents ? { key: "pets", label: "Pet fee", cents: price.petFeeCents } : null,
    { key: "service", label: `${brand.name} service fee`, cents: price.serviceFeeCents },
  ].filter((line): line is { key: string; label: string; cents: number } => !!line);
  return (
    <>
      <Text variant="title" accessibilityRole="header">
        Price details
      </Text>
      <View className="mt-4 gap-3">
        {lines.map((line) => (
          <View key={line.key} className="flex-row justify-between gap-4">
            <Text>{line.label}</Text>
            <Text tone={line.cents < 0 ? "success" : "ink"}>
              {line.cents < 0 ? `−${formatCents(-line.cents)}` : formatCents(line.cents)}
            </Text>
          </View>
        ))}
        <View className="h-px bg-border" />
        <View className="flex-row justify-between gap-4">
          <Text variant="subtitle">Total (USD)</Text>
          <Text variant="subtitle">{formatCents(price.totalCents)}</Text>
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
