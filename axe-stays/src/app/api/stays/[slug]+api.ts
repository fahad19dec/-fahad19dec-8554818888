import { HttpError, errorResponse } from "@/lib/server/http";
import { detailsView } from "@/lib/server/stay-views";
import { readDb } from "@/lib/server/store";

// GET /api/stays/:slug: one stay with its host, cancellation policy and the platform's
// other policies, so the Policies sheet needs no second request.
export async function GET(request: Request, { slug }: Record<string, string>) {
  try {
    const db = await readDb();
    const stay = db.stays.find((s) => s.slug === slug);
    if (!stay) throw new HttpError(404, "not_found");
    return Response.json(detailsView(stay, db, new URL(request.url).origin));
  } catch (error) {
    return errorResponse(error);
  }
}
