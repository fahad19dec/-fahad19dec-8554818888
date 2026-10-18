import { useSignIn, useSignUp } from "@clerk/expo";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthScreen } from "@/components/auth/auth-screen";
import { CodeInput } from "@/components/auth/code-input";
import { FormError } from "@/components/auth/form-error";
import { Alert, Button } from "@/components/ui";
import { authErrorMessage } from "@/lib/auth/errors";
import { finalizeOptions } from "@/lib/auth/session";
import { validateCode } from "@/lib/auth/validate";
import { authMode } from "@/lib/session";

const RESEND_SECONDS = 30;

/** Confirms a sign-up's email, or a new device on sign-in, with a 6-digit email code. */
function ClerkVerify() {
  const { email, flow = "sign-up" } = useLocalSearchParams<{ email?: string; flow?: "sign-up" | "sign-in" }>();
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();

  // Read once: after a successful verify the attempt is complete, and the
  // screen must not redirect while the session is being activated.
  const [pending] = useState(() =>
    flow === "sign-in"
      ? signIn.status === "needs_client_trust"
      : signUp.status === "missing_requirements" && signUp.unverifiedFields.includes("email_address"),
  );

  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  if (!email || !pending) return <Redirect href={flow === "sign-in" ? "/sign-in" : "/sign-up"} />;

  const submit = async (value = code) => {
    const found = validateCode(value).code;
    setError(found);
    setResent(false);
    if (found) return;

    setSubmitting(true);
    try {
      if (flow === "sign-in") {
        const { error: failed } = await signIn.mfa.verifyEmailCode({ code: value });
        if (failed) return setError(authErrorMessage(failed));
        if (signIn.status !== "complete") return setError(authErrorMessage(undefined));
        const { error: unfinished } = await signIn.finalize(finalizeOptions);
        if (unfinished) return setError(authErrorMessage(unfinished));
      } else {
        const { error: failed } = await signUp.verifications.verifyEmailCode({ code: value });
        if (failed) return setError(authErrorMessage(failed));
        if (signUp.status !== "complete") return setError(authErrorMessage(undefined));
        const { error: unfinished } = await signUp.finalize(finalizeOptions);
        if (unfinished) return setError(authErrorMessage(unfinished));
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onChange = (next: string) => {
    setCode(next);
    setError(undefined);
    if (next.length === 6) submit(next);
  };

  const resend = async () => {
    setResending(true);
    setError(undefined);
    try {
      const { error: failed } =
        flow === "sign-in" ? await signIn.mfa.sendEmailCode() : await signUp.verifications.sendEmailCode();
      if (failed) return setError(authErrorMessage(failed));
      setResent(true);
      setWait(RESEND_SECONDS);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthScreen
      title={"Check your\nemail"}
      body={`We sent a 6-digit code to ${email}. Enter it below to ${
        flow === "sign-in" ? "confirm it's you." : "finish creating your account."
      }`}
      footer={
        <AuthFooter
          prompt="Didn't get a code?"
          action={wait > 0 ? `Resend in 0:${String(wait).padStart(2, "0")}` : "Resend"}
          disabled={wait > 0 || resending || submitting}
          onPress={resend}
        />
      }
    >
      <CodeInput value={code} onChange={onChange} invalid={!!error} editable={!submitting} />
      {resent && !error && <Alert tone="success" message={`We sent a new code to ${email}.`} className="mt-6" />}
      <FormError message={error} />
      <Button title="Verify" trailingIcon="arrowRight" loading={submitting} onPress={() => submit()} className="mt-6" />
    </AuthScreen>
  );
}

// Clerk's email flow when it's set up; otherwise the dev sign-in (src/lib/session.tsx).
export default function Verify() {
  return authMode === "clerk" ? <ClerkVerify /> : <Redirect href="/sign-in" />;
}
