import { AccessError } from "./access";
import { logAction } from "./audit";
import { all, get, newId, now, run, transaction } from "./database";
import { assertAdmin, type User } from "./users";
import { guestRefund, quote, quoteProblems, todayIso, type Quote, type QuoteInput, type Refund } from "../booking/pricing";
import type { CancellationTier, StayRecord } from "../stays";

// Bookings. Payment is simulated: a confirmed booking stores the full price
// breakdown and a `sim_` payment reference, and cancelling stores the refund.
// Two bookings for the same stay can never overlap (checked inside the write
// transaction, so two apps booking at once can't both win).

export type BookingStatus = "confirmed" | "cancelled";

export type Booking = Quote & {
  id: string;
  stayId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets: number;
  status: BookingStatus;
  refundCents: number;
  refundServiceCents: number;
  cancelledBy: string | null;
  cancelReason: string | null;
  paymentRef: string;
  createdAt: string;
  cancelledAt: string | null;
};

/** A booking with what lists show about its stay and guest. */
export type BookingSummary = Booking & {
  stay: { slug: string; title: string; city: string; region: string | null; country: string; photoUrl: string | null; cancellationPolicySlug: CancellationTier; checkInTime: string };
  guest: { name: string | null; email: string | null };
};

type Row = {
  id: string;
  stay_id: string;
  user_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  pets: number;
  nights: number;
  nightly_total_cents: number;
  discount_cents: number;
  cleaning_cents: number;
  pet_fee_cents: number;
  service_fee_cents: number;
  total_cents: number;
  status: BookingStatus;
  refund_cents: number;
  refund_service_cents: number;
  cancelled_by: string | null;
  cancel_reason: string | null;
  payment_ref: string;
  created_at: string;
  cancelled_at: string | null;
};

const toBooking = (r: Row): Booking => ({
  id: r.id,
  stayId: r.stay_id,
  userId: r.user_id,
  checkIn: r.check_in,
  checkOut: r.check_out,
  guests: r.guests,
  pets: r.pets,
  nights: r.nights,
  nightlyTotalCents: r.nightly_total_cents,
  discountCents: r.discount_cents,
  cleaningCents: r.cleaning_cents,
  petFeeCents: r.pet_fee_cents,
  serviceFeeCents: r.service_fee_cents,
  totalCents: r.total_cents,
  status: r.status,
  refundCents: r.refund_cents,
  refundServiceCents: r.refund_service_cents,
  cancelledBy: r.cancelled_by,
  cancelReason: r.cancel_reason,
  paymentRef: r.payment_ref,
  createdAt: r.created_at,
  cancelledAt: r.cancelled_at,
});

const SUMMARY_SQL = `
  SELECT b.*, s.slug AS s_slug, s.data AS s_data, u.name AS u_name, u.email AS u_email
  FROM bookings b JOIN stays s ON s.id = b.stay_id JOIN users u ON u.id = b.user_id`;

type SummaryRow = Row & { s_slug: string; s_data: string; u_name: string | null; u_email: string | null };

const toSummary = (r: SummaryRow): BookingSummary => {
  const stay = JSON.parse(r.s_data) as StayRecord;
  return {
    ...toBooking(r),
    stay: {
      slug: r.s_slug,
      title: stay.title,
      city: stay.city,
      region: stay.region ?? null,
      country: stay.country,
      photoUrl: stay.photos[0]?.url ?? null,
      cancellationPolicySlug: stay.cancellationPolicySlug,
      checkInTime: stay.houseRules.checkInTime,
    },
    guest: { name: r.u_name, email: r.u_email },
  };
};

/** Confirmed nights already taken at a stay from today on: [checkIn, checkOut) ranges. */
export function bookedRanges(stayId: string): { checkIn: string; checkOut: string }[] {
  return all<{ check_in: string; check_out: string }>(
    `SELECT check_in, check_out FROM bookings
     WHERE stay_id = $stay AND status = 'confirmed' AND check_out > $today ORDER BY check_in`,
    { stay: stayId, today: todayIso() },
  ).map((r) => ({ checkIn: r.check_in, checkOut: r.check_out }));
}

