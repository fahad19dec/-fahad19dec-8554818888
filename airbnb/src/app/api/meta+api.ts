import { errorResponse } from "@/lib/server/http";
import { buildMeta } from "@/lib/server/meta";
import { readDb } from "@/lib/server/store";

// GET /api/meta: what the filter panel offers (src/lib/server/meta.ts).
export async function GET() {
  try {
    return Response.json(buildMeta(await readDb()));
  } catch (error) {
    return errorResponse(error);
  }
}
