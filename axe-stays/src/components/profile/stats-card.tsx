import { Fragment } from "react";
import { View } from "react-native";

import { Icon, Text } from "@/components/ui";

type Stat = { key: string; value: string; label: string; star?: boolean; accessibilityLabel: string };

// Three numbers about the guest, side by side with hairline dividers.
export function StatsCard({ stats }: { stats: Stat[] }) {
  return (
    <View className="flex-row items-center rounded-xl border border-border py-3">
      {stats.map((stat, index) => (
        <Fragment key={stat.key}>
          {index > 0 && <View className="h-12 w-px bg-border" />}
          <View accessible accessibilityLabel={stat.accessibilityLabel} className="flex-1 items-center">
            <View className="flex-row items-center gap-1.5">
              {stat.star && <Icon name="star" size={22} tone="primary" />}
              <Text variant="stat">{stat.value}</Text>
            </View>
            <Text variant="label" tone="muted">
              {stat.label}
            </Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
}