/** Books `stay` for `user` and records the simulated payment. Throws AccessError with fields when it can't. */
export function createBooking(user: User, stay: StayRecord, input: QuoteInput): Booking {
  const problems = quoteProblems(stay, input);
  if (problems) throw new AccessError(400, "invalid_booking", problems);
  const price = quote(stay, input);

  return transaction(() => {
    const clash = get<{ id: string }>(
      `SELECT id FROM bookings WHERE stay_id = $stay AND status = 'confirmed'
       AND check_in < $checkOut AND check_out > $checkIn LIMIT 1`,
      { stay: stay.id, checkIn: input.checkIn, checkOut: input.checkOut },
    );
    if (clash) throw new AccessError(409, "dates_unavailable", { checkIn: "Those dates are already booked" });
    const id = newId("bkg");
    run(
      `INSERT INTO bookings (id, stay_id, user_id, check_in, check_out, guests, pets, nights,
         nightly_total_cents, discount_cents, cleaning_cents, pet_fee_cents, service_fee_cents, total_cents,
         status, payment_ref, created_at)
       VALUES ($id, $stay, $user, $checkIn, $checkOut, $guests, $pets, $nights,
         $nightly, $discount, $cleaning, $petFee, $service, $total, 'confirmed', $payment, $at)`,
      {
        id,
        stay: stay.id,
        user: user.id,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        pets: input.pets,
        nights: price.nights,
        nightly: price.nightlyTotalCents,
        discount: price.discountCents,
        cleaning: price.cleaningCents,
        petFee: price.petFeeCents,
        service: price.serviceFeeCents,
        total: price.totalCents,
        payment: `sim_${id.slice(4)}`,
        at: now(),
      },
    );
    return toBooking(get<Row>("SELECT * FROM bookings WHERE id = $id", { id })!);
  });
}

export function userBookings(userId: string): BookingSummary[] {
  return all<SummaryRow>(`${SUMMARY_SQL} WHERE b.user_id = $user ORDER BY b.check_in DESC`, { user: userId }).map(toSummary);
}

export function bookingSummary(id: string): BookingSummary | undefined {
  const row = get<SummaryRow>(`${SUMMARY_SQL} WHERE b.id = $id`, { id });
  return row && toSummary(row);
}

/** The refund a cancellation would give right now: the stay's policy for guests, or a full refund. */
export function refundFor(booking: BookingSummary, mode: "policy" | "full"): Refund {
  if (mode === "full") return { refundCents: booking.totalCents, serviceRefundCents: booking.serviceFeeCents, rule: "Full refund" };
  return guestRefund(booking, booking.stay.cancellationPolicySlug, booking.stay.checkInTime);
}

/**
 * Cancels a confirmed booking. Guests may cancel only their own, under the
 * stay's policy; admins may cancel any, with a full or policy refund.
 */
export function cancelBooking(id: string, actor: User, options: { mode: "policy" | "full"; reason?: string }): BookingSummary {
  return transaction(() => {
    const booking = bookingSummary(id);
    if (!booking) throw new AccessError(404, "not_found");
    // A caller claiming admin is checked against the database.
    const isAdmin = actor.role === "admin" && assertAdmin(actor).role === "admin";
    if (!isAdmin && booking.userId !== actor.id) throw new AccessError(404, "not_found");
    if (booking.status !== "confirmed") throw new AccessError(409, "already_cancelled");
    if (!isAdmin && booking.checkOut <= todayIso()) throw new AccessError(409, "stay_finished");
    const refund = refundFor(booking, isAdmin ? options.mode : "policy");
    run(
      `UPDATE bookings SET status = 'cancelled', refund_cents = $refund, refund_service_cents = $service,
         cancelled_by = $by, cancel_reason = $reason, cancelled_at = $at WHERE id = $id`,
      {
        id,
        refund: Math.min(refund.refundCents, booking.totalCents),
        service: refund.serviceRefundCents,
        by: isAdmin && booking.userId !== actor.id ? "admin" : "guest",
        reason: options.reason?.trim() || null,
        at: now(),
      },
    );
    if (isAdmin) logAction(actor.id, "booking.cancel", "booking", id, { refundCents: refund.refundCents, rule: refund.rule, reason: options.reason });
    return bookingSummary(id)!;
  });
}

export function listBookingsForAdmin(filter: { status?: BookingStatus; q?: string; upcoming?: boolean } = {}): BookingSummary[] {
  const q = filter.q?.trim().toLowerCase();
  return all<SummaryRow>(
    `${SUMMARY_SQL}
     WHERE ($status IS NULL OR b.status = $status)
       AND ($upcoming = 0 OR b.check_out > $today)
       AND ($q IS NULL OR LOWER(b.id || ' ' || COALESCE(u.email, '') || ' ' || COALESCE(u.name, '') || ' ' || s.slug) LIKE '%' || $q || '%')
     ORDER BY b.created_at DESC LIMIT 500`,
    { status: filter.status ?? null, upcoming: filter.upcoming ? 1 : 0, today: todayIso(), q: q || null },
  ).map(toSummary);
}
