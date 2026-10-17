import { Pressable, View } from "react-native";

import { PolicyBody } from "@/components/stay/policy-body";
import { Icon, Text } from "@/components/ui";
import type { AnswerCard as AnswerCardData } from "@/lib/ask";
import { cn } from "@/lib/cn";

// One topic of a reply: where the text comes from, then that text as written.
// Knowledge Base sections keep their headings, bullets and bold via PolicyBody.
export function AnswerCard({
  card,
  onOpenPolicies,
}: {
  card: AnswerCardData;
  onOpenPolicies: (section?: string) => void;
}) {
  return (
    <View className={cn("gap-2 rounded-lg p-4", card.source ? "bg-lavender-soft" : "bg-surface-muted")}>
      {card.source && (
        <View className="flex-row items-center gap-1.5">
          <Icon name={card.source.icon} size={16} tone="accent" />
          <Text variant="footnote" tone="accent">
            {card.source.label}
          </Text>
        </View>
      )}
      <Text variant="subtitle">{card.title}</Text>
      {card.blocks ? (
        <PolicyBody blocks={card.blocks} />
      ) : (
        <View className="gap-1">
          {card.lines?.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </View>
      )}
      {card.link && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${card.link.label}: ${card.title}`}
          hitSlop={8}
          onPress={() => onOpenPolicies(card.link?.section)}
          className="self-start active:opacity-70"
        >
          <Text variant="link" tone="accent">
            {card.link.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
