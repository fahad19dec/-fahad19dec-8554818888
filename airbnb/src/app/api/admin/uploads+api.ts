import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { requireAdmin } from "@/lib/server/admin-auth";
import { HttpError, errorResponse } from "@/lib/server/http";
import { dataDir } from "@/lib/server/store";

const MAX_BYTES = 8 * 1024 * 1024;

// The file's first bytes decide its type, never its name or Content-Type.
function imageType(bytes: Uint8Array) {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return "jpg";
  if (starts(0x89, 0x50, 0x4e, 0x47)) return "png";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "gif";
  if (starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

// POST /api/admin/uploads with the image as the raw body → { url }. Photos are
// saved under DATA_DIR/uploads and served by GET /api/uploads/:name.
export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) throw new HttpError(413, "too_large");
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length > MAX_BYTES) throw new HttpError(413, "too_large");
    const ext = imageType(bytes);
    if (!ext) throw new HttpError(415, "not_an_image");

    const name = `${randomBytes(8).toString("hex")}.${ext}`;
    const dir = path.join(dataDir(), "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return Response.json({ url: `/api/uploads/${name}` }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
