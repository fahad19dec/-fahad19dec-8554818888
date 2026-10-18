import { Alert } from "@/components/ui";

/** The error above a form's primary button, or the spacing it would take. */
export function FormError({ message }: { message?: string }) {
  return message ? <Alert tone="danger" message={message} className="mt-6" /> : null;
}
