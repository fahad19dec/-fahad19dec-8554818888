import { Image as ExpoImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminHeader } from "@/components/admin/admin-header";
import { SignInForm } from "@/components/admin/sign-in-form";
import { LoadError } from "@/components/load-error";
import { Alert, Badge, Button, EmptyState, IconButton, Skeleton, Spinner, Text, TextField } from "@/components/ui";
import { adminErrorMessage, deleteStay, listStays, signOut, useAdminSession, type AdminHost } from "@/lib/admin";
import { typeLabels } from "@/lib/search/parse";
import { placeLabel, type StayRecord } from "@/lib/stays";

const Image = styled(ExpoImage, { className: "style" });

const thumbnail = (url: string) => (url.startsWith("https://cdn.sanity.io/") ? `${url}?w=200&auto=format` : url);

// /admin: every listing, newest first, with search, edit and delete. Signed
// out, it shows the password form instead.
export default function AdminHome() {
  const insets = useSafeAreaInsets();
  const token = useAdminSession();

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <AdminHeader
        title="Manage listings"
        backTo="/profile"
        trailing={
          token ? <IconButton icon="logout" size="nav" variant="ghost" accessibilityLabel="Sign out" onPress={signOut} /> : null
        }
      />
      {token === undefined ? (
        <Spinner size="large" className="mt-20" accessibilityLabel="Loading" />
      ) : token === null ? (
        <SignInForm />
      ) : (
        <Listings />
      )}
    </View>
  );
}

function Listings() {
  const router = useRouter();
  const [data, setData] = useState<{ stays: StayRecord[]; hosts: AdminHost[] }>();
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setData(await listStays(signal));
      setError(null);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e as Error);
    }
  }, []);

  // Reloads whenever the screen comes back into view, e.g. after saving a listing.
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load]),
  );

  const hosts = useMemo(() => new Map(data?.hosts.map((h) => [h.slug, h.name])), [data]);
  const shown = useMemo(() => {
    const words = filter.toLowerCase().split(/\s+/).filter(Boolean);
    return (data?.stays ?? []).filter((s) => {
      const text = `${s.title} ${s.city} ${s.region ?? ""} ${s.country} ${typeLabels[s.type]} ${hosts.get(s.hostSlug) ?? ""}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }, [data, filter, hosts]);

  const remove = async (stay: StayRecord) => {
    setDeleting(stay.id);
    try {
      await deleteStay(stay.id);
      setConfirming(null);
      setNotice({ tone: "success", message: `Deleted “${stay.title}”.` });
      await load();
    } catch (e) {
      setNotice({ tone: "danger", message: adminErrorMessage(e) });
    } finally {
      setDeleting(null);
    }
  };

  const add = () => router.push({ pathname: "/admin/stays/[id]", params: { id: "new" } });

  if (!data) {
    return error ? (
      <LoadError error={error} subject="listings" onRetry={() => load()} className="mt-16" />
    ) : (
      <View className="gap-3 px-4 pt-5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="w-full max-w-3xl gap-4 self-center px-4 pt-4 pb-10"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <View className="flex-row items-center justify-between gap-3">
        <View>
          <Text variant="heading">{data.stays.length === 1 ? "1 listing" : `${data.stays.length} listings`}</Text>
          <Text variant="caption" tone="muted">
            Changes show in the app right away.
          </Text>
        </View>
        <Button title="Add listing" size="sm" onPress={add} />
      </View>

      {notice && <Alert tone={notice.tone} message={notice.message} onDismiss={() => setNotice(null)} />}

      <TextField
        icon="search"
        placeholder="Search by title, place, type or host"
        value={filter}
        onChangeText={setFilter}
        autoCorrect={false}
        accessibilityLabel="Search listings"
      />

      {shown.length === 0 ? (
        <EmptyState
          icon="searchOff"
          title={data.stays.length ? "No listings match" : "No listings yet"}
          message={data.stays.length ? "Try another search." : "Add your first listing to see it here."}
          action={data.stays.length ? { title: "Clear search", onPress: () => setFilter("") } : { title: "Add listing", onPress: add }}
          className="mt-8"
        />
      ) : (
        shown.map((stay) => (
          <View key={stay.id} className="flex-row gap-3 rounded-lg border border-border bg-surface p-3">
            <View className="size-20 overflow-hidden rounded-md bg-surface-muted">
              {stay.photos[0] && (
                <Image
                  source={{ uri: thumbnail(stay.photos[0].url) }}
                  accessibilityLabel={stay.photos[0].alt}
                  contentFit="cover"
                  className="absolute inset-0"
                />
              )}
            </View>
            <View className="flex-1 gap-1">
              <Text variant="subtitle" numberOfLines={1}>
                {stay.title}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {placeLabel(stay)} · {typeLabels[stay.type]} · ${stay.pricePerNight}/night
              </Text>
              <Text variant="footnote" tone="subtle" numberOfLines={1}>
                Host: {hosts.get(stay.hostSlug) ?? stay.hostSlug} · {stay.maxGuests} guests · {stay.photos.length} photos
              </Text>
              {confirming === stay.id ? (
                <View className="mt-1 flex-row flex-wrap items-center gap-2">
                  <Text variant="label" tone="danger">
                    Delete this listing?
                  </Text>
                  <Button title="Cancel" size="sm" variant="secondary" onPress={() => setConfirming(null)} />
                  <Button
                    title="Delete"
                    size="sm"
                    loading={deleting === stay.id}
                    variant="danger"
                    onPress={() => remove(stay)}
                  />
                </View>
              ) : (
                <View className="mt-1 flex-row flex-wrap gap-2">
                  <Badge label={stay.rating ? `${stay.rating.toFixed(2)} · ${stay.reviewCount} reviews` : "New"} icon="star" />
                </View>
              )}
            </View>
            <View className="gap-1">
              <IconButton
                icon="edit"
                size="sm"
                variant="muted"
                accessibilityLabel={`Edit ${stay.title}`}
                onPress={() => router.push({ pathname: "/admin/stays/[id]", params: { id: stay.id } })}
              />
              <IconButton
                icon="trash"
                size="sm"
                variant="muted"
                accessibilityLabel={`Delete ${stay.title}`}
                onPress={() => setConfirming(stay.id)}
              />
              <IconButton
                icon="arrowUpRight"
                size="sm"
                variant="muted"
                accessibilityLabel={`View ${stay.title} in the app`}
                onPress={() => router.push(`/stay/${stay.slug}`)}
              />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
