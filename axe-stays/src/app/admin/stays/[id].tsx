import { Image as ExpoImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminHeader } from "@/components/admin/admin-header";
import { Field, FieldError, FormSection, InlineField, Row, TextArea } from "@/components/admin/form-fields";
import { SignInForm } from "@/components/admin/sign-in-form";
import { categories } from "@/components/home/category-chips";
import { LoadError } from "@/components/load-error";
import { Alert, Button, Chip, EmptyState, IconButton, Spinner, Stepper, Text, Toggle } from "@/components/ui";
import {
  adminErrorMessage,
  listStays,
  saveStay,
  uploadPhoto,
  useAdminSession,
  type AdminHost,
  type StayInput,
} from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { canPickImage, pickImage } from "@/lib/pick-image";
import { AMENITIES, CANCELLATION_TIERS, cancellationLabels, PROPERTY_TYPES, VIBES, vibeLabel, type Vibe } from "@/lib/search/filters";
import { amenityLabels, typeLabels } from "@/lib/search/parse";
import type { Amenity, CancellationTier, Photo, PropertyType, StayRecord } from "@/lib/stays";

const Image = styled(ExpoImage, { className: "style" });

// Numbers are edited as text, so a half-typed "1." doesn't jump around.
type Values = {
  title: string;
  type: PropertyType;
  hostSlug: string;
  newHostName: string;
  addingHost: boolean;
  rating: string;
  reviewCount: string;
  city: string;
  region: string;
  country: string;
  neighborhood: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: string;
  amenities: Amenity[];
  pricePerNight: string;
  cleaningFee: string;
  minNights: string;
  weeklyDiscountPercent: string;
  checkInTime: string;
  checkOutTime: string;
  quietHoursFrom: string;
  quietHoursTo: string;
  petsAllowed: boolean;
  maxPets: string;
  petFee: string;
  smokingAllowed: boolean;
  partiesAllowed: boolean;
  additionalRules: string;
  cancellationPolicySlug: CancellationTier;
  summary: string;
  description: string;
  highlights: string;
  facts: string;
  vibes: Vibe[];
  photos: Photo[];
};

const blank = (hosts: AdminHost[]): Values => ({
  title: "",
  type: "cabin",
  hostSlug: hosts[0]?.slug ?? "",
  newHostName: "",
  addingHost: hosts.length === 0,
  rating: "",
  reviewCount: "",
  city: "",
  region: "",
  country: "",
  neighborhood: "",
  maxGuests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: "1",
  amenities: ["wifi", "kitchen"],
  pricePerNight: "",
  cleaningFee: "",
  minNights: "1",
  weeklyDiscountPercent: "",
  checkInTime: "15:00",
  checkOutTime: "11:00",
  quietHoursFrom: "",
  quietHoursTo: "",
  petsAllowed: false,
  maxPets: "",
  petFee: "",
  smokingAllowed: false,
  partiesAllowed: false,
  additionalRules: "",
  cancellationPolicySlug: "moderate-cancellation",
  summary: "",
  description: "",
  highlights: "",
  facts: "",
  vibes: [],
  photos: [],
});

const str = (n: number | undefined) => (n === undefined ? "" : String(n));

const fromStay = (s: StayRecord): Values => ({
  title: s.title,
  type: s.type,
  hostSlug: s.hostSlug,
  newHostName: "",
  addingHost: false,
  rating: s.rating ? String(s.rating) : "",
  reviewCount: s.reviewCount ? String(s.reviewCount) : "",
  city: s.city,
  region: s.region ?? "",
  country: s.country,
  neighborhood: s.neighborhood ?? "",
  maxGuests: s.maxGuests,
  bedrooms: s.bedrooms,
  beds: s.beds,
  bathrooms: String(s.bathrooms),
  amenities: s.amenities,
  pricePerNight: String(s.pricePerNight),
  cleaningFee: str(s.cleaningFee),
  minNights: str(s.minNights),
  weeklyDiscountPercent: str(s.weeklyDiscountPercent),
  checkInTime: s.houseRules.checkInTime,
  checkOutTime: s.houseRules.checkOutTime,
  quietHoursFrom: s.houseRules.quietHoursFrom ?? "",
  quietHoursTo: s.houseRules.quietHoursTo ?? "",
  petsAllowed: s.houseRules.petsAllowed,
  maxPets: str(s.houseRules.maxPets ?? undefined),
  petFee: str(s.houseRules.petFee ?? undefined),
  smokingAllowed: !!s.houseRules.smokingAllowed,
  partiesAllowed: !!s.houseRules.partiesAllowed,
  additionalRules: (s.houseRules.additionalRules ?? []).join("\n"),
  cancellationPolicySlug: s.cancellationPolicySlug,
  summary: s.summary ?? "",
  description: s.description ?? "",
  highlights: (s.highlights ?? []).join("\n"),
  facts: (s.facts ?? []).join("\n"),
  vibes: (s.vibes ?? []).filter((v): v is Vibe => (VIBES as readonly string[]).includes(v)),
  photos: s.photos,
});

