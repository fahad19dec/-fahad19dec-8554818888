import { useState } from "react";
import { View } from "react-native";

import { Alert, Button, Icon, Text, TextField } from "@/components/ui";
import { adminErrorMessage, signIn } from "@/lib/admin";

// The admin's password, checked by POST /api/admin/login.
export function SignInForm() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(password);
    } catch (e) {
      setError(adminErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="w-full max-w-md gap-5 self-center px-5 pt-10">
      <View className="size-14 items-center justify-center rounded-lg corner-squircle bg-lavender-soft">
        <Icon name="lock" size={28} />
      </View>
      <View className="gap-2">
        <Text variant="heading" accessibilityRole="header">
          Host admin
        </Text>
        <Text variant="body" tone="muted">
          Sign in to add, edit and remove listings.
        </Text>
      </View>
      {error && <Alert tone="danger" message={error} onDismiss={() => setError(null)} />}
      <TextField
        label="Admin password"
        value={password}
        onChangeText={setPassword}
        secure
        autoFocus
        autoCapitalize="none"
        autoComplete="current-password"
        onSubmitEditing={submit}
        returnKeyType="go"
        invalid={!!error}
      />
      <Button title="Sign in" onPress={submit} loading={busy} disabled={!password} />
    </View>
  );
}
