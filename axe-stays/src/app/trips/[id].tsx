import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brand } from "@/brand";
import { LoadError } from "@/components/load-error";
import { TripCard } from "@/components/trips/trip-card";
import { Alert, Button, EmptyState, IconButton, Spinner, Text } from "@/components/ui";
import { useTrip } from "@/hooks/use-trips";
import { ApiError, staysChanged } from "@/lib/api";
import { formatCents } from "@/lib/booking/pricing";
import { useAuthedApi } from "@/lib/session";
import { tripDates, tripGroup } from "@/lib/trips";

// One booking: what was paid, and cancelling it under the stay's policy.
// Cancelling asks once more on the page, showing the refund first.
export default function TripScreen() {
  const { id, booked } = useLocalSearchParams<{ id: string; booked?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const request = useAuthedApi();
  const { data, error, reload } = useTrip(id);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; message: string } | null>(
    booked ? { tone: "success", message: "You’re booked. See you there!" } : null,
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace("/trips"));

  const cancel = async () => {
    setCancelling(true);
    try {
      await request(`/api/bookings/${encodeURIComponent(id)}`, { method: "DELETE" });
      staysChanged();
      setConfirming(false);
      setNotice({ tone: "success", message: "Booking cancelled. Your refund is on its way." });
      await reload();
    } catch (e) {
      setNotice({
        tone: "danger",
        message:
          e instanceof ApiError && e.code === "already_cancelled"
            ? "This booking was already cancelled."
            : e instanceof ApiError && e.code === "account_suspended"
              ? "Your account is suspended. Contact support to cancel."
              : "Couldn’t cancel. Try again.",
      });
      await reload();
    } finally {
      setCancelling(false);
    }
  };

  let body;
  if (data === null) {
    body = <EmptyState icon="searchOff" title="Trip not found" message="It may belong to another account." action={{ title: "Back to trips", onPress: back }} className="mt-16" />;
  } else if (!data) {
    body = error ? <LoadError error={error} subject="this trip" onRetry={reload} className="mt-16" /> : <Spinner size="large" className="mt-20" />;
  } else {
    const { booking: trip, refund } = data;
    const group = tripGroup(trip);
    const lines = [
      { label: `${trip.nights === 1 ? "1 night" : `${trip.nights} nights`}`, cents: trip.nightlyTotalCents },
      trip.discountCents ? { label: "Weekly discount", cents: -trip.discountCents } : null,
      trip.cleaningCents ? { label: "Cleaning fee", cents: trip.cleaningCents } : null,
      trip.petFeeCents ? { label: "Pet fee", cents: trip.petFeeCents } : null,
      { label: `${brand.name} service fee`, cents: trip.serviceFeeCents },
    ].filter((l): l is { label: string; cents: number } => !!l);

    body = (
      <ScrollView contentContainerClassName="gap-5 px-5 pt-5" contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {notice && <Alert tone={notice.tone} message={notice.message} onDismiss={() => setNotice(null)} />}
        <TripCard trip={trip} onPress={() => router.push(`/stay/${trip.stay.slug}`)} />

        <View className="gap-2">
          <Text variant="title" accessibilityRole="header">
            Your trip
          </Text>
          <Row label="Dates" value={tripDates(trip.checkIn, trip.checkOut)} />
          <Row label="Guests" value={trip.pets ? `${trip.guests} guests, ${trip.pets} pet${trip.pets > 1 ? "s" : ""}` : `${trip.guests} guest${trip.guests > 1 ? "s" : ""}`} />
          <Row label="Booking" value={trip.id} />
        </View>

        <View className="gap-2">
          <Text variant="title" accessibilityRole="header">
            Payment
          </Text>
          {lines.map((line) => (
            <Row key={line.label} label={line.label} value={line.cents < 0 ? `−${formatCents(-line.cents)}` : formatCents(line.cents)} />
          ))}
          <View className="h-px bg-border" />
          <Row label="Total paid" value={formatCents(trip.totalCents)} strong />
          {trip.status === "cancelled" && <Row label="Refunded" value={formatCents(trip.refundCents)} strong />}
          <Text variant="footnote" tone="subtle">
            Demo payment {trip.paymentRef}. No card was charged.
          </Text>
        </View>

        {trip.status === "cancelled" ? (
          <Alert
            tone="danger"
            message={`Cancelled ${trip.cancelledBy === "admin" ? `by ${brand.name}` : "by you"}${trip.cancelReason ? `: ${trip.cancelReason}` : "."}`}
          />
        ) : group === "upcoming" && refund ? (
          confirming ? (
            <View className="gap-3 rounded-lg bg-danger-soft p-4">
              <Text variant="subtitle">Cancel this booking?</Text>
              <Text variant="body">
                You’ll get {formatCents(refund.refundCents)} back ({refund.rule.toLowerCase()}).
              </Text>
              <View className="flex-row gap-3">
                <Button title="Keep booking" variant="secondary" size="sm" onPress={() => setConfirming(false)} />
                <Button title="Cancel booking" variant="danger" size="sm" loading={cancelling} onPress={cancel} className="flex-1" />
              </View>
            </View>
          ) : (
            <Button title="Cancel booking" variant="secondary" onPress={() => setConfirming(true)} />
          )
        ) : null}
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-row items-center gap-3 border-b border-border px-5 py-2">
        <IconButton icon="chevronLeft" size="nav" accessibilityLabel="Back" onPress={back} />
        <Text variant="title" accessibilityRole="header" className="flex-1">
          Trip details
        </Text>
      </View>
      {body}
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text variant={strong ? "subtitle" : "body"} tone={strong ? "ink" : "muted"}>
        {label}
      </Text>
      <Text variant={strong ? "subtitle" : "body"} className="shrink text-right" selectable>
        {value}
      </Text>
    </View>
  );
}
