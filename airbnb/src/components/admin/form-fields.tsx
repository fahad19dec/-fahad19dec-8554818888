import { Children, type ReactNode } from "react";
import { TextInput, useWindowDimensions, View, type TextInputProps } from "react-native";

import { Text, TextField, type TextFieldProps } from "@/components/ui";
import { cn } from "@/lib/cn";

// Building blocks of the admin listing form. Every field can show the
// server's message for it under the input.

export function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View className="gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="gap-1">
        <Text variant="cardTitle" accessibilityRole="header">
          {title}
        </Text>
        {hint && (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
      {message}
    </Text>
  );
}

/** A labelled single-line field with its error under it. */
export function Field({ error, className, ...props }: TextFieldProps & { label: string; error?: string }) {
  return (
    <View className={cn("gap-1.5", className)}>
      <TextField invalid={!!error} {...props} />
      <FieldError message={error} />
    </View>
  );
}

/** Side by side on wide screens, stacked on phones. */
export function Row({ children }: { children: ReactNode }) {
  const wide = useWindowDimensions().width >= 640;
  if (!wide) return <View className="gap-4">{children}</View>;
  return (
    <View className="flex-row gap-4">
      {Children.toArray(children).map((child, i) => (
        <View key={i} className="flex-1">
          {child}
        </View>
      ))}
    </View>
  );
}

/** A labelled multi-line field. Lists ("one per line") use it too. */
export function TextArea({
  label,
  hint,
  error,
  className,
  ...props
}: Omit<TextInputProps, "style"> & { label: string; hint?: string; error?: string; className?: string }) {
  return (
    <View className={cn("gap-1.5", className)}>
      <Text variant="label">{label}</Text>
      {hint && (
        <Text variant="footnote" tone="muted">
          {hint}
        </Text>
      )}
      <TextInput
        accessibilityLabel={label}
        multiline
        textAlignVertical="top"
        className={cn(
          "min-h-28 rounded-lg corner-squircle border-2 px-4 py-3 font-jakarta text-body text-ink placeholder:text-ink-subtle",
          error ? "border-danger bg-danger-soft" : "border-border/50 bg-surface-muted",
        )}
        {...props}
      />
      <FieldError message={error} />
    </View>
  );
}

/** A label and its control on one line, e.g. a stepper or a switch. */
export function InlineField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-1">
        <Text variant="subtitle">{label}</Text>
        {hint && (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}
