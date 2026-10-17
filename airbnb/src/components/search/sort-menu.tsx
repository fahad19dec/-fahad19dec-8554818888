import { DropdownMenu, DropdownMenuItem, Host, RNHostView, Text } from "@expo/ui/jetpack-compose";
import { useState } from "react";
import { Pressable } from "react-native";

import { sortLabels, type SortOption } from "@/lib/search/filters";

import { SortLabel } from "./sort-label";

const options = Object.keys(sortLabels) as SortOption[];

// Jetpack Compose dropdown (Android). iOS uses sort-menu.ios.tsx.
export function SortMenu({ value, onChange }: { value: SortOption; onChange: (value: SortOption) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Host matchContents>
      <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
        <DropdownMenu.Trigger>
          <RNHostView matchContents>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${sortLabels[value]}`}
              onPress={() => setExpanded(true)}
            >
              <SortLabel value={value} />
            </Pressable>
          </RNHostView>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {options.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => {
                setExpanded(false);
                if (option !== value) onChange(option);
              }}
            >
              <DropdownMenuItem.Text>
                <Text>{sortLabels[option]}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}
