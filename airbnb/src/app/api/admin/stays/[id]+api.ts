import { requireAdmin } from "@/lib/server/admin-auth";
import { HttpError, errorResponse } from "@/lib/server/http";
import { parseStayInput, stayFields } from "@/lib/server/stay-input";
import { readDb, updateDb } from "@/lib/server/store";

// GET, PUT and DELETE one stay by id. The slug never changes on edit, so
// links to a stay keep working after its title does.
export async function GET(request: Request, { id }: Record<string, string>) {
  try {
    requireAdmin(request);
    const stay = (await readDb()).stays.find((s) => s.id === id);
    if (!stay) throw new HttpError(404, "not_found");
    return Response.json(stay);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { id }: Record<string, string>) {
  try {
    requireAdmin(request);
    const input = parseStayInput(await request.json().catch(() => null));
    const stay = await updateDb((db) => {
      const index = db.stays.findIndex((s) => s.id === id);
      if (index === -1) throw new HttpError(404, "not_found");
      // The form doesn't edit the map location, so it carries over.
      const { slug, createdAt, location } = db.stays[index];
      db.stays[index] = { id, slug, ...stayFields(input, db), location, createdAt, updatedAt: new Date().toISOString() };
      return db.stays[index];
    });
    return Response.json(stay);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  try {
    requireAdmin(request);
    await updateDb((db) => {
      const before = db.stays.length;
      db.stays = db.stays.filter((s) => s.id !== id);
      if (db.stays.length === before) throw new HttpError(404, "not_found");
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
