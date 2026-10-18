import "../global.css";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

const sheet = {
  presentation: "formSheet" as const,
  sheetGrabberVisible: true,
  sheetAllowedDetents: [0.6, 1],
  sheetExpandsWhenScrolledToEdge: true,
};

// Browsing is open to every guest. The admin screens check their own sign-in
// (src/lib/admin.ts), so the splash only waits for fonts.
export default function RootLayout() {
  const [loaded, error] = useFonts({
    "PlusJakartaSans-Regular": require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-Medium": require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
    "PlusJakartaSans-SemiBold": require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "PlusJakartaSans-Bold": require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
  });
  const ready = loaded || !!error;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(app)" />
      {/* Pushed over the tabs, so the tab bar hides on a stay. */}
      <Stack.Screen name="stay/[slug]/index" />
      <Stack.Screen name="stay/[slug]/ask" />
      <Stack.Screen name="stay/[slug]/book" />
      <Stack.Screen name="account/[topic]" />
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="admin/stays/[id]" />
      <Stack.Screen name="policies" options={sheet} />
      <Stack.Screen name="stay/[slug]/policies" options={sheet} />
    </Stack>
  );
}
