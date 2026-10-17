import * as Haptics from "expo-haptics";
import type { Ref } from "react";
import { TextInput, View, type StyleProp, type ViewStyle } from "react-native";

import { Icon, PressableScale } from "@/components/ui";
import { cn } from "@/lib/cn";

export const PROMPT_SUGGESTION = "cabin with a hot tub";

// The lavender one-sentence prompt on Home. Sending (return key or
// the arrow) fires one light haptic alongside the press, then `onSubmit`.
// With nothing typed, the arrow sends the suggestion shown as the placeholder.
export function SearchPrompt({
  value,
  onChangeText,
  onSubmit,
  autoFocus,
  ref,
  className,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
  ref?: Ref<TextInput>;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const send = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSubmit(value.trim() || PROMPT_SUGGESTION);
  };

  return (
    <View
      className={cn("h-16 flex-row items-center gap-3 rounded-full bg-lavender pr-2 pl-5", className)}
      style={style}
    >
      <Icon name="search" size={24} />
      {/* No text-* size class: its line height makes iOS draw a second line in
          a single-line input. RN's default 14 pt matches `caption`. */}
      <TextInput
        ref={ref}
        accessibilityLabel="Describe your stay"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => value.trim() && send()}
        autoFocus={autoFocus}
        placeholder={PROMPT_SUGGESTION}
        returnKeyType="search"
        submitBehavior="blurAndSubmit"
        autoCorrect={false}
        className="h-full flex-1 font-jakarta-medium text-ink placeholder:text-ink/50 selection:text-accent"
      />
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Search stays"
        onPress={send}
        className="size-12 items-center justify-center rounded-full bg-surface"
      >
        <Icon name="arrowUpRight" size={22} />
      </PressableScale>
    </View>
  );
}
