"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/app/(dashboard)/actions";

/** Runs a server action and shows its result as a toast. Resolves true on success. */
export function useAdminAction() {
  const [pending, start] = useTransition();
  const run = (action: () => Promise<ActionResult>) =>
    new Promise<boolean>((resolve) =>
      start(async () => {
        const result = await action();
        if (result.ok) toast.success(result.message);
        else toast.error(result.error);
        resolve(result.ok);
      }),
    );
  return { pending, run };
}
