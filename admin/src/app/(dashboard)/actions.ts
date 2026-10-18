"use server";

import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  AccessError,
  banUser,
  bookingSummary,
  cancelBooking,
  closeReport,
  createStay,
  dataDir,
  deleteStay,
  getUser,
  refundFor,
  setListingStatus,
  setRole,
  unbanUser,
  updateStay,
  type ListingStatus,
  type Role,
} from "@core/db";
import { parseStayInput } from "@core/server/stay-input";
import { requireAdmin } from "@/lib/auth";

import { formToStayInput } from "./listings/listing-form-data";

// Every admin change. Each action checks the admin first (requireAdmin reads
// the session and the database), then calls the data layer, which checks the
// role again before writing and records the change in the audit log. Nothing
// here trusts the browser.

export type ActionResult = { ok: true; message: string } | { ok: false; error: string; fields?: Record<string, string> };

const messages: Record<string, string> = {
  unauthorized: "Your session ended. Sign in again.",
  forbidden: "Only admins can do that.",
  account_suspended: "Your account is suspended.",
  not_found: "That record no longer exists.",
  cannot_ban_self: "You can’t ban yourself.",
  cannot_demote_self: "You can’t remove your own admin role.",
  last_admin: "There must be at least one active admin.",
  stay_has_bookings: "This listing has bookings, so it can’t be deleted. Reject it to hide it instead.",
  already_cancelled: "That booking is already cancelled.",
  report_closed: "That report was already closed.",
  invalid_stay: "Some fields need fixing.",
  invalid_role: "Pick a valid role.",
  invalid_status: "Pick a valid status.",
};

function failure(error: unknown): ActionResult {
  if (error instanceof AccessError) return { ok: false, error: messages[error.code] ?? "That didn’t work.", fields: error.fields };
  console.error("admin action failed", error);
  return { ok: false, error: "Something went wrong. Try again." };
}

// ---- Users ----------------------------------------------------------------------

export async function banUserAction(id: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    banUser(id, reason.trim().slice(0, 500), admin);
    revalidatePath("/users");
    revalidatePath("/reports");
    return { ok: true, message: `${getUser(id)?.email ?? "User"} is banned. The guest app refuses their next request.` };
  } catch (error) {
    return failure(error);
  }
}

export async function unbanUserAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    unbanUser(id, admin);
    revalidatePath("/users");
    return { ok: true, message: `${getUser(id)?.email ?? "User"} can use the app again.` };
  } catch (error) {
    return failure(error);
  }
}

export async function setRoleAction(id: string, role: Role): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    setRole(id, role, admin);
    revalidatePath("/users");
    return { ok: true, message: `Role changed to ${role}.` };
  } catch (error) {
    return failure(error);
  }
}

// ---- Listings -------------------------------------------------------------------

export async function setListingStatusAction(id: string, status: ListingStatus, note?: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    setListingStatus(id, status, note?.trim() || null, admin);
    revalidatePath("/listings");
    revalidatePath("/reports");
    return {
      ok: true,
      message: status === "approved" ? "Approved. Guests can see it now." : status === "rejected" ? "Rejected. It’s hidden from guests." : "Moved back to review.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteListingAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    deleteStay(id, admin);
    revalidatePath("/listings");
    return { ok: true, message: "Listing deleted." };
  } catch (error) {
    return failure(error);
  }
}

export type ListingFormState = { error?: string; fields?: Record<string, string> };

/** Create (id = null) or update a listing from the form. Redirects to the list on success. */
export async function saveListingAction(id: string | null, _prev: ListingFormState, form: FormData): Promise<ListingFormState> {
  let saved: string;
  try {
    const admin = await requireAdmin();
    const input = parseStayInput(formToStayInput(form));
    const publish = form.get("publish") === "on";
    saved = id ? updateStay(id, input, admin).id : createStay(input, admin, publish).id;
    revalidatePath("/listings");
  } catch (error) {
    const result = failure(error);
    return result.ok ? {} : { error: result.error, fields: result.fields };
  }
  redirect(`/listings?saved=${encodeURIComponent(saved)}`);
}

const MAX_UPLOAD = 8 * 1024 * 1024;

// The file's first bytes decide its type, never its name or Content-Type.
function imageType(bytes: Uint8Array) {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return "jpg";
  if (starts(0x89, 0x50, 0x4e, 0x47)) return "png";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "gif";
  if (starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

/**
 * Saves an uploaded photo to the shared DATA_DIR/uploads and returns the URL
 * the guest app serves it from (/api/uploads/…).
 */
export async function uploadPhotoAction(form: FormData): Promise<{ url: string } | { error: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    const result = failure(error);
    return { error: result.ok ? "" : result.error };
  }
  const file = form.get("file");
  if (!(file instanceof File)) return { error: "Choose a photo." };
  if (file.size > MAX_UPLOAD) return { error: "That photo is over 8 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = imageType(bytes);
  if (!ext) return { error: "Use a JPEG, PNG, WebP or GIF photo." };
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(dataDir(), "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return { url: `/api/uploads/${name}` };
}

// ---- Bookings -------------------------------------------------------------------

export async function cancelBookingAction(id: string, mode: "full" | "policy", reason: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const booking = cancelBooking(id, admin, { mode, reason: reason.trim().slice(0, 500) });
    revalidatePath("/bookings");
    revalidatePath("/");
    return { ok: true, message: `Cancelled. ${booking.guest.email ?? "The guest"} gets ${(booking.refundCents / 100).toFixed(2)} USD back.` };
  } catch (error) {
    return failure(error);
  }
}

/** What each refund choice would pay out, for the cancel dialog. */
export async function refundPreviewAction(id: string): Promise<{ full: number; policy: number; rule: string } | { error: string }> {
  try {
    await requireAdmin();
    const booking = bookingSummary(id);
    if (!booking) return { error: "That booking no longer exists." };
    const policy = refundFor(booking, "policy");
    return { full: booking.totalCents, policy: policy.refundCents, rule: policy.rule };
  } catch (error) {
    const result = failure(error);
    return { error: result.ok ? "" : result.error };
  }
}

// ---- Reports --------------------------------------------------------------------

export async function closeReportAction(
  id: string,
  status: "resolved" | "dismissed",
  resolution: string,
  alsoReject?: { stayId: string },
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (alsoReject) setListingStatus(alsoReject.stayId, "rejected", `From report ${id}: ${resolution}`.slice(0, 500), admin);
    closeReport(id, status, resolution.slice(0, 1000), admin);
    revalidatePath("/reports");
    revalidatePath("/listings");
    return { ok: true, message: alsoReject ? "Listing hidden and report resolved." : status === "resolved" ? "Report resolved." : "Report dismissed." };
  } catch (error) {
    return failure(error);
  }
}
