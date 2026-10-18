import { StatusBar } from "expo-status-bar";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { Wordmark } from "@/components/brand/wordmark";
import { ProfileCard } from "@/components/profile/profile-card";
import { SettingsGroup, SettingsRow } from "@/components/profile/settings-group";
import { StatsCard } from "@/components/profile/stats-card";
import { PolicyCard } from "@/components/stay/policy-card";
import { Alert, Button, Skeleton, Text } from "@/components/ui";
import { usePlatformPolicies } from "@/hooks/use-platform-policies";
import { useTrips } from "@/hooks/use-trips";
import { useFavoriteCount } from "@/lib/favorites";
import { useSession } from "@/lib/session";
import { brand } from "@/brand";

// The signed-in guest's profile, from their account (name, photo, status).
// Signed out, it offers sign-in. Listings are managed in the admin dashboard,
// not here.
export default function Profile() {
  const router = useRouter();
  const saved = useFavoriteCount();
  const { policies, error: policiesError } = usePlatformPolicies();
  const { isSignedIn, account, signOut } = useSession();
  const { trips } = useTrips();
  const [signingOut, setSigningOut] = useState(false);

  const refund = policies?.find((p) => p.kind === "guestRefund");
  const open = (href: Href) => router.push(href);
  const name = account?.name || account?.email?.split("@")[0] || `${brand.name} guest`;
  const tripCount = trips?.filter((t) => t.status === "confirmed").length ?? 0;

  const leave = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="px-4 pt-2 pb-8"
      contentInsetAdjustmentBehavior="automatic"
    >
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-between">
        <View className="ml-1 shrink">
          <Wordmark size="header" />
        </View>
      </View>

      {isSignedIn ? (
        <View className="mt-3">
          <ProfileCard name={name} imageUrl={account?.imageUrl ?? null} location={null} />
        </View>
      ) : (
        <View className="mt-3 gap-3 rounded-xl bg-surface-muted p-5">
          <Text variant="title">Sign in to {brand.name}</Text>
          <Text variant="body" tone="muted">
            Book stays, see your trips and report a problem with a listing.
          </Text>
          <Button title="Sign in" onPress={() => router.push("/sign-in")} />
        </View>
      )}

      {account?.status === "banned" && (
        <Alert
          tone="danger"
          message={`Your account is suspended${account.banReason ? `: ${account.banReason}` : "."} Contact ${brand.supportName}.`}
          className="mt-3"
        />
      )}

      <View className="mt-1.5">
        <StatsCard
          stats={[
            { key: "trips", value: String(tripCount), label: "Trips", accessibilityLabel: `${tripCount} trips` },
            { key: "saved", value: String(saved), label: "Saved", accessibilityLabel: `${saved} saved` },
            { key: "rating", value: "New", label: "Rating", star: true, accessibilityLabel: "Rating: new" },
          ]}
        />
      </View>

      <View className="mt-2.5">
        <SettingsGroup title="Account">
          <SettingsRow icon="card" label="Payment methods" onPress={() => open("/account/payments")} />
          <SettingsRow icon="suitcase" label="Trips" onPress={() => router.navigate("/trips")} />
        </SettingsGroup>
      </View>

      <View className="mt-2.5">
        <SettingsGroup title="Preferences">
          <SettingsRow icon="bell" label="Notifications" onPress={() => open("/account/notifications")} />
          <SettingsRow icon="help" label="Help & support" onPress={() => open("/account/help")} />
        </SettingsGroup>
      </View>

      {/* The platform's own policy text, word for word. Left out if it can't load. */}
      {policies ? (
        refund && (
          <View className="mt-2.5">
            <PolicyCard
              icon="policy"
              title={refund.title}
              subtitle={refund.summary}
              onPress={() => {
                router.push({ pathname: "/policies", params: { section: refund.slug } });
              }}
            />
          </View>
        )
      ) : policiesError ? null : (
        <Skeleton className="mt-2.5 h-17 rounded-lg" />
      )}

      {isSignedIn && <Button title="Sign out" variant="secondary" loading={signingOut} onPress={leave} className="mt-6" />}
    </ScrollView>
  );
}
