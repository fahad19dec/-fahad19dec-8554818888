import { Switch, type SwitchProps } from "react-native";
import { styled } from "nativewind";

// The native Switch, with its "on" track taken from the primary token.
const StyledSwitch = styled(Switch, {
  className: { target: false, nativeStyleMapping: { color: "trackColor.true" } },
});

export function Toggle(props: Omit<SwitchProps, "trackColor">) {
  return <StyledSwitch className="text-primary" {...props} />;
}
