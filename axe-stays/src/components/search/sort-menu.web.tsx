import { useRef, useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { Text } from "@/components/ui";
import { sortLabels, type SortOption } from "@/lib/search/filters";

import { SortLabel } from "./sort-label";

const options = Object.keys(sortLabels) as SortOption[];
const MENU_WIDTH = 224;

// Web: a popover under the label, in a transparent overlay so it sits above
// the results and closes on any outside click. iOS and Android use native menus.
export function SortMenu({ value, onChange }: { value: SortOption; onChange: (value: SortOption) => void }) {
  const trigger = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  const open = () =>
    trigger.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ top: y + height + 6, left: Math.max(8, x + width - MENU_WIDTH) }),
    );

  return (
    <>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${sortLabels[value]}`}
        accessibilityState={{ expanded: !!anchor }}
        onPress={open}
      >
        <SortLabel value={value} />
      </Pressable>
      <Modal visible={!!anchor} transparent animationType="none" onRequestClose={() => setAnchor(null)}>
        <Pressable accessibilityLabel="Close sort menu" className="flex-1" onPress={() => setAnchor(null)}>
          {anchor && (
            <View
              accessibilityRole="menu"
              className="absolute rounded-lg border border-border bg-surface py-1 shadow-overlay"
              style={{ top: anchor.top, left: anchor.left, width: MENU_WIDTH }}
            >
              {options.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: option === value }}
                  onPress={() => {
                    setAnchor(null);
                    if (option !== value) onChange(option);
                  }}
                  className="px-4 py-2.5 hover:bg-surface-muted active:opacity-70"
                >
                  <Text variant={option === value ? "subtitle" : "label"}>{sortLabels[option]}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}
