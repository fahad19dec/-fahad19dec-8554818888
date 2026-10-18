import { isClerkAPIResponseError } from "@clerk/expo";

// Guest-facing copy for the Clerk error codes our flows can hit. Sign-in
// doesn't say whether an account exists, so both of its failures read the same.
const messages: Record<string, string> = {
  form_identifier_exists: "That email is already in use.",
  form_identifier_not_found: "Email or password is incorrect.",
  form_password_incorrect: "Email or password is incorrect.",
  form_code_incorrect: "That code isn't right. Check your email and try again.",
  verification_expired: "That code has expired. Tap Resend to get a new one.",
  form_password_pwned: "This password has appeared in a data breach. Choose a different one.",
  form_password_length_too_short: "Use at least 8 characters for your password.",
  too_many_requests: "Too many attempts. Wait a moment and try again.",
};

const fallback = "Something went wrong. Please try again.";

/** The message to show a guest for any thrown or returned auth error. */
export function authErrorMessage(error: unknown) {
  if (!isClerkAPIResponseError(error)) return fallback;
  const first = error.errors[0];
  if (!first) return fallback;
  return messages[first.code] ?? first.longMessage ?? first.message ?? fallback;
}
