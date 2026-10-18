import { useState } from "react";

import { AuthScreen } from "@/components/auth/auth-screen";
import { FormError } from "@/components/auth/form-error";
import { Button, Text, TextField } from "@/components/ui";
import { ApiError, isDemo } from "@/lib/api";
import { authMode, useSession } from "@/lib/session";

// Sign-in when Clerk isn't set up: development (EXPO_PUBLIC_AUTH_MODE=dev)
// and the browser demo. Any email signs in, with no password, so the server
// refuses it in production. With neither Clerk nor dev mode, it says so.
export function DevSignIn() {
  const { signInWithEmail } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!signInWithEmail) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    setBusy(true);
    setError(undefined);
    try {
      await signInWithEmail(email);
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "auth_not_configured"
          ? "The server isn’t set up for dev sign-in. Set AUTH_MODE=dev in .env.local."
          : e instanceof ApiError && e.status === 0
            ? "Can’t reach the server. Check your connection."
            : "Couldn’t sign in. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (authMode === "none") {
    return (
      <AuthScreen title={"Sign-in\nisn’t set up"} body="Add your Clerk keys to .env.local, or set EXPO_PUBLIC_AUTH_MODE=dev to try it locally." footer={null}>
        <Text variant="body" tone="muted">
          See .env.example for the keys.
        </Text>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={"Sign in\nto book"}
      body={
        isDemo
          ? "This demo signs you in with just an email. Bookings and reports are saved in this browser only."
          : "Development sign-in: any email works, with no password. Production uses Clerk."
      }
      footer={
        <Text variant="caption" tone="muted" className="text-center">
          Listings, users and bookings are managed in the admin dashboard.
        </Text>
      }
    >
      <TextField
        icon="mail"
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError(undefined);
        }}
        invalid={!!error}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <FormError message={error} />
      <Button title="Continue" trailingIcon="arrowRight" loading={busy} onPress={submit} className="mt-6" />
    </AuthScreen>
  );
}
