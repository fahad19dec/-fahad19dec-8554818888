// Errors the data layer throws when a request isn't allowed or can't be done.
// Both apps turn them into a status and a short code (the guest app's API
// routes as JSON; the admin dashboard as a message on the page).
export class AccessError extends Error {
  constructor(
    public status: number,
    public code: string,
    /** Field problems for forms: `{ "checkOut": "This stay needs at least 2 nights" }`. */
    public fields?: Record<string, string>,
  ) {
    super(code);
    this.name = "AccessError";
  }
}
