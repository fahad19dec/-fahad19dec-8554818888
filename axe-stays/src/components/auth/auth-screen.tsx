import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Wordmark } from "@/components/brand/wordmark";
import { IconButton, Text } from "@/components/ui";

// The shell shared by sign-up, verify and sign-in: header, headline, body,
// the form, and a footer pinned to the bottom (it scrolls on short screens).
export function AuthScreen({
  title,
  body,
  children,
  footer,
}: {
  title: string;
  body: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="grow justify-between px-6"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <View>
        {/* The design sets the back button slightly outside the form's edge. */}
        <View className="-ml-1 h-12 flex-row items-center justify-between">
          {router.canGoBack() ? (
            <IconButton
              icon="arrowLeft"
              variant="outline"
              size="nav"
              accessibilityLabel="Back"
              onPress={() => router.back()}
            />
          ) : (
            <View />
          )}
          <Wordmark size="md" />
        </View>
        <Text variant="headline" accessibilityRole="header" className="mt-8">
          {title}
        </Text>
        {/* The design wraps the body in a narrower column than the form. */}
        <Text tone="muted" className="mt-3 max-w-70">
          {body}
        </Text>
        <View className="mt-6">{children}</View>
      </View>
      <View className="mt-10">{footer}</View>
    </ScrollView>
  );
}
