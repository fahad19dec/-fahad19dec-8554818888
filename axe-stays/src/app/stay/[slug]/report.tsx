import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

import { brand } from "@/brand";
import { Alert, Button, Chip, Text } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { MAX_REPORT_DETAILS, REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";
import { useAuthedApi, useSession } from "@/lib/session";

// A form sheet over the stay: why the guest is reporting it, and details.
// Reports go to the admin dashboard's queue.
export default function ReportListing() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { isSignedIn, account } = useSession();
  const request = useAuthedApi();
  const [reason, setReason] = useState<ReportReason>();
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!reason) return setError("Pick a reason.");
    if (reason === "other" && !details.trim()) return setError("Tell us what’s wrong.");
    setSending(true);
    setError(null);
    try {
      await request("/api/reports", { method: "POST", json: { slug, reason, details: details.trim() || undefined } });
      setSent(true);
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "already_reported"
          ? "You’ve already reported this listing. We’re looking into it."
          : e instanceof ApiError && e.code === "account_suspended"
            ? "Your account is suspended."
            : "Couldn’t send your report. Try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-5 px-5 pt-6 pb-10" keyboardShouldPersistTaps="handled">
      <StatusBar style="dark" />
      <Text variant="heading" accessibilityRole="header">
        Report this listing
      </Text>
      {!isSignedIn ? (
        <>
          <Text variant="body" tone="muted">
            Sign in so {brand.supportName} can follow up with you.
          </Text>
          <Button title="Sign in" onPress={() => router.push("/sign-in")} />
        </>
      ) : sent ? (
        <>
          <Alert tone="success" message="Thanks. Our team will review this listing." />
          <Button title="Done" variant="secondary" onPress={() => router.back()} />
        </>
      ) : (
        <>
          <Text variant="body" tone="muted">
            Reports are private. The host isn’t told who reported them.
          </Text>
          {account?.status === "banned" && <Alert tone="danger" message="Your account is suspended." />}
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(REPORT_REASONS) as ReportReason[]).map((key) => (
              <Chip key={key} label={REPORT_REASONS[key]} size="sm" selected={reason === key} onPress={() => setReason(key)} />
            ))}
          </View>
          <View className="gap-1.5">
            <Text variant="label">Details{reason === "other" ? "" : " (optional)"}</Text>
            <TextInput
              accessibilityLabel="Details"
              value={details}
              onChangeText={setDetails}
              maxLength={MAX_REPORT_DETAILS}
              multiline
              textAlignVertical="top"
              placeholder="What did you notice?"
              className="min-h-28 rounded-lg corner-squircle border-2 border-border/50 bg-surface-muted px-4 py-3 font-jakarta text-body text-ink placeholder:text-ink-subtle"
            />
          </View>
          {error && <Alert tone="danger" message={error} onDismiss={() => setError(null)} />}
          <Button title="Send report" loading={sending} disabled={account?.status === "banned"} onPress={send} />
        </>
      )}
    </ScrollView>
  );
}
