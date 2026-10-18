import { errorResponse } from "@/lib/server/http";
import { policyView } from "@/lib/server/stay-views";
import { readDb } from "@/lib/server/store";

// GET /api/policies: every platform policy, for the policies sheet and Profile.
export async function GET() {
  try {
    const { policies } = await readDb();
    return Response.json(policies.map(policyView));
  } catch (error) {
    return errorResponse(error);
  }
}
