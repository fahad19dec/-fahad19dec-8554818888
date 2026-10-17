import { useRouter, type Href } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";

import { IconButton, Text } from "@/components/ui";

// The bar on admin screens: back, title, and an optional trailing control.
export function AdminHeader({ title, backTo, trailing }: { title: string; backTo: Href; trailing?: ReactNode }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-2">
      <IconButton
        icon="chevronLeft"
        size="nav"
        accessibilityLabel="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace(backTo))}
      />
      <Text variant="title" accessibilityRole="header" className="flex-1" numberOfLines={1}>
        {title}
      </Text>
      {trailing}
    </View>
  );
}
