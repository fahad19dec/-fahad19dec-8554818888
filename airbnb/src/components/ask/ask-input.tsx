import { useState } from "react";
import { TextInput, View } from "react-native";

import { Icon, IconButton } from "@/components/ui";
import { MAX_QUESTION } from "@/lib/ask";

// The gray pill under Ask's chat. Sends the trimmed text and clears; the
// keyboard stays open for the next question.
export function AskInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const empty = !text.trim();

  const send = () => {
    if (empty) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <View className="mx-5 h-13 flex-row items-center gap-3 rounded-full bg-surface-muted pr-1.5 pl-4">
      <Icon name="chat" size={22} />
      <TextInput
        accessibilityLabel="Ask about this stay"
        value={text}
        onChangeText={setText}
        onSubmitEditing={send}
        maxLength={MAX_QUESTION}
        placeholder="Ask about this stay"
        returnKeyType="send"
        submitBehavior="submit"
        enablesReturnKeyAutomatically
        className="h-full flex-1 font-jakarta-medium text-input text-ink placeholder:text-ink-subtle selection:text-accent"
      />
      <IconButton
        icon="arrowUp"
        variant="primary"
        size="send"
        accessibilityLabel="Send"
        disabled={empty}
        onPress={send}
      />
    </View>
  );
}