// Empty means "not set"; anything else must be a number (the server says if it isn't).
const optionalNumber = (text: string) => (text.trim() === "" ? undefined : Number(text.trim().replace(",", ".")));
const listOf = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

function toInput(v: Values): StayInput {
  return {
    title: v.title,
    type: v.type,
    ...(v.addingHost ? { newHostName: v.newHostName } : { hostSlug: v.hostSlug }),
    rating: optionalNumber(v.rating) ?? 0,
    reviewCount: optionalNumber(v.reviewCount) ?? 0,
    city: v.city,
    region: v.region || undefined,
    country: v.country,
    neighborhood: v.neighborhood || undefined,
    maxGuests: v.maxGuests,
    bedrooms: v.bedrooms,
    beds: v.beds,
    bathrooms: optionalNumber(v.bathrooms) ?? Number.NaN,
    amenities: v.amenities,
    pricePerNight: optionalNumber(v.pricePerNight) ?? Number.NaN,
    cleaningFee: optionalNumber(v.cleaningFee),
    minNights: optionalNumber(v.minNights) ?? 1,
    weeklyDiscountPercent: optionalNumber(v.weeklyDiscountPercent),
    houseRules: {
      checkInTime: v.checkInTime.trim(),
      checkOutTime: v.checkOutTime.trim(),
      quietHoursFrom: v.quietHoursFrom.trim() || undefined,
      quietHoursTo: v.quietHoursTo.trim() || undefined,
      petsAllowed: v.petsAllowed,
      maxPets: v.petsAllowed ? optionalNumber(v.maxPets) : undefined,
      petFee: v.petsAllowed ? optionalNumber(v.petFee) : undefined,
      smokingAllowed: v.smokingAllowed,
      partiesAllowed: v.partiesAllowed,
      additionalRules: listOf(v.additionalRules),
    },
    cancellationPolicySlug: v.cancellationPolicySlug,
    summary: v.summary || undefined,
    description: v.description || undefined,
    highlights: listOf(v.highlights),
    facts: listOf(v.facts),
    vibes: v.vibes,
    photos: v.photos.map((p) => ({ url: p.url.trim(), alt: p.alt.trim() })),
  };
}

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

const preview = (url: string) => (url.startsWith("https://cdn.sanity.io/") ? `${url}?w=300&auto=format` : url);

// /admin/stays/new and /admin/stays/:id: every field a stay has. The server
// checks it all again and answers with a message per field.
export default function StayEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const token = useAdminSession();
  const isNew = id === "new";

  return (
    <View className="flex-1 bg-surface-muted" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="bg-surface">
        <AdminHeader title={isNew ? "Add listing" : "Edit listing"} backTo="/admin" />
      </View>
      {token === undefined ? (
        <Spinner size="large" className="mt-20" accessibilityLabel="Loading" />
      ) : token === null ? (
        <View className="flex-1 bg-surface">
          <SignInForm />
        </View>
      ) : (
        <Editor id={isNew ? null : id} key={id} />
      )}
    </View>
  );
}

