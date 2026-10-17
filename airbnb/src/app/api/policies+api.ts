import { errorResponse } from "@/lib/server/http";
import { readDb } from "@/lib/server/store";

// GET /api/policies: every Roam policy, for the policies sheet and Profile.
export async function GET() {
  try {
    const { policies } = await readDb();
    return Response.json(policies.map(({ slug, kind, title, summary, body }) => ({ slug, kind, title, summary, body })));
  } catch (error) {
    return errorResponse(error);
  }
}
