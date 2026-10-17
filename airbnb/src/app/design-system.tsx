import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";

import {
  Alert,
  Badge,
  Button,
  Chip,
  EmptyState,
  Icon,
  IconButton,
  SegmentedControl,
  Skeleton,
  Spinner,
  Stepper,
  Text,
  TextField,
  Toggle,
  textVariants,
  type IconName,
  type TextVariant,
} from "@/components/ui";
import { LoadError } from "@/components/load-error";
import { ProfileCard } from "@/components/profile/profile-card";
import { SettingsGroup, SettingsRow } from "@/components/profile/settings-group";
import { StatsCard } from "@/components/profile/stats-card";
import { ResultCard, ResultCardSkeleton, ResultTag } from "@/components/search/result-card";
import { AmenityRow } from "@/components/stay/amenity-row";
import { HostSection } from "@/components/stay/host-section";
import { PolicyCard } from "@/components/stay/policy-card";
import { RatingBox } from "@/components/stay/rating-box";
import { ApiError } from "@/lib/api";
import type { SearchStay } from "@/lib/stays";

// Design system preview. Open with airbnbrecord://design-system.

const swatches = [
  { name: "primary", className: "bg-primary" },
  { name: "lavender", className: "bg-lavender" },
  { name: "ink", className: "bg-ink" },
  { name: "ink-muted", className: "bg-ink-muted" },
  { name: "surface", className: "bg-surface border border-border" },
  { name: "surface-muted", className: "bg-surface-muted border border-border" },
  { name: "border", className: "bg-border" },
  { name: "accent", className: "bg-accent" },
  { name: "success", className: "bg-success" },
  { name: "danger", className: "bg-danger" },
  { name: "info", className: "bg-info" },
  { name: "lavender-soft", className: "bg-lavender-soft" },
];

const iconSet: IconName[] = ["home", "search", "heart", "calendar", "person", "settings", "pin", "filters"];

const categories: { label: string; icon: IconName }[] = [
  { label: "All Stays", icon: "home" },
  { label: "Cabins", icon: "cabin" },
  { label: "Beach", icon: "beach" },
  { label: "City", icon: "city" },
  { label: "Villas", icon: "villa" },
];

