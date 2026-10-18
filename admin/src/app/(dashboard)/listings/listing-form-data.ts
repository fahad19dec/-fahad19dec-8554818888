// The listing form's fields → the object the shared validator checks
// (axe-stays/src/lib/server/stay-input.ts). Empty number fields are "not
// set"; anything else becomes a number, and the validator reports bad ones.

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const num = (form: FormData, name: string) => {
  const value = text(form, name);
  return value === "" ? undefined : Number(value.replace(",", "."));
};
const lines = (form: FormData, name: string) => text(form, name).split("\n").map((l) => l.trim()).filter(Boolean);
const on = (form: FormData, name: string) => form.get(name) === "on";

export function formToStayInput(form: FormData) {
  let photos: unknown = [];
  try {
    photos = JSON.parse(text(form, "photos") || "[]");
  } catch {}
  const newHostName = text(form, "newHostName");
  return {
    title: text(form, "title"),
    type: text(form, "type"),
    ...(newHostName ? { newHostName } : { hostSlug: text(form, "hostSlug") || undefined }),
    rating: num(form, "rating") ?? 0,
    reviewCount: num(form, "reviewCount") ?? 0,
    city: text(form, "city"),
    region: text(form, "region") || undefined,
    country: text(form, "country"),
    neighborhood: text(form, "neighborhood") || undefined,
    maxGuests: num(form, "maxGuests"),
    bedrooms: num(form, "bedrooms"),
    beds: num(form, "beds"),
    bathrooms: num(form, "bathrooms"),
    amenities: form.getAll("amenities").map(String),
    pricePerNight: num(form, "pricePerNight"),
    cleaningFee: num(form, "cleaningFee"),
    minNights: num(form, "minNights") ?? 1,
    weeklyDiscountPercent: num(form, "weeklyDiscountPercent"),
    houseRules: {
      checkInTime: text(form, "checkInTime"),
      checkOutTime: text(form, "checkOutTime"),
      quietHoursFrom: text(form, "quietHoursFrom") || undefined,
      quietHoursTo: text(form, "quietHoursTo") || undefined,
      petsAllowed: on(form, "petsAllowed"),
      maxPets: on(form, "petsAllowed") ? num(form, "maxPets") : undefined,
      petFee: on(form, "petsAllowed") ? num(form, "petFee") : undefined,
      smokingAllowed: on(form, "smokingAllowed"),
      partiesAllowed: on(form, "partiesAllowed"),
      additionalRules: lines(form, "additionalRules"),
    },
    cancellationPolicySlug: text(form, "cancellationPolicySlug"),
    summary: text(form, "summary") || undefined,
    description: text(form, "description") || undefined,
    highlights: lines(form, "highlights"),
    facts: lines(form, "facts"),
    vibes: form.getAll("vibes").map(String),
    photos,
  };
}
