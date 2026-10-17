// The app's one way to reach its own API routes (src/app/api/). In development
// relative URLs go to the Expo dev server, on web and native alike. A native
// release build has no dev server, so it needs EXPO_PUBLIC_API_URL.

const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    /** Field messages from a rejected form, keyed by path ("houseRules.checkInTime"). */
    public fields?: Record<string, string>,
  ) {
    super(`${code} (${status})`);
    this.name = "ApiError";
  }
}

/** A request that never reached the server (offline, server down). */
export const isConnectionError = (error: Error) => error instanceof TypeError || (error instanceof ApiError && error.status === 0);

export async function api<T>(
  path: string,
  init: RequestInit & { token?: string | null; json?: unknown } = {},
): Promise<T> {
  const { token, json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...rest,
      headers: {
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "network_error");
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as { error?: string; fields?: Record<string, string> } | null;
  if (!res.ok) throw new ApiError(res.status, body?.error ?? "server_error", body?.fields);
  return body as T;
}

/** Query string from flat params, with a leading "?" when there are any. */
export const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : "";
};

// Listeners told when the admin changes a stay, so screens drop cached lists.
const listeners = new Set<() => void>();
export const onStaysChanged = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
export const staysChanged = () => listeners.forEach((l) => l());
