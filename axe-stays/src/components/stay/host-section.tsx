import { View } from "react-native";

import { Avatar, Icon, Text, type IconName } from "@/components/ui";
import { hostFacts, type HostFactKey } from "@/lib/stay-details";
import type { StayHost } from "@/lib/stays";

const factIcons: Record<HostFactKey, IconName> = {
  since: "calendar",
  response: "clock",
  languages: "globe",
};

export function SuperhostLine() {
  return (
    <View className="mt-0.5 flex-row items-center gap-1.5">
      <Icon name="rosette" size={16} tone="subtle" />
      <Text variant="label" tone="subtle">
        Superhost
      </Text>
    </View>
  );
}

// The host behind a stay, from their Sanity profile, laid out like Good to know.
export function HostSection({ host }: { host: StayHost }) {
  const facts = hostFacts(host);
  return (
    <View className="mt-5 gap-4">
      <Text variant="title" accessibilityRole="header">
        Meet your host
      </Text>
      <View className="flex-row items-center gap-4">
        <Avatar imageUrl={host.photoUrl} name={host.name} size="md" className="border-2 border-surface shadow-raised" />
        <View className="flex-1">
          <Text variant="subtitle">{host.name}</Text>
          {host.isSuperhost ? <SuperhostLine /> : null}
        </View>
      </View>
      {host.bio ? <Text>{host.bio}</Text> : null}
      {facts.length > 0 && (
        <View className="gap-2.5">
          {facts.map((fact) => (
            <View key={fact.key} className="flex-row items-center gap-3">
              <Icon name={factIcons[fact.key]} size={20} />
              <Text className="flex-1">{fact.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
