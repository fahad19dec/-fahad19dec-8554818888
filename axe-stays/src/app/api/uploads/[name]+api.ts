import { readFile } from "node:fs/promises";
import path from "node:path";

import { dataDir } from "@/lib/db";
import { HttpError, errorResponse } from "@/lib/server/http";

const types: Record<string, string> = { jpg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

// GET /api/uploads/:name: a photo uploaded in the admin dashboard, read from
// the shared DATA_DIR/uploads. Names are only ever the random ones the admin
// upload writes, so nothing outside uploads/ can be read.
export async function GET(_request: Request, { name }: Record<string, string>) {
  try {
    const match = /^[a-f0-9]{16}\.(jpg|png|gif|webp)$/.exec(name ?? "");
    if (!match) throw new HttpError(404, "not_found");
    const file = await readFile(path.join(dataDir(), "uploads", name)).catch(() => {
      throw new HttpError(404, "not_found");
    });
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": types[match[1]], "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
