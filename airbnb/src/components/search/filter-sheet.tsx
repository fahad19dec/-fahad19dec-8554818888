import * as Haptics from "expo-haptics";
import { useState, type ReactNode } from "react";
import { Modal, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Chip, IconButton, SegmentedControl, Stepper, Text, TextField, Toggle } from "@/components/ui";
import type { SearchMeta } from "@/hooks/use-search-meta";
import { useStayCount } from "@/hooks/use-search-stays";
import {
  AMENITIES,
  CANCELLATION_TIERS,
  cancellationLabels,
  emptyFilters,
  MAX_PRICE,
  PROPERTY_TYPES,
  RATING_STEPS,
  VIBES,
  vibeLabel,
  type StayFilters,
} from "@/lib/search/filters";
import { amenityLabels, typeLabels } from "@/lib/search/parse";
import { categories } from "@/components/home/category-chips";

const PRICE_PRESETS = [150, 300, 500];
const MAX_PLACES = 12;

type Rule = "any" | "yes" | "no";
const ruleOptions = [
  { value: "any", label: "Any" },
  { value: "yes", label: "Allowed" },
  { value: "no", label: "Not allowed" },
] satisfies { value: Rule; label: string }[];
const toRule = (v: boolean | undefined): Rule => (v === undefined ? "any" : v ? "yes" : "no");
const fromRule = (r: Rule) => (r === "any" ? undefined : r === "yes");

const ratingOptions = [
  { value: "any", label: "Any" },
  ...RATING_STEPS.map((r) => ({ value: String(r), label: `${r}+` })),
];

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// Every filter Search has, as a full-screen sheet over the results. Changes
// stay in a draft until "Show N stays", which counts matches as you go.
export function FilterSheet({
  visible,
  filters,
  meta,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: StayFilters;
  meta: SearchMeta | undefined;
  onApply: (filters: StayFilters) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* Remounted on every open, so the draft starts from what's applied. */}
      {visible && <FilterPanel filters={filters} meta={meta} onApply={onApply} onClose={onClose} />}
    </Modal>
  );
}

