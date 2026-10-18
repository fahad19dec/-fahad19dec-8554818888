import { z } from "zod";

import { approvedStayBySlug, createReport } from "@/lib/db";
import { requireUser } from "@/lib/server/auth";
import { HttpError, errorResponse } from "@/lib/server/http";

const reportRequest = z.object({ slug: z.string().max(120), reason: z.string().max(40), details: z.string().max(2000).optional() });

// POST /api/reports: a signed-in guest reports a listing. It lands in the
// admin dashboard's report queue.
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = reportRequest.safeParse(await request.json().catch(() => null));
    if (!body.success) throw new HttpError(400, "bad_request");
    const stay = approvedStayBySlug(body.data.slug);
    if (!stay) throw new HttpError(404, "not_found");
    return Response.json({ id: createReport(user, stay.id, body.data.reason, body.data.details) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
