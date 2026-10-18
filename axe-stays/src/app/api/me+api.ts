import { currentUser } from "@/lib/server/auth";
import { errorResponse } from "@/lib/server/http";

// GET /api/me: the signed-in account as the database sees it (role, ban
// status), creating it on first sign-in. Banned accounts get 200 with
// status "banned", so the app can explain instead of just failing.
export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id, email, name, imageUrl, role, status, banReason, createdAt } = user;
    return Response.json({ id, email, name, imageUrl, role, status, banReason, createdAt });
  } catch (error) {
    return errorResponse(error);
  }
}