function Editor({ id }: { id: string | null }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const [hosts, setHosts] = useState<AdminHost[]>();
  const [values, setValues] = useState<Values>();
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [missing, setMissing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listStays(controller.signal)
      .then((data) => {
        setHosts(data.hosts);
        if (!id) return setValues(blank(data.hosts));
        const stay = data.stays.find((s) => s.id === id);
        if (stay) setValues(fromStay(stay));
        else setMissing(true);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setLoadError(e);
      });
    return () => controller.abort();
  }, [id, attempt]);

  if (missing) {
    return (
      <EmptyState
        icon="pinOff"
        title="Listing not found"
        message="It may have been deleted."
        action={{ title: "Back to listings", onPress: () => router.replace("/admin") }}
        className="mt-16"
      />
    );
  }
  if (!values || !hosts) {
    return loadError ? (
      <LoadError
        error={loadError}
        subject="this listing"
        onRetry={() => {
          setLoadError(null);
          setAttempt((n) => n + 1);
        }}
        className="mt-16"
      />
    ) : (
      <Spinner size="large" className="mt-20" accessibilityLabel="Loading listing" />
    );
  }

  const v = values;
  const set = (patch: Partial<Values>) => setValues({ ...v, ...patch });
  const err = (path: string) => errors[path];
  const photoError = errors.photos ?? Object.entries(errors).find(([k]) => k.startsWith("photos."))?.[1];

  const addPhoto = (url: string) => {
    if (!url.trim()) return;
    set({ photos: [...v.photos, { url: url.trim(), alt: "" }] });
    setNewPhotoUrl("");
  };

  const upload = async () => {
    const file = await pickImage();
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      const { url } = await uploadPhoto(file);
      setValues((current) => current && { ...current, photos: [...current.photos, { url, alt: "" }] });
    } catch (e) {
      setFormError(adminErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const movePhoto = (index: number, to: number) => {
    const photos = [...v.photos];
    const [photo] = photos.splice(index, 1);
    photos.splice(to, 0, photo);
    set({ photos });
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      await saveStay(id, toInput(v));
      // Back to the list it was opened from (it reloads on focus).
      if (router.canGoBack()) router.back();
      else router.replace("/admin");
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      setFormError(adminErrorMessage(e));
      scroll.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        ref={scroll}
        className="flex-1"
        contentContainerClassName="w-full max-w-3xl gap-4 self-center px-4 pt-4 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {formError && <Alert tone="danger" message={formError} onDismiss={() => setFormError(null)} />}

        <FormSection title="Basics">
          <Field label="Title" value={v.title} onChangeText={(title) => set({ title })} maxLength={60} placeholder="Modern Cabin with Hot Tub" error={err("title")} />
          <View className="gap-2">
            <Text variant="label">Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {PROPERTY_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={typeLabels[t]}
                  icon={categories.find((c) => c.value === t)?.icon}
                  size="sm"
                  selected={v.type === t}
                  onPress={() => set({ type: t })}
                />
              ))}
            </View>
          </View>
          <View className="gap-2">
            <Text variant="label">Host</Text>
            <View className="flex-row flex-wrap gap-2">
              {hosts.map((h) => (
                <Chip
                  key={h.slug}
                  label={h.name}
                  icon={h.isSuperhost ? "rosette" : undefined}
                  size="xs"
                  selected={!v.addingHost && v.hostSlug === h.slug}
                  onPress={() => set({ hostSlug: h.slug, addingHost: false })}
                />
              ))}
              <Chip label="New host" icon="plus" size="xs" variant="filled" selected={v.addingHost} onPress={() => set({ addingHost: true })} />
            </View>
            {v.addingHost && (
              <Field label="New host’s name" value={v.newHostName} onChangeText={(newHostName) => set({ newHostName })} maxLength={60} error={err("newHostName")} />
            )}
            <FieldError message={err("hostSlug")} />
          </View>
          <Row>
            <Field label="Rating (0–5)" value={v.rating} onChangeText={(rating) => set({ rating })} keyboardType="decimal-pad" placeholder="New" error={err("rating")} />
            <Field label="Reviews" value={v.reviewCount} onChangeText={(reviewCount) => set({ reviewCount })} keyboardType="number-pad" placeholder="0" error={err("reviewCount")} />
          </Row>
        </FormSection>

        <FormSection title="Location">
          <Row>
            <Field label="City" value={v.city} onChangeText={(city) => set({ city })} error={err("city")} />
            <Field label="Region or state" value={v.region} onChangeText={(region) => set({ region })} placeholder="CA, Tuscany…" error={err("region")} />
          </Row>
          <Row>
            <Field label="Country" value={v.country} onChangeText={(country) => set({ country })} error={err("country")} />
            <Field label="Neighborhood" value={v.neighborhood} onChangeText={(neighborhood) => set({ neighborhood })} placeholder="Optional" error={err("neighborhood")} />
          </Row>
        </FormSection>

        <FormSection title="Space">
          <InlineField label="Max guests">
            <Stepper value={v.maxGuests} min={1} max={50} accessibilityLabel="Max guests" onChange={(maxGuests) => set({ maxGuests })} />
          </InlineField>
          <InlineField label="Bedrooms" hint="0 for a studio">
            <Stepper value={v.bedrooms} min={0} max={20} accessibilityLabel="Bedrooms" onChange={(bedrooms) => set({ bedrooms })} />
          </InlineField>
          <InlineField label="Beds">
            <Stepper value={v.beds} min={1} max={30} accessibilityLabel="Beds" onChange={(beds) => set({ beds })} />
          </InlineField>
          <Field label="Bathrooms" value={v.bathrooms} onChangeText={(bathrooms) => set({ bathrooms })} keyboardType="decimal-pad" placeholder="1.5" error={err("bathrooms")} />
          <View className="gap-2">
            <Text variant="label">Amenities</Text>
            <View className="flex-row flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <Chip key={a} label={amenityLabels[a]} size="xs" selected={v.amenities.includes(a)} onPress={() => set({ amenities: toggle(v.amenities, a) })} />
              ))}
            </View>
          </View>
        </FormSection>

        <FormSection title="Price" hint="In US dollars.">
          <Row>
            <Field label="Per night" value={v.pricePerNight} onChangeText={(pricePerNight) => set({ pricePerNight })} keyboardType="number-pad" error={err("pricePerNight")} />
            <Field label="Cleaning fee" value={v.cleaningFee} onChangeText={(cleaningFee) => set({ cleaningFee })} keyboardType="number-pad" placeholder="None" error={err("cleaningFee")} />
          </Row>
          <Row>
            <Field label="Minimum nights" value={v.minNights} onChangeText={(minNights) => set({ minNights })} keyboardType="number-pad" error={err("minNights")} />
            <Field label="Weekly discount (%)" value={v.weeklyDiscountPercent} onChangeText={(weeklyDiscountPercent) => set({ weeklyDiscountPercent })} keyboardType="number-pad" placeholder="None" error={err("weeklyDiscountPercent")} />
          </Row>
        </FormSection>

        <FormSection title="House rules" hint="Times are 24-hour, e.g. 15:00.">
          <Row>
            <Field label="Check-in from" value={v.checkInTime} onChangeText={(checkInTime) => set({ checkInTime })} error={err("houseRules.checkInTime")} />
            <Field label="Check-out by" value={v.checkOutTime} onChangeText={(checkOutTime) => set({ checkOutTime })} error={err("houseRules.checkOutTime")} />
          </Row>
          <Row>
            <Field label="Quiet hours from" value={v.quietHoursFrom} onChangeText={(quietHoursFrom) => set({ quietHoursFrom })} placeholder="22:00" error={err("houseRules.quietHoursFrom")} />
            <Field label="Quiet hours to" value={v.quietHoursTo} onChangeText={(quietHoursTo) => set({ quietHoursTo })} placeholder="08:00" error={err("houseRules.quietHoursTo")} />
          </Row>
          <InlineField label="Pets allowed">
            <Toggle accessibilityLabel="Pets allowed" value={v.petsAllowed} onValueChange={(petsAllowed) => set({ petsAllowed })} />
          </InlineField>
          {v.petsAllowed && (
            <Row>
              <Field label="Max pets" value={v.maxPets} onChangeText={(maxPets) => set({ maxPets })} keyboardType="number-pad" placeholder="Any" error={err("houseRules.maxPets")} />
              <Field label="Pet fee per stay ($)" value={v.petFee} onChangeText={(petFee) => set({ petFee })} keyboardType="number-pad" placeholder="None" error={err("houseRules.petFee")} />
            </Row>
          )}
          <InlineField label="Smoking allowed">
            <Toggle accessibilityLabel="Smoking allowed" value={v.smokingAllowed} onValueChange={(smokingAllowed) => set({ smokingAllowed })} />
          </InlineField>
          <InlineField label="Parties and events allowed">
            <Toggle accessibilityLabel="Parties allowed" value={v.partiesAllowed} onValueChange={(partiesAllowed) => set({ partiesAllowed })} />
          </InlineField>
          <TextArea label="Other rules" hint="One per line, shown as written." value={v.additionalRules} onChangeText={(additionalRules) => set({ additionalRules })} error={err("houseRules.additionalRules")} />
          <View className="gap-2">
            <Text variant="label">Cancellation policy</Text>
            <View className="flex-row flex-wrap gap-2">
              {CANCELLATION_TIERS.map((c) => (
                <Chip key={c} label={cancellationLabels[c]} size="sm" selected={v.cancellationPolicySlug === c} onPress={() => set({ cancellationPolicySlug: c })} />
              ))}
            </View>
          </View>
        </FormSection>

        <FormSection title="Description" hint="Search matches words in all of these.">
          <Field label="Summary (shown in search)" value={v.summary} onChangeText={(summary) => set({ summary })} maxLength={90} error={err("summary")} />
          <TextArea label="Description" value={v.description} onChangeText={(description) => set({ description })} maxLength={2000} error={err("description")} />
          <TextArea label="Highlights" hint="Up to 4, one per line." value={v.highlights} onChangeText={(highlights) => set({ highlights })} error={err("highlights")} />
          <TextArea label="Facts" hint="Plain facts about the stay, one per line." value={v.facts} onChangeText={(facts) => set({ facts })} error={err("facts")} />
          <View className="gap-2">
            <Text variant="label">Vibes</Text>
            <View className="flex-row flex-wrap gap-2">
              {VIBES.map((vibe) => (
                <Chip key={vibe} label={vibeLabel(vibe)} size="xs" variant="filled" selected={v.vibes.includes(vibe)} onPress={() => set({ vibes: toggle(v.vibes, vibe) })} />
              ))}
            </View>
          </View>
        </FormSection>

        <FormSection title="Photos" hint="The first photo is the cover. Each needs a short description for screen readers.">
          {v.photos.map((photo, index) => (
            <View key={`${photo.url}-${index}`} className="flex-row gap-3">
              <View className="size-20 overflow-hidden rounded-md bg-surface-muted">
                <Image source={{ uri: preview(photo.url) }} contentFit="cover" className="absolute inset-0" accessibilityLabel={photo.alt} />
              </View>
              <View className="flex-1 gap-2">
                <Field
                  label={index === 0 ? "Cover photo description" : `Photo ${index + 1} description`}
                  value={photo.alt}
                  onChangeText={(alt) => set({ photos: v.photos.map((p, i) => (i === index ? { ...p, alt } : p)) })}
                  error={err(`photos.${index}.alt`) ?? err(`photos.${index}.url`)}
                />
                <Text variant="footnote" tone="subtle" numberOfLines={1}>
                  {photo.url}
                </Text>
              </View>
              <View className="gap-1">
                {index > 0 && <IconButton icon="arrowUp" size="sm" variant="muted" accessibilityLabel="Move photo up" onPress={() => movePhoto(index, index - 1)} />}
                <IconButton icon="trash" size="sm" variant="muted" accessibilityLabel="Remove photo" onPress={() => set({ photos: v.photos.filter((_, i) => i !== index) })} />
              </View>
            </View>
          ))}
          <Row>
            <Field
              label="Add a photo by URL"
              value={newPhotoUrl}
              onChangeText={setNewPhotoUrl}
              placeholder="https://…"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onSubmitEditing={() => addPhoto(newPhotoUrl)}
            />
          </Row>
          <View className="flex-row flex-wrap gap-2">
            <Button title="Add URL" size="sm" variant="secondary" disabled={!newPhotoUrl.trim()} onPress={() => addPhoto(newPhotoUrl)} />
            {canPickImage && <Button title="Upload photo" size="sm" variant="secondary" loading={uploading} onPress={upload} />}
          </View>
          <FieldError message={photoError} />
        </FormSection>
      </ScrollView>

      <View className="border-t border-border bg-surface px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <View className="w-full max-w-3xl flex-row gap-3 self-center">
          <Button title="Cancel" variant="secondary" size="sm" onPress={() => (router.canGoBack() ? router.back() : router.replace("/admin"))} />
          <Button title={id ? "Save changes" : "Publish listing"} loading={saving} onPress={save} className="flex-1" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
