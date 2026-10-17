import { ScrollView } from "react-native";

import { Chip } from "@/components/ui";
import { TOPICS, type TopicKey } from "@/lib/ask";

// Every topic Ask can answer, in one row that bleeds to the screen edges.
// A tap asks that topic's question.
export function TopicChips({ onAsk }: { onAsk: (topic: TopicKey) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-2.5 px-5"
    >
      {TOPICS.map((topic) => (
        <Chip
          key={topic.key}
          label={topic.chip}
          accessibilityHint={`Asks: ${topic.question}`}
          size="xs"
          variant="filled"
          onPress={() => onAsk(topic.key)}
        />
      ))}
    </ScrollView>
  );
}
