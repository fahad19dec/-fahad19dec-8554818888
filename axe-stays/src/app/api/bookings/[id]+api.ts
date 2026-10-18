import { bookingSummary, cancelBooking, refundFor } from "@/lib/db";
import { requireUser } from "@/lib/server/auth";
import { HttpError, errorResponse } from "@/lib/server/http";
import { sizedImage } from "@/lib/server/stay-views";

// GET /api/bookings/:id: one of the guest's own bookings, with the refund
// they'd get for cancelling now. DELETE cancels it under the stay's policy.
// Other people's bookings answer 404, never 403, so ids can't be probed.
export async function GET(request: Request, { id }: Record<string, string>) {
  try {
    const user = await requireUser(request);
    const booking = bookingSummary(id);
    if (!booking || booking.userId !== user.id) throw new HttpError(404, "not_found");
    const photoUrl = sizedImage(booking.stay.photoUrl ?? undefined, 600, new URL(request.url).origin);
    return Response.json({
      booking: { ...booking, stay: { ...booking.stay, photoUrl } },
      refund: booking.status === "confirmed" ? refundFor(booking, "policy") : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  try {
    const user = await requireUser(request);
    // Guests always cancel under the policy, even if they're admins elsewhere.
    const booking = cancelBooking(id, { ...user, role: "guest" }, { mode: "policy" });
    return Response.json({ booking });
  } catch (error) {
    return errorResponse(error);
  }
}
