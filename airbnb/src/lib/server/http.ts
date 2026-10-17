// Server only. An error an API route turns into a status and a short code.
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    /** Field problems for forms: `{ "pricePerNight": "Must be at least 1" }`. */
    public fields?: Record<string, string>,
  ) {
    super(code);
    this.name = "HttpError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.code, ...(error.fields ? { fields: error.fields } : {}) }, { status: error.status });
  }
  console.error("api error", error instanceof Error ? `${error.name}: ${error.message}` : typeof error);
  return Response.json({ error: "server_error" }, { status: 500 });
}
