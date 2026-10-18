import { AccessError } from "../db/access";

// Server only. An error an API route turns into a status and a short code.
// Same class as the data layer's AccessError, so either can be thrown.
export { AccessError as HttpError };

export function errorResponse(error: unknown) {
  if (error instanceof AccessError) {
    return Response.json({ error: error.code, ...(error.fields ? { fields: error.fields } : {}) }, { status: error.status });
  }
  console.error("api error", error instanceof Error ? `${error.name}: ${error.message}` : typeof error);
  return Response.json({ error: "server_error" }, { status: 500 });
}