function FilterPanel({
  filters,
  meta,
  onApply,
  onClose,
}: {
  filters: StayFilters;
  meta: SearchMeta | undefined;
  onApply: (filters: StayFilters) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(filters);
  const count = useStayCount(draft);
  const set = (patch: Partial<StayFilters>) => {
    Haptics.selectionAsync().catch(() => {});
    setDraft((d) => ({ ...d, ...patch }));
  };

  const priceText = (value: number | undefined) => (value === undefined ? "" : String(value));
  const readPrice = (text: string) => {
    const digits = text.replace(/\D/g, "");
    return digits ? Math.min(Number(digits), MAX_PRICE) : undefined;
  };
  const priceInvalid = draft.minPrice !== undefined && draft.maxPrice !== undefined && draft.minPrice > draft.maxPrice;

  const places = [
    ...(meta?.countries ?? []).slice(0, MAX_PLACES),
    ...(meta?.cities ?? []).filter((c) => c.count > 1 || c.value === draft.place).slice(0, MAX_PLACES),
  ];
  // A place typed into the search ("in Lisbon") shows even when it isn't in the short lists.
  if (draft.place && !places.some((p) => p.value === draft.place)) {
    places.unshift({ value: draft.place, label: draft.place.replace(/\b[a-z]/g, (c) => c.toUpperCase()), count: 0 });
  }

  // iOS shows a page sheet below the status bar; elsewhere the modal is full screen.
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: Platform.OS === "ios" ? 0 : insets.top }}>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-2">
        <IconButton icon="close" size="nav" variant="ghost" accessibilityLabel="Close filters" onPress={onClose} />
        <Text variant="title" accessibilityRole="header">
          Filters
        </Text>
        <View className="size-12" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-8 px-5 pt-5 pb-10" keyboardShouldPersistTaps="handled">
        <Section title="Type of place">
          <View className="flex-row flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => (
              <Chip
                key={t}
                label={typeLabels[t]}
                icon={categories.find((c) => c.value === t)?.icon}
                size="sm"
                selected={draft.types.includes(t)}
                onPress={() => set({ types: toggle(draft.types, t) })}
              />
            ))}
          </View>
        </Section>

        <Section title="Price per night" hint={meta ? `Stays range from $${meta.price.min} to $${meta.price.max}.` : undefined}>
          <View className="flex-row gap-3">
            <TextField
              label="Minimum ($)"
              value={priceText(draft.minPrice)}
              onChangeText={(t) => setDraft((d) => ({ ...d, minPrice: readPrice(t) }))}
              keyboardType="number-pad"
              placeholder="Any"
              invalid={priceInvalid}
              className="flex-1"
            />
            <TextField
              label="Maximum ($)"
              value={priceText(draft.maxPrice)}
              onChangeText={(t) => setDraft((d) => ({ ...d, maxPrice: readPrice(t) || undefined }))}
              keyboardType="number-pad"
              placeholder="Any"
              invalid={priceInvalid}
              className="flex-1"
            />
          </View>
          {priceInvalid && (
            <Text variant="caption" tone="danger">
              The minimum is above the maximum.
            </Text>
          )}
          <View className="flex-row flex-wrap gap-2">
            {PRICE_PRESETS.map((p) => (
              <Chip
                key={p}
                label={`Under $${p}`}
                size="xs"
                variant="filled"
                selected={draft.maxPrice === p && draft.minPrice === undefined}
                onPress={() => set({ minPrice: undefined, maxPrice: draft.maxPrice === p ? undefined : p })}
              />
            ))}
          </View>
        </Section>

        <Section title="Rooms and guests">
          <CountRow label="Guests" value={draft.guests} max={50} onChange={(guests) => set({ guests })} />
          <CountRow label="Bedrooms" value={draft.bedrooms} max={20} onChange={(bedrooms) => set({ bedrooms })} />
          <CountRow label="Beds" value={draft.beds} max={30} onChange={(beds) => set({ beds })} />
          <CountRow label="Bathrooms" value={draft.bathrooms} max={20} onChange={(bathrooms) => set({ bathrooms })} />
        </Section>

        <Section title="Amenities" hint="Stays must have every amenity you pick.">
          <View className="flex-row flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <Chip
                key={a}
                label={amenityLabels[a]}
                size="xs"
                selected={draft.amenities.includes(a)}
                onPress={() => set({ amenities: toggle(draft.amenities, a) })}
              />
            ))}
          </View>
        </Section>

        <Section title="House rules">
          <RuleRow label="Pets" value={toRule(draft.pets)} onChange={(r) => set({ pets: fromRule(r) })} />
          <RuleRow label="Smoking" value={toRule(draft.smoking)} onChange={(r) => set({ smoking: fromRule(r) })} />
          <RuleRow label="Parties and events" value={toRule(draft.parties)} onChange={(r) => set({ parties: fromRule(r) })} />
        </Section>

        <Section title="Guest rating">
          <SegmentedControl
            options={ratingOptions}
            value={draft.minRating ? String(draft.minRating) : "any"}
            onChange={(v) => set({ minRating: v === "any" ? undefined : Number(v) })}
          />
        </Section>

        <Section title="Host">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text variant="subtitle">Superhost</Text>
              <Text variant="caption" tone="muted">
                Hosts with a record of great stays.
              </Text>
            </View>
            <Toggle
              accessibilityLabel="Superhost only"
              value={!!draft.superhost}
              onValueChange={(on) => set({ superhost: on || undefined })}
            />
          </View>
        </Section>

        <Section title="Cancellation policy">
          <View className="flex-row flex-wrap gap-2">
            {CANCELLATION_TIERS.map((c) => (
              <Chip
                key={c}
                label={cancellationLabels[c]}
                size="sm"
                selected={draft.cancellation.includes(c)}
                onPress={() => set({ cancellation: toggle(draft.cancellation, c) })}
              />
            ))}
          </View>
        </Section>

        <Section title="Vibe" hint="Stays tagged with any vibe you pick.">
          <View className="flex-row flex-wrap gap-2">
            {VIBES.map((v) => (
              <Chip
                key={v}
                label={vibeLabel(v)}
                size="xs"
                variant="filled"
                selected={draft.vibes.includes(v)}
                onPress={() => set({ vibes: toggle(draft.vibes, v) })}
              />
            ))}
          </View>
        </Section>

        {places.length > 0 && (
          <Section title="Location">
            <View className="flex-row flex-wrap gap-2">
              {places.map((p) => (
                <Chip
                  key={p.value}
                  label={p.label}
                  icon="pin"
                  size="xs"
                  selected={draft.place === p.value}
                  onPress={() => set({ place: draft.place === p.value ? undefined : p.value })}
                />
              ))}
            </View>
          </Section>
        )}
      </ScrollView>

      <View
        className="flex-row items-center gap-3 border-t border-border px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button
          title="Clear all"
          variant="secondary"
          size="sm"
          onPress={() => set({ ...emptyFilters(), text: draft.text, sort: draft.sort })}
        />
        <Button
          title={count === undefined ? "Show stays" : count === 1 ? "Show 1 stay" : `Show ${count} stays`}
          disabled={priceInvalid}
          onPress={() => onApply(draft)}
          className="flex-1"
        />
      </View>
    </View>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text variant="cardTitle" accessibilityRole="header">
          {title}
        </Text>
        {hint && (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

// 0 on the stepper means "Any".
function CountRow({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number | undefined;
  max: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View>
        <Text variant="subtitle">{label}</Text>
        <Text variant="caption" tone="muted">
          {value ? `${value} or more` : "Any"}
        </Text>
      </View>
      <Stepper value={value ?? 0} min={0} max={max} accessibilityLabel={label} onChange={(n) => onChange(n || undefined)} />
    </View>
  );
}

function RuleRow({ label, value, onChange }: { label: string; value: Rule; onChange: (value: Rule) => void }) {
  return (
    <View className="gap-2">
      <Text variant="subtitle">{label}</Text>
      <SegmentedControl options={ruleOptions} value={value} onChange={onChange} />
    </View>
  );
}
