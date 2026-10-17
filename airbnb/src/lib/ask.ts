import type { IconName } from "@/components/ui/icons";
import { houseRuleParts, type HouseRuleKey } from "@/lib/stay-details";
import type { Policy, PolicyBlock, StayDetails } from "@/lib/stays";

// "Ask about this stay": every answer card holds the stay's own text, Roam's
// policy text, or a checked Knowledge Base section, word for word. Nothing is
// generated. Questions go to POST /api/ask, where Jev picks the passages
// (src/lib/server/policy-answers.ts). The keyword matching below is the
// fallback when that route fails; the card builders are shared by both.

/** Longest question the app sends and the route accepts. */
export const MAX_QUESTION = 300;

export type TopicKey = "cancellation" | "checkIn" | "pets" | "houseRules" | "payment" | "damage" | "guestRefund";

type Topic = { key: TopicKey; chip: string; question: string; keywords: string[] };

// Chip order, and the order cards appear in when a question hits several topics.
export const TOPICS: Topic[] = [
  {
    key: "cancellation",
    chip: "Cancellation",
    question: "What’s the cancellation policy?",
    keywords: ["cancel", "refund before"],
  },
  {
    key: "checkIn",
    chip: "Check-in",
    question: "When are check-in and checkout?",
    keywords: ["check in", "check-in", "checkin", "checkout", "check out", "arriv", "leave", "late", "early"],
  },
  { key: "pets", chip: "Pets", question: "Can I bring my pet?", keywords: ["pet", "dog", "cat", "animal"] },
  {
    key: "houseRules",
    chip: "House rules",
    question: "What are the house rules?",
    keywords: ["rule", "smok", "part", "quiet", "noise", "event"],
  },
  {
    key: "payment",
    chip: "Payment",
    question: "How does payment work?",
    keywords: ["pay", "charge", "price", "cost", "fee", "card"],
  },
  {
    key: "damage",
    chip: "Damage",
    question: "What if something gets damaged?",
    keywords: ["damage", "deposit", "broke"],
  },
  {
    key: "guestRefund",
    chip: "Refunds",
    question: "What if the stay isn’t as described?",
    keywords: ["refund", "as described", "issue", "problem"],
  },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = TOPICS.map((t) => ({
  key: t.key,
  // Keywords match at the start of a word: "pet" finds "pets", not "carpet".
  pattern: new RegExp(`\\b(${t.keywords.map(escape).join("|")})`, "i"),
}));

export function matchTopics(text: string): TopicKey[] {
  // Curly apostrophes from the iOS keyboard read the same as straight ones.
  const q = text.replace(/[’‘]/g, "'");
  return patterns.filter((p) => p.pattern.test(q)).map((p) => p.key);
}

export type AnswerCard = {
  key: string;
  title: string;
  /** Plain lines: house rules and policy summaries. */
  lines?: string[];
  /** Knowledge Base sections as written, rendered by PolicyBody. */
  blocks?: PolicyBlock[];
  /** Missing only on the no-answer card. */
  source?: { label: string; icon: IconName };
  /** Opens the Policies sheet, at `section` when set. */
  link?: { label: string; section?: string };
};

const HOUSE_RULES = { label: "This stay’s house rules", icon: "home" } as const;
const ROAM_POLICY = { label: "Roam policy", icon: "policy" } as const;

export const NO_ANSWER: AnswerCard = {
  key: "none",
  title: "No answer in this stay’s details",
  lines: ["Roam’s policies and this stay’s details don’t cover this. Contact Roam support."],
};

/** What the stay cards need, on the server as well as in the app. */
export type AskStay = Pick<StayDetails, "houseRules" | "cancellationPolicy">;

function rulesCard(key: string, title: string, lines: string[]): AnswerCard | null {
  if (!lines.length) return null;
  return { key, title, lines, source: HOUSE_RULES, link: { label: "See all policies" } };
}

function ruleCard(stay: AskStay, key: string, title: string, keys: HouseRuleKey[] | "all"): AnswerCard | null {
  const lines = houseRuleParts(stay.houseRules)
    .filter((part) => keys === "all" || keys.includes(part.key))
    .map((part) => part.text);
  return rulesCard(key, title, lines);
}

/** The house-rule lines Jev picked, in house-rule order, titled by what they cover. */
export function pickedRulesCard(parts: { key: HouseRuleKey; text: string }[]): AnswerCard | null {
  const keys = new Set(parts.map((part) => part.key));
  const title = [...keys].every((k) => k === "checkIn" || k === "checkOut")
    ? "Check-in and checkout"
    : keys.size === 1 && keys.has("pets")
      ? "Pets at this stay"
      : "House rules";
  return rulesCard("rules", title, parts.map((part) => part.text));
}

// A policy answers with its summary; the full body is one tap away in the sheet.
function policyCard(policy: Policy | null | undefined, source: AnswerCard["source"]): AnswerCard | null {
  if (!policy?.summary) return null;
  return {
    key: `policy-${policy.kind}`,
    title: policy.title,
    lines: [policy.summary],
    source,
    link: { label: "Read full policy", section: policy.kind },
  };
}

export const cancellationCard = (stay: AskStay) =>
  policyCard(stay.cancellationPolicy, { label: "Cancellation policy", icon: "policy" });

export function answerFor(stay: StayDetails, topics: TopicKey[]): AnswerCard[] {
  const roam = (kind: string) => policyCard(stay.policies.find((p) => p.kind === kind), ROAM_POLICY);
  const cardsFor: Record<TopicKey, () => (AnswerCard | null)[]> = {
    cancellation: () => [cancellationCard(stay)],
    checkIn: () => [ruleCard(stay, "rules-checkIn", "Check-in and checkout", ["checkIn", "checkOut"]), roam("checkIn")],
    pets: () => [ruleCard(stay, "rules-pets", "Pets at this stay", ["pets"]), roam("pets")],
    houseRules: () => [ruleCard(stay, "rules-all", "House rules", "all")],
    payment: () => [roam("payment")],
    damage: () => [roam("damage")],
    guestRefund: () => [roam("guestRefund")],
  };
  const cards = topics.flatMap((t) => cardsFor[t]()).filter((c): c is AnswerCard => c !== null);
  return cards.length ? cards : [NO_ANSWER];
}
