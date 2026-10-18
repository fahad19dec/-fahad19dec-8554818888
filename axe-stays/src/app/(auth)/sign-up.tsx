import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { View, type TextInput } from "react-native";

import { brand } from "@/brand";
import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthScreen } from "@/components/auth/auth-screen";
import { FormError } from "@/components/auth/form-error";
import { Button, TextField } from "@/components/ui";
import { authErrorMessage } from "@/lib/auth/errors";
import { firstError, validateSignUp, type FieldErrors } from "@/lib/auth/validate";
import { authMode } from "@/lib/session";
import { DevSignIn } from "@/components/auth/dev-sign-in";

type Field = "name" | "email" | "password";

function ClerkSignUp() {
  const router = useRouter();
  const { signUp } = useSignUp();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", password: "" });
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
    const found = validateSignUp(values);
    setErrors(found);
    setAuthError(undefined);
    if (firstError(found)) return;

    setSubmitting(true);
    try {
      const email = values.email.trim();
      const [firstName, ...rest] = values.name.trim().split(/\s+/);
      const created = await signUp.password({
        emailAddress: email,
        password: values.password,
        firstName,
        lastName: rest.length ? rest.join(" ") : undefined,
      });
      if (created.error) return setAuthError(authErrorMessage(created.error));

      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) return setAuthError(authErrorMessage(sent.error));

      router.push({ pathname: "/verify", params: { email, flow: "sign-up" } });
    } catch (e) {
      setAuthError(authErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title={"Create\nyour account"}
      body={`Join ${brand.name} to book stays, see your trips and report a problem with a listing.`}
      footer={
        <AuthFooter
          prompt="Already have an account?"
          action="Sign in"
          disabled={busy}
          onPress={() => router.replace("/sign-in")}
        />
      }
    >
      <TextField
        icon="person"
        label="Full name"
        placeholder="e.g. Adrian Hajdin"
        value={values.name}
        onChangeText={edit("name")}
        invalid={!!errors.name}
        editable={!busy}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
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
        className="mt-3.5"
      />
      <TextField
        ref={passwordRef}
        icon="lock"
        label="Password"
        placeholder="At least 8 characters"
        secure
        value={values.password}
        onChangeText={edit("password")}
        invalid={!!errors.password}
        editable={!busy}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
        className="mt-3.5"
      />
      <FormError message={authError ?? firstError(errors)} />
      <Button title="Create account" trailingIcon="arrowRight" loading={submitting} onPress={submit} className="mt-6" />
      {/* Mount point for Clerk's bot protection; takes no space. */}
      <View nativeID="clerk-captcha" />
    </AuthScreen>
  );
}

// Clerk's email flow when it's set up; otherwise the dev sign-in (src/lib/session.tsx).
export default function SignUp() {
  return authMode === "clerk" ? <ClerkSignUp /> : <DevSignIn />;
}
