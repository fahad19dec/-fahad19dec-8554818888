// Client-side checks run before calling auth. Each returns field → message,
// in form order, so the first entry is the one to show.

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(email: string) {
  return emailPattern.test(email.trim()) ? undefined : "Enter a valid email address.";
}

function clean<K extends string>(errors: Record<K, string | undefined>): FieldErrors<K> {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as FieldErrors<K>;
}

export function validateSignUp({ name, email, password }: { name: string; email: string; password: string }) {
  return clean({
    name: name.trim() ? undefined : "Enter your full name.",
    email: emailError(email),
    password: password.length >= 8 ? undefined : "Use at least 8 characters for your password.",
  });
}

export function validateSignIn({ email, password }: { email: string; password: string }) {
  return clean({
    email: emailError(email),
    password: password ? undefined : "Enter your password.",
  });
}

export function validateCode(code: string) {
  return clean({ code: /^\d{6}$/.test(code) ? undefined : "Enter the 6-digit code from your email." });
}

/** The message to show for a set of field errors: the first one. */
export function firstError(errors: Record<string, string | undefined>) {
  return Object.values(errors).find(Boolean);
}
