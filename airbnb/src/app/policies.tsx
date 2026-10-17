import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { ScrollView, View, type LayoutChangeEvent } from "react-native";

import { LoadError } from "@/components/load-error";
import { PolicyBody } from "@/components/stay/policy-body";
import { EmptyState, Spinner, Text } from "@/components/ui";
import { useRoamPolicies } from "@/hooks/use-roam-policies";

// Roam's policies for every stay, shown as written. Opened from Profile's
// policy card and from Help; `section` (a policy slug) scrolls to it.
export default function RoamPoliciesSheet() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { policies, error, retry } = useRoamPolicies();
  const scroll = useRef<ScrollView>(null);
  const scrolled = useRef(false);

  // Scrolls once, to the policy the sheet was opened for, once it's measured.
  const onSectionLayout = (slug: string, e: LayoutChangeEvent) => {
    if (section !== slug || scrolled.current) return;
    scrolled.current = true;
    scroll.current?.scrollTo({ y: e.nativeEvent.layout.y - 16, animated: false });
  };

  if (!policies || policies.length === 0) {
    return (
      <View className="flex-1 bg-surface py-12">
        {policies ? (
          <EmptyState icon="policy" title="No policies yet" message="Roam's policies will show up here." />
        ) : error ? (
          <LoadError error={error} subject="Roam’s policies" onRetry={retry} />
        ) : (
          <Spinner size="large" accessibilityLabel="Loading Roam’s policies" />
        )}
      </View>
    );
  }

  return (
    <ScrollView ref={scroll} className="flex-1 bg-surface" contentContainerClassName="px-5 pt-8 pb-12">
      <Text variant="heading" accessibilityRole="header">
        Roam’s policies
      </Text>

      {policies.map((policy, index) => (
        <View
          key={policy.slug}
          className={index === 0 ? "mt-6 gap-3" : "mt-8 gap-3"}
          onLayout={(e) => onSectionLayout(policy.slug, e)}
        >
          <Text variant="title" accessibilityRole="header">
            {policy.title}
          </Text>
          <PolicyBody blocks={policy.body} />
        </View>
      ))}

      <Text variant="caption" tone="muted" className="mt-10">
        These are Roam’s policies, shown as written. Questions? Contact Roam support.
      </Text>
    </ScrollView>
  );
}
