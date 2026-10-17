import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState, IconButton, Text, type IconName } from "@/components/ui";

const topics: Record<string, { title: string; icon: IconName; message: string; policies?: boolean }> = {
  payments: {
    title: "Payment methods",
    icon: "card",
    message: "You’ll add payment methods here once booking opens in Roam.",
  },
  notifications: {
    title: "Notifications",
    icon: "bell",
    message: "Notification settings will live here.",
  },
  help: {
    title: "Help & support",
    icon: "help",
    message: "In-app support is on the way. Roam’s policies answer most questions.",
    policies: true,
  },
};

// Profile rows whose features don't exist yet.
export default function AccountTopic() {
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const page = topics[topic];

  const back = () => (router.canGoBack() ? router.back() : router.replace("/profile"));

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-row items-center gap-3 border-b border-border px-5 py-2">
        <IconButton icon="chevronLeft" size="nav" accessibilityLabel="Back" onPress={back} />
        <Text variant="title" accessibilityRole="header" className="flex-1">
          {page?.title ?? "Profile"}
        </Text>
      </View>
      <View className="flex-1 justify-center" style={{ paddingBottom: insets.bottom }}>
        {page ? (
          <EmptyState
            icon={page.icon}
            title="Coming soon"
            message={page.message}
            action={
              page.policies
                ? {
                    title: "Read Roam’s policies",
                    onPress: () => {
                      router.push("/policies");
                    },
                  }
                : undefined
            }
          />
        ) : (
          <EmptyState
            icon="pinOff"
            title="This page isn’t available"
            message="It may have moved."
            action={{ title: "Back", onPress: back }}
          />
        )}
      </View>
    </View>
  );
}
