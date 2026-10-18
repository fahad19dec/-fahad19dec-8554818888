import "../global.css";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { SessionProvider, useSession } from "@/lib/session";

SplashScreen.preventAutoHideAsync();

const sheet = {
  presentation: "formSheet" as const,
  sheetGrabberVisible: true,
  sheetAllowedDetents: [0.6, 1],
  sheetExpandsWhenScrolledToEdge: true,
};

// Browsing is open to everyone; booking, trips and reports need an account.
// Sign-in (Clerk, or dev sign-in locally) opens over the current screen, and
// the guard closes it once signed in, back where the guest was.
export default function RootLayout() {
  const [loaded, error] = useFonts({
    "PlusJakartaSans-Regular": require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-Medium": require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
    "PlusJakartaSans-SemiBold": require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "PlusJakartaSans-Bold": require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
  });
  return (
    <SessionProvider>
      <RootNavigator fontsReady={loaded || !!error} />
    </SessionProvider>
  );
}

// The splash stays up until fonts and the saved session have loaded.
function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { isLoaded, isSignedIn } = useSession();
  const ready = fontsReady && isLoaded;

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
      <Stack.Screen name="trips/[id]" />
      <Stack.Screen name="account/[topic]" />
      <Stack.Screen name="policies" options={sheet} />
      <Stack.Screen name="stay/[slug]/policies" options={sheet} />
      <Stack.Screen name="stay/[slug]/report" options={sheet} />
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
      </Stack.Protected>
    </Stack>
  );
}
