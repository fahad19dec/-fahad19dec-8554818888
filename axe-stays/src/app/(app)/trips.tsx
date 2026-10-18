import { useRouter } from "expo-router";
import { View } from "react-native";

import { EmptyState } from "@/components/ui";

// Placeholder until trips are designed and booking exists.
export default function Trips() {
  const router = useRouter();
  return (
    <View className="flex-1 justify-center bg-surface">
      <EmptyState
        icon="calendar"
        title="No trips yet"
        message="Stays you book will show up here."
        action={{ title: "Explore stays", onPress: () => router.navigate("/home") }}
      />
    </View>
  );
}
