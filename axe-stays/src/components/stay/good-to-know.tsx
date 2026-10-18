import { Pressable, View } from "react-native";

import { Icon, Text, type IconName } from "@/components/ui";
import { houseRuleParts, type HouseRuleKey } from "@/lib/stay-details";
import type { HouseRules } from "@/lib/stays";

// One glyph per rule whether it's allowed or not; the line says which.
const ruleIcons: Record<Exclude<HouseRuleKey, "additional">, IconName> = {
  checkIn: "clock",
  checkOut: "clock",
  quietHours: "moon",
  pets: "pets",
  smoking: "smoking",
  parties: "party",
};

// The stay's key house rules on its details screen, the same lines as the
// Policies sheet. The host's own extra rules stay one tap away.
export function GoodToKnow({ rules, onShowAll }: { rules: HouseRules; onShowAll: () => void }) {
  const parts = houseRuleParts(rules);
  const key = parts.filter((p) => p.key !== "additional");
  const hasMore = key.length < parts.length;

  return (
    <View className="mt-5 gap-3">
      <Text variant="title" accessibilityRole="header">
        Good to know
      </Text>
      <View className="gap-2.5">
        {key.map((part) => (
          <View key={part.key} className="flex-row items-center gap-3">
            <Icon name={ruleIcons[part.key as keyof typeof ruleIcons]} size={20} />
            <Text className="flex-1">{part.text}</Text>
          </View>
        ))}
      </View>
      {hasMore && (
        <Pressable accessibilityRole="link" hitSlop={8} onPress={onShowAll} className="self-start active:opacity-70">
          <Text variant="link" tone="accent">
            Show all rules
          </Text>
        </Pressable>
      )}
    </View>
  );
}
