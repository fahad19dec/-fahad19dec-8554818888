import { readFile } from "node:fs/promises";
import path from "node:path";

import { dataDir } from "@core/db";

const types: Record<string, string> = { jpg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

// GET /uploads/:name: photos uploaded from the listing form, read from the
// shared DATA_DIR/uploads (the guest app serves the same files at /api/uploads).
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[name]">) {
  const { name } = await params;
  const match = /^[a-f0-9]{16}\.(jpg|png|gif|webp)$/.exec(name);
  if (!match) return new Response("Not found", { status: 404 });
  try {
    const file = await readFile(path.join(dataDir(), "uploads", name));
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": types[match[1]], "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
