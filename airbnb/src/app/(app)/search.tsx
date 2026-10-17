import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, TextInput, View } from "react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";

import { FilterSheet } from "@/components/search/filter-sheet";
import { LoadError } from "@/components/load-error";
import { ResultCard, ResultCardSkeleton } from "@/components/search/result-card";
import { SearchBar } from "@/components/search/search-bar";
import { ActiveFilters, QuickFilters } from "@/components/search/search-chips";
import { SortMenu } from "@/components/search/sort-menu";
import { Alert, Chip, EmptyState, IconButton, Text } from "@/components/ui";
import { loadSearchMeta, useSearchMeta } from "@/hooks/use-search-meta";
import { useSearchStays } from "@/hooks/use-search-stays";
import { emptyFilters, filterCount, filtersFromSentence, type StayFilters } from "@/lib/search/filters";
import { askedFor, stayTags, type StayTag } from "@/lib/search/query";
import type { SearchStay } from "@/lib/stays";
import { motion } from "@/theme";

const MAX_STAGGERED = 6;

// Offered when nothing matched. Each returns stays in Roam's catalog.
const SUGGESTIONS = ["cabin with a hot tub", "beach house under $400", "city apartment with a workspace"];

// Search: type a sentence ("pet friendly cabin with a hot tub under $300") and
// code reads it into filters (src/lib/search/filters.ts); words it doesn't
// recognize become keywords. Quick chips, the filter sheet and sort refine
// the same filters, and every change runs GET /api/stays.
export default function Search() {
  const router = useRouter();
  const { q = "" } = useLocalSearchParams<{ q?: string }>();
  const meta = useSearchMeta();
  const [text, setText] = useState(q);
  // Undefined until the query from Home has been read.
  const [filters, setFilters] = useState<StayFilters>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const input = useRef<TextInput>(null);

  // A query from Home replaces whatever was typed and set here.
  const [shownQ, setShownQ] = useState(q);
  if (q !== shownQ) {
    setShownQ(q);
    setText(q);
    setFilters(undefined);
  }

  // Places are read against every place stays have, so wait for that list.
  useEffect(() => {
    let live = true;
    loadSearchMeta()
      .then((m) => m.places)
      .catch(() => [])
      .then((places) => {
        if (live) setFilters(q ? filtersFromSentence(q, places) : emptyFilters());
      });
    return () => {
      live = false;
    };
  }, [q]);

  // Opened without a query (search button or tab), the bar is ready to type.
  useFocusEffect(
    useCallback(() => {
      if (!q) input.current?.focus();
    }, [q]),
  );

  const { result, pending, error, retry, refresh, refreshing, refreshError, clearRefreshError } = useSearchStays(filters);
  const asked = useMemo(() => (filters ? askedFor(filters) : { amenities: [], pets: false }), [filters]);

  // A typed sentence adds what it names to the filters already set, and
  // replaces the keywords.
  const submit = (sentence: string) => {
    if (!filters) return;
    setFilters(filtersFromSentence(sentence, meta?.places ?? [], { ...filters, text: undefined }));
  };

  const clearAll = () => {
    setText("");
    setFilters((f) => ({ ...emptyFilters(), sort: f?.sort ?? "best" }));
    if (q) router.setParams({ q: "" });
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-surface"
        contentContainerClassName="px-4 pt-2 pb-8"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <StatusBar style="dark" />
        <View className="flex-row items-center gap-3">
          <IconButton icon="chevronLeft" size="bar" accessibilityLabel="Back to Home" onPress={() => router.navigate("/home")} />
          <SearchBar
            ref={input}
            value={text}
            onChangeText={setText}
            onSubmit={submit}
            onFilters={() => setSheetOpen(true)}
            filterCount={filters ? filterCount(filters) : 0}
            className="flex-1"
          />
        </View>

        {filters && (
          <>
            <View className="mt-3">
              <QuickFilters filters={filters} onChange={setFilters} />
            </View>
            <View className="mt-3">
              <ActiveFilters
                filters={filters}
                onChange={(next) => {
                  if (!next.text) setText("");
                  setFilters(next);
                }}
                onClearAll={clearAll}
              />
            </View>
          </>
        )}

        {refreshError && result && (
          <Alert tone="danger" message="Couldn’t refresh. Showing what you had." onDismiss={clearRefreshError} className="mt-5" />
        )}

        {result && filters ? (
          result.total > 0 ? (
            <>
              <View className="mt-4 flex-row items-center justify-between">
                {/* Earlier results stay on screen while new filters load. */}
                <Text variant="lead" tone={pending ? "muted" : "ink"} accessibilityLiveRegion="polite">
                  {pending ? "Updating…" : result.total === 1 ? "1 stay" : `${result.total} stays`}
                </Text>
                <SortMenu value={filters.sort} onChange={(sort) => setFilters({ ...filters, sort })} />
              </View>
              {/* Keyed by request, so every change replays the entrance. */}
              <View key={result.key} className="mt-4 gap-4">
                {result.stays.map((stay, index) => (
                  <StaggeredResult key={stay.id} stay={stay} tags={stayTags(stay, asked)} index={index} />
                ))}
              </View>
            </>
          ) : (
            <EmptyState
              icon="searchOff"
              title="No stays match that yet"
              message={
                filterCount(filters) > 0 || filters.text
                  ? "Try removing a filter above, or start over."
                  : "Try describing your stay another way."
              }
              action={{ title: "Clear search and filters", onPress: clearAll }}
              className="mt-10"
            >
              <Text variant="label" tone="muted" className="mt-3 text-center">
                Try one of these:
              </Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Chip
                    key={suggestion}
                    label={suggestion}
                    size="xs"
                    onPress={() => {
                      setText(suggestion);
                      setFilters(filtersFromSentence(suggestion, meta?.places ?? [], { ...emptyFilters(), sort: filters.sort }));
                    }}
                  />
                ))}
              </View>
            </EmptyState>
          )
        ) : error ? (
          <LoadError error={error} subject="stays" onRetry={retry} className="mt-10" />
        ) : (
          <View accessibilityLabel="Finding stays" accessible>
            <Text variant="lead" tone="muted" className="mt-5">
              Finding stays…
            </Text>
            <View className="mt-4 gap-4">
              {[0, 1, 2].map((i) => (
                <ResultCardSkeleton key={i} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {filters && (
        <FilterSheet
          visible={sheetOpen}
          filters={filters}
          meta={meta}
          onClose={() => setSheetOpen(false)}
          onApply={(next) => {
            setSheetOpen(false);
            setFilters(next);
          }}
        />
      )}
    </>
  );
}

// Results rise in, 40 ms apart. Rows past the sixth come in together so a
// long list never feels slow.
function StaggeredResult({ stay, tags, index }: { stay: SearchStay; tags: StayTag[]; index: number }) {
  const router = useRouter();
  const entering = useMemo(
    () =>
      FadeInDown.duration(motion.base)
        .delay(Math.min(index, MAX_STAGGERED) * motion.stagger)
        .easing(motion.easeOut)
        .reduceMotion(ReduceMotion.System),
    [index],
  );
  return (
    <Animated.View entering={entering}>
      <ResultCard stay={stay} tags={tags} onPress={() => router.push(`/stay/${stay.slug}`)} />
    </Animated.View>
  );
}
