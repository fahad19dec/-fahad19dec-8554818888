import { Tabs } from "expo-router";

import { Icon, Text, type IconName } from "@/components/ui";

const tabs: { name: string; title: string; icon: IconName; selected?: IconName }[] = [
  { name: "home", title: "Home", icon: "home", selected: "homeFill" },
  { name: "search", title: "Search", icon: "search" },
  { name: "trips", title: "Trips", icon: "calendar" },
  { name: "profile", title: "Profile", icon: "person" },
];

// Web: a plain bottom tab bar. The native tab bar (_layout.tsx) floats over
// the top of the page in a browser, covering each screen's header.
export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <Icon name={focused && tab.selected ? tab.selected : tab.icon} size={24} tone={focused ? "ink" : "subtle"} />
            ),
            tabBarLabel: ({ focused }) => (
              <Text variant="footnote" tone={focused ? "ink" : "subtle"}>
                {tab.title}
              </Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
