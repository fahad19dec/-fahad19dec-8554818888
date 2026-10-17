import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { styled } from "nativewind";

// The selected tint comes from a token class, so the tab bar has no hex.
const Tabs = styled(NativeTabs, {
  className: { target: false, nativeStyleMapping: { color: "tintColor" } },
});

// Native tab bar (Liquid Glass on iOS 26). Tab switches use the platform's own
// behavior and never animate in JS.
export default function AppLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Tabs className="text-ink">
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search">
          <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
          <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="trips">
          <NativeTabs.Trigger.Icon sf="calendar" md="calendar_today" />
          <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </Tabs>
    </ThemeProvider>
  );
}
