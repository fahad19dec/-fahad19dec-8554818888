// Why a guest reports a listing. Shared by the app's report form, the API
// and the admin dashboard, so it has no other imports.
export const REPORT_REASONS = {
  inaccurate: "Listing isn’t accurate",
  scam: "Looks like a scam",
  unsafe: "Safety concern",
  offensive: "Offensive content",
  other: "Something else",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;
export const MAX_REPORT_DETAILS = 1000;
