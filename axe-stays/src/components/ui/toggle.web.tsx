import { Switch, type SwitchProps } from "react-native";

// Web: react-native-web's Switch takes colors as inline styles, so the "on"
// track reads the primary token's CSS variable. (The native mapping in
// toggle.tsx hands react-native-web a style object it can't use.)
export function Toggle(props: Omit<SwitchProps, "trackColor">) {
  return (
    <Switch
      trackColor={{ true: "var(--color-primary)", false: "var(--color-border)" }}
      thumbColor="var(--color-surface)"
      {...props}
    />
  );
}
