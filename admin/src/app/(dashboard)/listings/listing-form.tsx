"use client";

import { ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";

import { AMENITIES, CANCELLATION_TIERS, cancellationLabels, PROPERTY_TYPES, VIBES, vibeLabel } from "@core/search/filters";
import { amenityLabels, typeLabels } from "@core/search/parse";
import type { Photo, StayRecord } from "@core/stays";
import { CheckboxField, Field, NativeSelect } from "@/components/form-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { photoSrc } from "@/lib/format";

import { saveListingAction, uploadPhotoAction, type ListingFormState } from "../actions";

type Host = { slug: string; name: string };

// Every field a stay has. The server validates it all again (the same rules
// the guest app uses) and returns a message per field, shown next to it.
export function ListingForm({ stay, hosts }: { stay?: StayRecord; hosts: Host[] }) {
  const [state, action, saving] = useActionState<ListingFormState, FormData>(saveListingAction.bind(null, stay?.id ?? null), {});
  const err = (path: string) => state.fields?.[path];
  const photoError = state.fields?.photos ?? Object.entries(state.fields ?? {}).find(([k]) => k.startsWith("photos."))?.[1];
  const [newHost, setNewHost] = useState(hosts.length === 0);
  const [pets, setPets] = useState(stay?.houseRules.petsAllowed ?? false);
  const r = stay?.houseRules;

  return (
    <form action={action} className="grid gap-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>{state.error}</AlertTitle>
          {state.fields && <AlertDescription>Check the fields marked below.</AlertDescription>}
        </Alert>
      )}

      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Title" error={err("title")} className="sm:col-span-2">
            <Input id="title" name="title" defaultValue={stay?.title} maxLength={60} required aria-invalid={!!err("title")} />
          </Field>
          <Field id="type" label="Type" error={err("type")}>
            <NativeSelect id="type" name="type" defaultValue={stay?.type ?? "cabin"}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id={newHost ? "newHostName" : "hostSlug"} label="Host" error={err("hostSlug") ?? err("newHostName")}>
            {newHost ? (
              <Input id="newHostName" name="newHostName" placeholder="New host’s name" maxLength={60} />
            ) : (
              <NativeSelect id="hostSlug" name="hostSlug" defaultValue={stay?.hostSlug ?? hosts[0]?.slug}>
                {hosts.map((h) => (
                  <option key={h.slug} value={h.slug}>
                    {h.name}
                  </option>
                ))}
              </NativeSelect>
            )}
            <button type="button" className="justify-self-start text-xs text-primary underline-offset-2 hover:underline" onClick={() => setNewHost(!newHost)}>
              {newHost ? "Pick an existing host" : "Add a new host"}
            </button>
          </Field>
          <Field id="rating" label="Rating (0–5)" hint="Leave empty for a new listing." error={err("rating")}>
            <Input id="rating" name="rating" inputMode="decimal" defaultValue={stay?.rating || ""} />
          </Field>
          <Field id="reviewCount" label="Reviews" error={err("reviewCount")}>
            <Input id="reviewCount" name="reviewCount" inputMode="numeric" defaultValue={stay?.reviewCount || ""} />
          </Field>
        </div>
      </Section>

      <Section title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="city" label="City" error={err("city")}>
            <Input id="city" name="city" defaultValue={stay?.city} required />
          </Field>
          <Field id="region" label="Region or state" error={err("region")}>
            <Input id="region" name="region" defaultValue={stay?.region} placeholder="CA, Tuscany…" />
          </Field>
          <Field id="country" label="Country" error={err("country")}>
            <Input id="country" name="country" defaultValue={stay?.country} required />
          </Field>
          <Field id="neighborhood" label="Neighborhood" error={err("neighborhood")}>
            <Input id="neighborhood" name="neighborhood" defaultValue={stay?.neighborhood} placeholder="Optional" />
          </Field>
        </div>
      </Section>

      <Section title="Space">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field id="maxGuests" label="Max guests" error={err("maxGuests")}>
            <Input id="maxGuests" name="maxGuests" type="number" min={1} max={50} defaultValue={stay?.maxGuests ?? 2} />
          </Field>
          <Field id="bedrooms" label="Bedrooms" hint="0 for a studio" error={err("bedrooms")}>
            <Input id="bedrooms" name="bedrooms" type="number" min={0} max={20} defaultValue={stay?.bedrooms ?? 1} />
          </Field>
          <Field id="beds" label="Beds" error={err("beds")}>
            <Input id="beds" name="beds" type="number" min={1} max={30} defaultValue={stay?.beds ?? 1} />
          </Field>
          <Field id="bathrooms" label="Bathrooms" error={err("bathrooms")}>
            <Input id="bathrooms" name="bathrooms" inputMode="decimal" defaultValue={stay?.bathrooms ?? 1} />
          </Field>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Amenities</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AMENITIES.map((a) => (
              <CheckboxField key={a} name="amenities" value={a} label={amenityLabels[a]} defaultChecked={stay ? stay.amenities.includes(a) : a === "wifi" || a === "kitchen"} />
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title="Price" description="In US dollars.">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field id="pricePerNight" label="Per night" error={err("pricePerNight")}>
            <Input id="pricePerNight" name="pricePerNight" inputMode="numeric" defaultValue={stay?.pricePerNight} required />
          </Field>
          <Field id="cleaningFee" label="Cleaning fee" error={err("cleaningFee")}>
            <Input id="cleaningFee" name="cleaningFee" inputMode="numeric" defaultValue={stay?.cleaningFee} placeholder="None" />
          </Field>
          <Field id="minNights" label="Minimum nights" error={err("minNights")}>
            <Input id="minNights" name="minNights" inputMode="numeric" defaultValue={stay?.minNights ?? 1} />
          </Field>
          <Field id="weeklyDiscountPercent" label="Weekly discount (%)" error={err("weeklyDiscountPercent")}>
            <Input id="weeklyDiscountPercent" name="weeklyDiscountPercent" inputMode="numeric" defaultValue={stay?.weeklyDiscountPercent} placeholder="None" />
          </Field>
        </div>
      </Section>

      <Section title="House rules" description="Times are 24-hour, e.g. 15:00.">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field id="checkInTime" label="Check-in from" error={err("houseRules.checkInTime")}>
            <Input id="checkInTime" name="checkInTime" defaultValue={r?.checkInTime ?? "15:00"} />
          </Field>
          <Field id="checkOutTime" label="Check-out by" error={err("houseRules.checkOutTime")}>
            <Input id="checkOutTime" name="checkOutTime" defaultValue={r?.checkOutTime ?? "11:00"} />
          </Field>
          <Field id="quietHoursFrom" label="Quiet hours from" error={err("houseRules.quietHoursFrom")}>
            <Input id="quietHoursFrom" name="quietHoursFrom" defaultValue={r?.quietHoursFrom ?? ""} placeholder="22:00" />
          </Field>
          <Field id="quietHoursTo" label="Quiet hours to" error={err("houseRules.quietHoursTo")}>
            <Input id="quietHoursTo" name="quietHoursTo" defaultValue={r?.quietHoursTo ?? ""} placeholder="08:00" />
          </Field>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <CheckboxField name="petsAllowed" label="Pets allowed" checked={pets} onChange={(e) => setPets(e.target.checked)} />
          <CheckboxField name="smokingAllowed" label="Smoking allowed" defaultChecked={!!r?.smokingAllowed} />
          <CheckboxField name="partiesAllowed" label="Parties and events allowed" defaultChecked={!!r?.partiesAllowed} />
        </div>
        {pets && (
          <div className="grid gap-4 sm:grid-cols-4">
            <Field id="maxPets" label="Max pets" error={err("houseRules.maxPets")}>
              <Input id="maxPets" name="maxPets" inputMode="numeric" defaultValue={r?.maxPets ?? ""} placeholder="Any" />
            </Field>
            <Field id="petFee" label="Pet fee per stay ($)" error={err("houseRules.petFee")}>
              <Input id="petFee" name="petFee" inputMode="numeric" defaultValue={r?.petFee ?? ""} placeholder="None" />
            </Field>
          </div>
        )}
        <Field id="additionalRules" label="Other rules" hint="One per line, shown to guests as written." error={err("houseRules.additionalRules")}>
          <Textarea id="additionalRules" name="additionalRules" rows={3} defaultValue={r?.additionalRules?.join("\n")} />
        </Field>
        <Field id="cancellationPolicySlug" label="Cancellation policy" error={err("cancellationPolicySlug")} className="sm:max-w-xs">
          <NativeSelect id="cancellationPolicySlug" name="cancellationPolicySlug" defaultValue={stay?.cancellationPolicySlug ?? "moderate-cancellation"}>
            {CANCELLATION_TIERS.map((c) => (
              <option key={c} value={c}>
                {cancellationLabels[c]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </Section>

      <Section title="Description" description="Guest search matches words in all of these.">
        <Field id="summary" label="Summary (shown in search)" error={err("summary")}>
          <Input id="summary" name="summary" maxLength={90} defaultValue={stay?.summary} />
        </Field>
        <Field id="description" label="Description" error={err("description")}>
          <Textarea id="description" name="description" rows={5} maxLength={2000} defaultValue={stay?.description} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="highlights" label="Highlights" hint="Up to 4, one per line." error={err("highlights")}>
            <Textarea id="highlights" name="highlights" rows={4} defaultValue={stay?.highlights?.join("\n")} />
          </Field>
          <Field id="facts" label="Facts" hint="Plain facts, one per line." error={err("facts")}>
            <Textarea id="facts" name="facts" rows={4} defaultValue={stay?.facts?.join("\n")} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Vibes</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VIBES.map((v) => (
              <CheckboxField key={v} name="vibes" value={v} label={vibeLabel(v)} defaultChecked={stay?.vibes?.includes(v)} />
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title="Photos" description="The first photo is the cover. Each needs a short description for screen readers.">
        <PhotoEditor initial={stay?.photos ?? []} error={photoError} fieldError={err} />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        {!stay && <CheckboxField name="publish" label="Publish now (skip review)" />}
        <div className="ml-auto flex gap-2">
          <Link href="/listings" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Cancel
          </Link>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Saving…" : stay ? "Save changes" : "Create listing"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  );
}

// Photos are edited here and posted as one JSON field.
function PhotoEditor({ initial, error, fieldError }: { initial: Photo[]; error?: string; fieldError: (path: string) => string | undefined }) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [url, setUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (photoUrl: string) => setPhotos((list) => [...list, { url: photoUrl, alt: "" }]);
  const update = (i: number, patch: Partial<Photo>) => setPhotos((list) => list.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const move = (i: number) => setPhotos((list) => [list[i], ...list.slice(0, i), ...list.slice(i + 1)]);

  const upload = (file: File) =>
    startUpload(async () => {
      setUploadError(null);
      const form = new FormData();
      form.set("file", file);
      const result = await uploadPhotoAction(form);
      if ("url" in result) add(result.url);
      else setUploadError(result.error);
    });

  return (
    <div className="grid gap-3">
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />
      {photos.map((photo, i) => (
        <div key={`${photo.url}-${i}`} className="flex flex-wrap items-start gap-3 rounded-lg border p-2 sm:flex-nowrap">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote and uploaded photos, any host */}
          <img src={photoSrc(photo.url, 240) ?? ""} alt="" className="h-16 w-24 shrink-0 rounded-md bg-muted object-cover" />
          <div className="grid min-w-0 flex-1 gap-1">
            <Input
              aria-label={i === 0 ? "Cover photo description" : `Photo ${i + 1} description`}
              placeholder={i === 0 ? "Cover photo description" : `Photo ${i + 1} description`}
              value={photo.alt}
              onChange={(e) => update(i, { alt: e.target.value })}
              aria-invalid={!!(fieldError(`photos.${i}.alt`) ?? fieldError(`photos.${i}.url`))}
            />
            <p className="truncate text-xs text-muted-foreground">{photo.url}</p>
            {(fieldError(`photos.${i}.alt`) ?? fieldError(`photos.${i}.url`)) && (
              <p className="text-xs text-destructive">{fieldError(`photos.${i}.alt`) ?? fieldError(`photos.${i}.url`)}</p>
            )}
          </div>
          <div className="flex gap-1">
            {i > 0 && (
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Make cover photo" onClick={() => move(i)}>
                <ArrowUp />
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove photo" onClick={() => setPhotos((list) => list.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Input className="min-w-0 flex-1" placeholder="https://… image URL" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Photo URL" />
        <Button
          type="button"
          variant="outline"
          disabled={!url.trim()}
          onClick={() => {
            add(url.trim());
            setUrl("");
          }}
        >
          Add URL
        </Button>
        <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <ImagePlus /> {uploading ? "Uploading…" : "Upload photo"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>
      {(uploadError ?? error) && <p className="text-sm text-destructive">{uploadError ?? error}</p>}
    </div>
  );
}
