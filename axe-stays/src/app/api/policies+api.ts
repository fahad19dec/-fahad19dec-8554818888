import { loadCatalog } from "@/lib/db";
import { errorResponse } from "@/lib/server/http";
import { policyView } from "@/lib/server/stay-views";

// GET /api/policies: every platform policy, for the policies sheet and Profile.
export async function GET() {
  try {
    return Response.json(loadCatalog().policies.map(policyView));
  } catch (error) {
    return errorResponse(error);
  }
}
