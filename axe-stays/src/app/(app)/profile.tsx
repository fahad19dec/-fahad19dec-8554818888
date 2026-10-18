import { StatusBar } from "expo-status-bar";
import { useRouter, type Href } from "expo-router";
import { ScrollView, View } from "react-native";

import { Wordmark } from "@/components/brand/wordmark";
import { ProfileCard } from "@/components/profile/profile-card";
import { SettingsGroup, SettingsRow } from "@/components/profile/settings-group";
import { StatsCard } from "@/components/profile/stats-card";
import { PolicyCard } from "@/components/stay/policy-card";
import { IconButton, Skeleton } from "@/components/ui";
import { usePlatformPolicies } from "@/hooks/use-platform-policies";
import { useFavoriteCount } from "@/lib/favorites";
import { brand } from "@/brand";

// The guest's profile. There are no guest accounts: Trips and Rating have no
// data until booking exists, and Saved counts this session's hearts. Hosts
// manage listings from "Manage listings" (/admin, password protected).
export default function Profile() {
  const router = useRouter();
  const saved = useFavoriteCount();
  const { policies, error: policiesError } = usePlatformPolicies();

  const refund = policies?.find((p) => p.kind === "guestRefund");
  const open = (href: Href) => router.push(href);

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
        <IconButton
          icon="settings"
          size="bar"
          accessibilityLabel="Manage listings"
          onPress={() => open("/admin")}
        />
      </View>

      <View className="mt-3">
        <ProfileCard name={`${brand.name} guest`} imageUrl={null} location={null} />
      </View>

      <View className="mt-1.5">
        <StatsCard
          stats={[
            { key: "trips", value: "0", label: "Trips", accessibilityLabel: "0 trips" },
            { key: "saved", value: String(saved), label: "Saved", accessibilityLabel: `${saved} saved` },
            { key: "rating", value: "New", label: "Rating", star: true, accessibilityLabel: "Rating: new" },
          ]}
        />
      </View>

      <View className="mt-2.5">
        <SettingsGroup title="Hosting">
          <SettingsRow icon="homeFill" label="Manage listings" onPress={() => open("/admin")} />
          <SettingsRow icon="plus" label="Add a listing" onPress={() => open({ pathname: "/admin/stays/[id]", params: { id: "new" } })} />
        </SettingsGroup>
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

    </ScrollView>
  );
}
