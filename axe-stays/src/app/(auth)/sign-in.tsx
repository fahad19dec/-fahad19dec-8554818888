import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { View, type TextInput } from "react-native";

import { brand } from "@/brand";
import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthScreen } from "@/components/auth/auth-screen";
import { FormError } from "@/components/auth/form-error";
import { Button, TextField } from "@/components/ui";
import { authErrorMessage } from "@/lib/auth/errors";
import { finalizeOptions } from "@/lib/auth/session";
import { firstError, validateSignIn, type FieldErrors } from "@/lib/auth/validate";
import { authMode } from "@/lib/session";
import { DevSignIn } from "@/components/auth/dev-sign-in";

type Field = "email" | "password";

function ClerkSignIn() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const passwordRef = useRef<TextInput>(null);

  const [values, setValues] = useState<Record<Field, string>>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [authError, setAuthError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting;

  const edit = (field: Field) => (text: string) => {
    setValues((v) => ({ ...v, [field]: text }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setAuthError(undefined);
  };

  const submit = async () => {
    const found = validateSignIn(values);
    setErrors(found);
    setAuthError(undefined);
    if (firstError(found)) return;

    setSubmitting(true);
    try {
      const email = values.email.trim();
      const { error } = await signIn.password({ emailAddress: email, password: values.password });
      if (error) return setAuthError(authErrorMessage(error));

      if (signIn.status === "complete") {
        const { error: unfinished } = await signIn.finalize(finalizeOptions);
        if (unfinished) return setAuthError(authErrorMessage(unfinished));
        return;
      }

      // Clerk asks for an email code when a password sign-in comes from a new device.
      const canTrust = signIn.supportedSecondFactors.some((f) => f.strategy === "email_code");
      if (signIn.status === "needs_client_trust" && canTrust) {
        const { error: unsent } = await signIn.mfa.sendEmailCode();
        if (unsent) return setAuthError(authErrorMessage(unsent));
        router.push({ pathname: "/verify", params: { email, flow: "sign-in" } });
        return;
      }

      setAuthError(authErrorMessage(undefined));
    } catch (e) {
      setAuthError(authErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title={"Welcome\nback"}
      body="Sign in to book stays and see your trips."
      footer={
        <AuthFooter
          prompt={`New to ${brand.name}?`}
          action="Create an account"
          disabled={busy}
          onPress={() => router.replace("/sign-up")}
        />
      }
    >
      <TextField
        icon="mail"
        label="Email address"
        placeholder="you@example.com"
        value={values.email}
        onChangeText={edit("email")}
        invalid={!!errors.email}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        icon="lock"
        label="Password"
        placeholder="Your password"
        secure
        value={values.password}
        onChangeText={edit("password")}
        invalid={!!errors.password}
        editable={!busy}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        className="mt-3.5"
      />
      <FormError message={authError ?? firstError(errors)} />
      <Button title="Sign in" trailingIcon="arrowRight" loading={submitting} onPress={submit} className="mt-6" />
      {/* Mount point for Clerk's bot protection; takes no space. */}
      <View nativeID="clerk-captcha" />
    </AuthScreen>
  );
}

// Clerk's email flow when it's set up; otherwise the dev sign-in (src/lib/session.tsx).
export default function SignIn() {
  return authMode === "clerk" ? <ClerkSignIn /> : <DevSignIn />;
}
