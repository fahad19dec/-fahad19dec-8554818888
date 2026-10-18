import { loadCatalog } from "@/lib/db";
import { errorResponse } from "@/lib/server/http";
import { buildMeta } from "@/lib/server/meta";

// GET /api/meta: what the filter panel offers (src/lib/server/meta.ts).
export async function GET() {
  try {
    return Response.json(buildMeta(loadCatalog()));
  } catch (error) {
    return errorResponse(error);
  }
}
