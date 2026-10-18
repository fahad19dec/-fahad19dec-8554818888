import type { HouseRules, ResponseTime, StayDetails, StayHost } from "@/lib/stays";

// "15:00" → "3:00 PM". Times are stored as 24-hour HH:MM in the stay's local time.
export function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export type HouseRuleKey = "checkIn" | "checkOut" | "quietHours" | "pets" | "smoking" | "parties" | "additional";

// The stay's own rules, one line each, built only from its typed fields.
// `additionalRules` are the host's words and show as written. Keyed so Ask can
// answer with just the lines a topic needs.
export function houseRuleParts(rules: HouseRules): { key: HouseRuleKey; text: string }[] {
  const parts: { key: HouseRuleKey; text: string }[] = [
    { key: "checkIn", text: `Check-in after ${formatTime(rules.checkInTime)}` },
    { key: "checkOut", text: `Checkout before ${formatTime(rules.checkOutTime)}` },
  ];
  if (rules.quietHoursFrom && rules.quietHoursTo) {
    parts.push({ key: "quietHours", text: `Quiet hours ${formatTime(rules.quietHoursFrom)} to ${formatTime(rules.quietHoursTo)}` });
  }
  if (rules.petsAllowed) {
    const pets = ["Pets allowed"];
    if (rules.maxPets) pets.push(`up to ${rules.maxPets}`);
    if (rules.petFee) pets.push(`$${rules.petFee} pet fee per stay`);
    parts.push({ key: "pets", text: pets.join(", ") });
  } else {
    parts.push({ key: "pets", text: "No pets" });
  }
  parts.push({ key: "smoking", text: rules.smokingAllowed ? "Smoking allowed" : "No smoking" });
  parts.push({ key: "parties", text: rules.partiesAllowed ? "Parties allowed" : "No parties or events" });
  for (const rule of rules.additionalRules ?? []) if (rule) parts.push({ key: "additional", text: rule });
  return parts;
}

export const houseRuleLines = (rules: HouseRules) => houseRuleParts(rules).map((part) => part.text);

// Until guests pick dates, the total is the shortest stay allowed plus cleaning.
export function stayTotal(stay: Pick<StayDetails, "pricePerNight" | "minNights" | "cleaningFee">) {
  const nights = Math.max(1, stay.minNights ?? 1);
  return { nights, total: stay.pricePerNight * nights + (stay.cleaningFee ?? 0) };
}

export const formatPrice = (amount: number) => `$${amount.toLocaleString("en-US")}`;

// The Book screen's price breakdown, adding up to `stayTotal`.
export function priceLines(stay: Pick<StayDetails, "pricePerNight" | "minNights" | "cleaningFee">) {
  const { nights, total } = stayTotal(stay);
  const lines = [
    { key: "nights", label: `${formatPrice(stay.pricePerNight)} × ${nights === 1 ? "1 night" : `${nights} nights`}`, amount: stay.pricePerNight * nights },
  ];
  if (stay.cleaningFee) lines.push({ key: "cleaning", label: "Cleaning fee", amount: stay.cleaningFee });
  return { lines, total };
}

const responseLabels: Record<ResponseTime, string> = {
  withinHour: "within an hour",
  withinFewHours: "within a few hours",
  withinDay: "within a day",
};

// "English", "English and Spanish", "English, Spanish and Greek".
const joinList = (items: string[]) =>
  items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export type HostFactKey = "since" | "response" | "languages";

// The host's facts on a stay, keyed so each gets its glyph. Missing fields are left out.
export function hostFacts(host: StayHost): { key: HostFactKey; text: string }[] {
  const facts: { key: HostFactKey; text: string }[] = [];
  if (host.hostingSince) {
    const since = new Date(`${host.hostingSince}T00:00:00`);
    if (!Number.isNaN(since.getTime())) {
      facts.push({ key: "since", text: `Hosting since ${since.toLocaleDateString("en-US", { month: "long", year: "numeric" })}` });
    }
  }
  if (host.responseTime) facts.push({ key: "response", text: `Responds ${responseLabels[host.responseTime]}` });
  if (host.languages?.length) facts.push({ key: "languages", text: `Speaks ${joinList(host.languages)}` });
  return facts;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
