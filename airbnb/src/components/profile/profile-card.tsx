import { View } from "react-native";

import { Avatar, Icon, Text } from "@/components/ui";

// The guest's photo, name, location (once they've set one) and Roam badge.
export function ProfileCard({
  name,
  imageUrl,
  location,
}: {
  name: string;
  imageUrl: string | null;
  location: string | null;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-surface-muted p-2.5">
      <Avatar imageUrl={imageUrl} name={name} size="xl" />
      <View className="flex-1">
        <Text variant="heading" accessibilityRole="header" numberOfLines={2}>
          {name}
        </Text>
        {location && (
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <Icon name="pin" size={20} tone="subtle" />
            <Text tone="muted" numberOfLines={1} className="flex-1">
              {location}
            </Text>
          </View>
        )}
        <View className="mt-1.5 h-8 flex-row items-center gap-2 self-start rounded-full bg-lavender-soft pr-4 pl-3.5">
          <Icon name="star" size={22} tone="primary" />
          <Text variant="label">Roam Explorer</Text>
        </View>
      </View>
    </View>
  );
}
