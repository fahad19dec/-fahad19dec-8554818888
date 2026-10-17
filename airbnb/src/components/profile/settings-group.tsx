import { Children, Fragment, type ReactNode } from "react";
import { View } from "react-native";

import { Icon, PressableScale, Text, type IconName } from "@/components/ui";

// A titled gray group holding a white card of rows, with hairlines between rows.
export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View className="rounded-xl bg-surface-muted px-1 pb-1.5">
      <Text variant="cardTitle" accessibilityRole="header" className="px-3.5 pt-3.5 pb-2">
        {title}
      </Text>
      <View className="rounded-lg bg-surface">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <View className="mr-3.5 ml-15 h-px bg-border" />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

export function SettingsRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      transitionProperty={["opacity"]}
      className="h-13 flex-row items-center gap-4 px-3.5"
    >
      <View className="size-9.5 items-center justify-center rounded-lg corner-squircle bg-surface-muted">
        <Icon name={icon} size={24} />
      </View>
      <Text variant="label" className="flex-1">
        {label}
      </Text>
      <Icon name="chevronRight" size={16} />
    </PressableScale>
  );
}