export default function DesignSystem() {
  // Dev aid: open with ?y=<offset> to land on a section when taking screenshots.
  const { y } = useLocalSearchParams<{ y?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [filters, setFilters] = useState(["Cabins"]);
  const [category, setCategory] = useState("All Stays");
  const [view, setView] = useState<"list" | "map">("list");
  const [enabled, setEnabled] = useState(true);
  const [guests, setGuests] = useState(1);
  const [alerts, setAlerts] = useState({ success: true, danger: true });

  const toggleFilter = (label: string) =>
    setFilters((f) => (f.includes(label) ? f.filter((x) => x !== label) : [...f, label]));

  return (
    <>
      <Stack.Screen options={{ title: "Design system", headerShown: true }} />
      <ScrollView
        className="flex-1 bg-surface-muted"
        contentContainerClassName="gap-4 px-5 py-6"
        ref={scrollRef}
        onContentSizeChange={() => y && scrollRef.current?.scrollTo({ y: Number(y), animated: false })}
      >
        <Section title="Brand">
          <Text variant="display">roam</Text>
          <Text variant="title" tone="muted">
            Find unforgettable stays for every kind of trip.
          </Text>
        </Section>

        <Section title="Color palette">
          <View className="flex-row flex-wrap gap-3">
            {swatches.map((s) => (
              <View key={s.name} className="w-24 gap-1">
                <View className={`h-12 rounded-md corner-squircle ${s.className}`} />
                <Text variant="footnote" tone="muted">
                  {s.name}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Typography">
          {(Object.keys(textVariants) as TextVariant[]).map((v) => (
            <View key={v} className="gap-1">
              <Text variant="footnote" tone="subtle">
                {v}
              </Text>
              <Text variant={v}>{v === "display" ? "Find your next stay" : "Modern Cabin with Hot Tub"}</Text>
            </View>
          ))}
        </Section>

        <Section title="Buttons">
          <Button title="Book this stay" trailingIcon="arrowRight" />
          <Button
            title="Continue with Google"
            variant="secondary"
            // PLACEHOLDER: the Google "G" logo is not in assets/ yet.
            icon={
              <View className="size-6 items-center justify-center rounded-full bg-surface-muted">
                <Text variant="footnote">G</Text>
              </View>
            }
          />
          <View className="flex-row gap-3">
            <Button title="Loading" loading className="flex-1" />
            <Button title="Disabled" disabled className="flex-1" />
          </View>
          <View className="flex-row gap-4">
            <IconButton icon="heart" accessibilityLabel="Save" />
            <IconButton icon="share" accessibilityLabel="Share" />
            <IconButton icon="search" accessibilityLabel="Search" />
            <IconButton icon="bookmark" accessibilityLabel="Bookmark" />
            <IconButton icon="arrowLeft" variant="outline" size="nav" accessibilityLabel="Back" />
            <IconButton icon="arrowUp" variant="primary" size="send" accessibilityLabel="Send" />
          </View>
        </Section>

        <Section title="Input fields">
          <TextField
            icon="search"
            defaultValue="Cabins in California"
            accessory={<IconButton icon="filters" size="sm" accessibilityLabel="Filters" variant="ghost" />}
          />
          <TextField icon="person" placeholder="Enter your name" />
          <TextField icon="person" defaultValue="Joanna Smith" />
          <TextField icon="lock" defaultValue="password1" secure />
          <TextField icon="mail" label="Email address" placeholder="you@example.com" />
          <TextField icon="mail" label="Email address" defaultValue="not-an-email" invalid />
        </Section>

        <Section title="Filter chips">
          <View className="flex-row flex-wrap gap-2">
            {["Cabins", "Under $300", "Pet Friendly", "Quiet"].map((label) => (
              <Chip
                key={label}
                label={label}
                selected={filters.includes(label)}
                onPress={() => toggleFilter(label)}
              />
            ))}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((c) => (
              <Chip
                key={c.label}
                label={c.label}
                icon={c.icon}
                size="sm"
                tone="primary"
                selected={category === c.label}
                onPress={() => setCategory(c.label)}
              />
            ))}
          </View>
        </Section>

        <Section title="Iconography">
          <View className="flex-row flex-wrap gap-3">
            {iconSet.map((name) => (
              <View key={name} className="size-12 items-center justify-center rounded-full bg-surface-muted">
                <Icon name={name} />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Segmented control">
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "List", icon: "list" },
              { value: "map", label: "Map", icon: "map" },
            ]}
          />
        </Section>

        <Section title="Toggles / steppers">
          <View className="flex-row items-center gap-6">
            <Toggle value={enabled} onValueChange={setEnabled} accessibilityLabel="Instant book" />
            <Stepper value={guests} onChange={setGuests} min={1} max={16} accessibilityLabel="Guests" />
          </View>
        </Section>

        <Section title="Status / alerts">
          {alerts.success && (
            <Alert
              message="Account created successfully"
              onDismiss={() => setAlerts((a) => ({ ...a, success: false }))}
            />
          )}
          {alerts.danger && (
            <Alert
              tone="danger"
              message="Something went wrong. Please try again."
              onDismiss={() => setAlerts((a) => ({ ...a, danger: false }))}
            />
          )}
        </Section>

        <Section title="Tags / badges">
          <View className="flex-row flex-wrap gap-2">
            <Badge label="Guest favorite" icon="star" />
            <Badge label="New" tone="success" />
            <Badge label="20% off" tone="promo" />
            <Badge label="Superhost" tone="info" />
          </View>
        </Section>

        <Section title="Search">
          <View className="flex-row flex-wrap gap-2.5">
            <Chip label="Cabins" size="xs" variant="filled" selected />
            <Chip label="Under $300" size="xs" variant="filled" />
          </View>
          <View className="flex-row gap-1.5">
            <ResultTag tag={{ key: "hotTub", label: "Hot Tub", icon: "hotTub" }} />
            <ResultTag tag={{ key: "pets", label: "Pet Friendly", icon: "pets" }} />
          </View>
          <ResultCard stay={sampleStay} tags={[{ key: "pool", label: "Pool", icon: "pool" }, { key: "water", label: "Ocean View", icon: "water" }]} />
        </Section>

        <Section title="Stay">
          <View className="flex-row items-start gap-4">
            <Text variant="stayTitle" className="flex-1">
              Modern Cabin with Hot Tub
            </Text>
            <RatingBox rating={4.9} reviewCount={214} />
          </View>
          <AmenityRow
            tags={[
              { key: "hotTub", label: "Hot Tub", icon: "hotTub" },
              { key: "pets", label: "Pet Friendly", icon: "pets" },
              { key: "fireplace", label: "Fireplace", icon: "fireplace" },
              { key: "firePit", label: "Fire Pit", icon: "firePit" },
            ]}
          />
          <PolicyCard icon="chat" tile title="Ask about policies" subtitle="Cancellation, house rules, pets, check-in and more." onPress={() => {}} />
          <PolicyCard icon="policy" title="Moderate cancellation" subtitle="Full refund if you cancel at least 5 days before check-in." onPress={() => {}} />
          <HostSection
            host={{
              name: "Maya Alvarez",
              isSuperhost: true,
              bio: "I restore old mountain cabins and keep them simple.",
              hostingSince: "2016-05-01",
              responseTime: "withinHour",
              languages: ["English", "Spanish"],
            }}
          />
          <Button title="Book this stay" size="lg" />
        </Section>

        <Section title="Profile">
          <ProfileCard name="Joanna Smith" imageUrl={null} location="San Francisco, CA" />
          <StatsCard
            stats={[
              { key: "trips", value: "12", label: "Trips", accessibilityLabel: "12 trips" },
              { key: "saved", value: "8", label: "Saved", accessibilityLabel: "8 saved" },
              { key: "rating", value: "4.9", label: "Rating", star: true, accessibilityLabel: "Rating 4.9" },
            ]}
          />
          <SettingsGroup title="Account">
            <SettingsRow icon="person" label="Personal info" onPress={() => {}} />
            <SettingsRow icon="card" label="Payment methods" onPress={() => {}} />
          </SettingsGroup>
        </Section>

        <Section title="States">
          <View className="gap-3">
            <Skeleton className="h-5 w-4/5 rounded-full" />
            <Skeleton className="h-5 w-3/5 rounded-full" />
            <ResultCardSkeleton />
          </View>
          <Spinner className="self-center" />
          <EmptyState
            icon="searchOff"
            title="No stays match that yet"
            message="Try one of the searches below, or clear your search."
            action={{ title: "Clear search", onPress: () => {} }}
          />
          <LoadError error={new ApiError(0, "network_error")} subject="stays" onRetry={() => {}} />
          <LoadError error={new ApiError(500, "server_error")} subject="stays" onRetry={() => {}} />
        </Section>
      </ScrollView>
    </>
  );
}

const sampleStay: SearchStay = {
  id: "sample",
  slug: "sample",
  type: "villa",
  title: "Oceanview Villa with Private Pool",
  city: "Malibu",
  region: "CA",
  rating: 4.8,
  reviewCount: 128,
  pricePerNight: 412,
  amenities: ["pool", "oceanView"],
  petsAllowed: false,
  imageUrl: "",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-4 rounded-lg corner-squircle bg-surface p-5 shadow-card">
      <Text variant="subtitle">{title}</Text>
      {children}
    </View>
  );
}
