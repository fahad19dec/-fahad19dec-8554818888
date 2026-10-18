import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";

import { LoadError } from "@/components/load-error";
import { TripCard } from "@/components/trips/trip-card";
import { EmptyState, Skeleton, Text } from "@/components/ui";
import { useTrips, type Trip } from "@/hooks/use-trips";
import { useSession } from "@/lib/session";
import { tripGroup, type TripGroup } from "@/lib/trips";

const groups: { key: TripGroup; title: string }[] = [
  { key: "upcoming", title: "Upcoming" },
  { key: "past", title: "Past" },
  { key: "cancelled", title: "Cancelled" },
];

// The guest's bookings, grouped. Signed out, it asks them to sign in.
export default function Trips() {
  const router = useRouter();
  const { isSignedIn } = useSession();
  const { trips, error, refresh, refreshing, retry } = useTrips();

  if (!isSignedIn) {
    return (
      <View className="flex-1 justify-center bg-surface">
        <EmptyState
          icon="suitcase"
          title="Your trips live here"
          message="Sign in to book stays and see your trips."
          action={{ title: "Sign in", onPress: () => router.push("/sign-in") }}
        />
      </View>
    );
  }

  const byGroup = (key: TripGroup) => (trips ?? []).filter((t: Trip) => tripGroup(t) === key);

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="gap-6 px-4 pt-2 pb-8"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <StatusBar style="dark" />
      <Text variant="heading" accessibilityRole="header" className="mt-2">
        Trips
      </Text>
      {trips ? (
        trips.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No trips yet"
            message="Stays you book will show up here."
            action={{ title: "Explore stays", onPress: () => router.navigate("/home") }}
            className="mt-10"
          />
        ) : (
          groups.map(({ key, title }) => {
            const list = byGroup(key);
            if (!list.length) return null;
            return (
              <View key={key} className="gap-3">
                <Text variant="title" accessibilityRole="header">
                  {title}
                </Text>
                {list.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onPress={() => router.push({ pathname: "/trips/[id]", params: { id: trip.id } })} />
                ))}
              </View>
            );
          })
        )
      ) : error ? (
        <LoadError error={error} subject="your trips" onRetry={retry} className="mt-10" />
      ) : (
        <View className="gap-3" accessible accessibilityLabel="Loading trips">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
