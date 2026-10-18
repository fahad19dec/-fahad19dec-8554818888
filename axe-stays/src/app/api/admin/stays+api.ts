import { requireAdmin } from "@/lib/server/admin-auth";
import { errorResponse } from "@/lib/server/http";
import { newStayId, parseStayInput, stayFields, uniqueSlug } from "@/lib/server/stay-input";
import { readDb, updateDb } from "@/lib/server/store";
import type { StayRecord } from "@/lib/stays";

// GET /api/admin/stays: every stay as stored, newest first, with the hosts the
// form can pick from. POST creates a stay from the admin form.
export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { stays, hosts } = await readDb();
    return Response.json({
      stays: [...stays].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      hosts: hosts.map(({ slug, name, isSuperhost }) => ({ slug, name, isSuperhost })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const input = parseStayInput(await request.json().catch(() => null));
    const stay = await updateDb((db) => {
      const now = new Date().toISOString();
      const created: StayRecord = {
        id: newStayId(),
        slug: uniqueSlug(input.title, db.stays.map((s) => s.slug)),
        ...stayFields(input, db),
        createdAt: now,
        updatedAt: now,
      };
      db.stays.push(created);
      return created;
    });
    return Response.json(stay, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
