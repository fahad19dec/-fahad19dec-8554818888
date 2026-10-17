import { filtersFromParams, type StayFilters } from "@/lib/search/filters";
import { errorResponse } from "@/lib/server/http";
import { searchStays } from "@/lib/server/stay-search";
import { homeView, searchView } from "@/lib/server/stay-views";
import { readDb } from "@/lib/server/store";

const MAX_RESULTS = 100;

// GET /api/stays?<filters>: { total, stays }. `view=home` returns Home's card
// shape; `limit=0` returns only the count (the filter panel's "Show N stays").
// Never logs what guests type.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters: StayFilters = filtersFromParams((name) => url.searchParams.get(name));
    const limit = Math.min(Number(url.searchParams.get("limit") ?? MAX_RESULTS) || 0, MAX_RESULTS);
    const view = url.searchParams.get("view") === "home" ? homeView : searchView;

    const matched = searchStays(await readDb(), filters);
    return Response.json({ total: matched.length, stays: matched.slice(0, limit).map((s) => view(s, url.origin)) });
  } catch (error) {
    return errorResponse(error);
  }
}
