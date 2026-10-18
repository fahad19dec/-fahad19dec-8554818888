import { login } from "@/lib/server/admin-auth";
import { errorResponse } from "@/lib/server/http";

// POST /api/admin/login { password } → { token, expiresAt }. Never logs the password.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
    return Response.json(await login(body?.password));
  } catch (error) {
    return errorResponse(error);
  }
}
