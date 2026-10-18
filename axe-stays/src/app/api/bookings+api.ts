import { z } from "zod";

import { approvedStayBySlug, createBooking, userBookings } from "@/lib/db";
import { requireUser } from "@/lib/server/auth";
import { HttpError, errorResponse } from "@/lib/server/http";
import { sizedImage } from "@/lib/server/stay-views";

const bookingRequest = z.object({
  slug: z.string().max(120),
  checkIn: z.string().max(10),
  checkOut: z.string().max(10),
  guests: z.number().int(),
  pets: z.number().int().default(0),
});

// GET /api/bookings: the signed-in guest's trips. POST books a stay: the
// server prices it (src/lib/booking/pricing.ts), checks the dates are free
// and records the simulated payment.
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const origin = new URL(request.url).origin;
    const trips = userBookings(user.id).map((b) => ({ ...b, stay: { ...b.stay, photoUrl: sizedImage(b.stay.photoUrl ?? undefined, 600, origin) } }));
    return Response.json({ bookings: trips });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = bookingRequest.safeParse(await request.json().catch(() => null));
    if (!body.success) throw new HttpError(400, "bad_request");
    const stay = approvedStayBySlug(body.data.slug);
    if (!stay) throw new HttpError(404, "not_found");
    const booking = createBooking(user, stay, body.data);
    return Response.json(booking, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
