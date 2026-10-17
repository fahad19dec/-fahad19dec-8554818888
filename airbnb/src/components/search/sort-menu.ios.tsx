import { Button, Host, Menu, RNHostView } from "@expo/ui/swift-ui";

import { sortLabels, type SortOption } from "@/lib/search/filters";

import { SortLabel } from "./sort-label";

const options = Object.keys(sortLabels) as SortOption[];

// SwiftUI Menu: opens on tap, checkmark on the current sort.
export function SortMenu({ value, onChange }: { value: SortOption; onChange: (value: SortOption) => void }) {
  return (
    <Host matchContents>
      <Menu
        label={
          <RNHostView matchContents>
            <SortLabel value={value} />
          </RNHostView>
        }
      >
        {options.map((option) => (
          <Button
            key={option}
            label={sortLabels[option]}
            systemImage={option === value ? "checkmark" : undefined}
            onPress={() => option !== value && onChange(option)}
          />
        ))}
      </Menu>
    </Host>
  );
}
