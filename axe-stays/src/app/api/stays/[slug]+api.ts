import { bookedRanges, loadCatalog } from "@/lib/db";
import { HttpError, errorResponse } from "@/lib/server/http";
import { detailsView } from "@/lib/server/stay-views";

// GET /api/stays/:slug: one approved stay with its host, cancellation policy,
// the platform's other policies, and the dates already booked (for the
// booking calendar).
export async function GET(request: Request, { slug }: Record<string, string>) {
  try {
    const catalog = loadCatalog();
    const stay = catalog.stays.find((s) => s.slug === slug);
    if (!stay) throw new HttpError(404, "not_found");
    return Response.json({ ...detailsView(stay, catalog, new URL(request.url).origin), booked: bookedRanges(stay.id) });
  } catch (error) {
    return errorResponse(error);
  }
}
