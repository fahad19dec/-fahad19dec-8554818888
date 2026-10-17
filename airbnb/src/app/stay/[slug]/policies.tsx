import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { ScrollView, View, type LayoutChangeEvent } from "react-native";

import { LoadError } from "@/components/load-error";
import { PolicyBody } from "@/components/stay/policy-body";
import { EmptyState, Spinner, Text } from "@/components/ui";
import { useStay } from "@/hooks/use-stay";
import { houseRuleLines } from "@/lib/stay-details";

// Everything that governs this stay, shown as written: its own rules, its
// cancellation policy, then Roam's policies for every stay. Nothing here is
// generated. Opened from the cancellation card and from Ask's answer cards;
// `section` (a policy kind, e.g. `cancellation` or `pets`) scrolls to it.
export default function PoliciesSheet() {
  const { slug, section } = useLocalSearchParams<{ slug: string; section?: string }>();
  const { stay, error, retry } = useStay(slug);
  const scroll = useRef<ScrollView>(null);
  const scrolled = useRef(false);

  // Scrolls once, to the section the sheet was opened for, once it's measured.
  const onSectionLayout = (kind: string, e: LayoutChangeEvent) => {
    if (section !== kind || scrolled.current) return;
    scrolled.current = true;
    scroll.current?.scrollTo({ y: e.nativeEvent.layout.y - 16, animated: false });
  };

  if (!stay) {
    return (
      <View className="flex-1 bg-surface py-12">
        {stay === null ? (
          <EmptyState icon="pinOff" title="This stay isn’t available" message="It may have been removed by its host." />
        ) : error ? (
          <LoadError error={error} subject="these policies" onRetry={retry} />
        ) : (
          <Spinner size="large" accessibilityLabel="Loading policies" />
        )}
      </View>
    );
  }

  return (
    <ScrollView ref={scroll} className="flex-1 bg-surface" contentContainerClassName="px-5 pt-8 pb-12">
      <Text variant="heading" accessibilityRole="header">
        Policies
      </Text>

      <View className="mt-6 gap-3">
        <Text variant="title" accessibilityRole="header">
          House rules
        </Text>
        <View className="gap-2">
          {houseRuleLines(stay.houseRules).map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </View>
      </View>

      {stay.cancellationPolicy && (
        <View className="mt-8 gap-3" onLayout={(e) => onSectionLayout("cancellation", e)}>
          <Text variant="title" accessibilityRole="header">
            {stay.cancellationPolicy.title}
          </Text>
          <PolicyBody blocks={stay.cancellationPolicy.body} />
        </View>
      )}

      {stay.policies.map((policy) => (
        <View key={policy.kind} className="mt-8 gap-3" onLayout={(e) => onSectionLayout(policy.kind, e)}>
          <Text variant="title" accessibilityRole="header">
            {policy.title}
          </Text>
          <PolicyBody blocks={policy.body} />
        </View>
      ))}

      <Text variant="caption" tone="muted" className="mt-10">
        These are Roam’s policies and this stay’s own rules, shown as written. Questions? Contact Roam support.
      </Text>
    </ScrollView>
  );
}
