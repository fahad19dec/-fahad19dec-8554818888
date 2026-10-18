import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { api, ApiError, isDemo } from "@/lib/api";

import { clearToken, readToken, saveToken } from "./session-token";

// Who's signed in, for every screen, whichever way sign-in works:
// - "clerk": EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set (production).
// - "dev": EXPO_PUBLIC_AUTH_MODE=dev or the browser demo. Sign in with any
//   email, no password; the server accepts it only when AUTH_MODE=dev and not
//   in production (src/lib/server/auth.ts).
// - "none": neither is set. Browsing works; signing in says it isn't set up.
// The account (role, ban status) always comes from the server's database
// through GET /api/me, so a ban made in the admin dashboard shows up here.

const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
export const authMode: "clerk" | "dev" | "none" = clerkKey
  ? "clerk"
  : process.env.EXPO_PUBLIC_AUTH_MODE === "dev" || isDemo
    ? "dev"
    : "none";

export type Account = {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  role: "guest" | "host" | "admin";
  status: "active" | "banned";
  banReason: string | null;
};

type Session = {
  isLoaded: boolean;
  isSignedIn: boolean;
  /** The bearer token for this app's API, or null when signed out. */
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
  /** Dev sign-in only. */
  signInWithEmail?: (email: string) => Promise<void>;
  /** The account as the database sees it; undefined while loading or signed out. */
  account?: Account;
  refreshAccount: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside SessionProvider");
  return session;
}

/** Fetches the account whenever the signed-in user changes or the app returns to the foreground. */
function useAccount(isSignedIn: boolean, getToken: () => Promise<string | null>, userKey: string | null) {
  // Keyed by user, so a sign-out or a different sign-in never shows the last account.
  const [loaded, setLoaded] = useState<{ key: string | null; account?: Account }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!isSignedIn) return;
    let live = true;
    (async () => {
      try {
        const next = await api<Account>("/api/me", { token: await getToken() });
        if (live) setLoaded({ key: userKey, account: next });
      } catch (error) {
        if (live && error instanceof ApiError && error.status === 401) setLoaded({ key: userKey });
      }
    })();
    return () => {
      live = false;
    };
  }, [isSignedIn, getToken, userKey, attempt]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => state === "active" && setAttempt((n) => n + 1));
    return () => sub.remove();
  }, []);
  const refresh = useCallback(() => setAttempt((n) => n + 1), []);
  return { account: isSignedIn && loaded?.key === userKey ? loaded.account : undefined, refresh };
}

function ClerkSession({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut, userId } = useAuth();
  const { user } = useUser();
  const tokenGetter = useCallback(() => getToken(), [getToken]);
  const { account, refresh } = useAccount(!!isSignedIn, tokenGetter, userId ?? null);
  const value = useMemo<Session>(
    () => ({
      isLoaded,
      isSignedIn: !!isSignedIn,
      getToken: tokenGetter,
      signOut: async () => {
        await signOut();
      },
      account: account && {
        ...account,
        name: account.name ?? user?.fullName ?? null,
        imageUrl: user?.hasImage ? user.imageUrl : account.imageUrl,
      },
      refreshAccount: refresh,
    }),
    [isLoaded, isSignedIn, tokenGetter, signOut, account, user, refresh],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function DevSession({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>();
  useEffect(() => {
    readToken().then((saved) => setEmail(saved ?? null));
  }, []);
  const getToken = useCallback(async () => (email ? `dev:${email}` : null), [email]);
  const { account, refresh } = useAccount(!!email, getToken, email ?? null);
  const value = useMemo<Session>(
    () => ({
      isLoaded: email !== undefined,
      isSignedIn: !!email,
      getToken,
      signOut: async () => {
        await clearToken();
        setEmail(null);
      },
      signInWithEmail: async (next: string) => {
        const clean = next.trim().toLowerCase();
        // Creates the account and checks the server accepts dev sign-in.
        await api<Account>("/api/me", { token: `dev:${clean}` });
        await saveToken(clean);
        setEmail(clean);
      },
      account,
      refreshAccount: refresh,
    }),
    [email, getToken, account, refresh],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

const noSession: Session = {
  isLoaded: true,
  isSignedIn: false,
  getToken: async () => null,
  signOut: async () => {},
  refreshAccount: () => {},
};

export function SessionProvider({ children }: { children: ReactNode }) {
  if (authMode === "clerk") {
    return (
      <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}>
        <ClerkSession>{children}</ClerkSession>
      </ClerkProvider>
    );
  }
  if (authMode === "dev") return <DevSession>{children}</DevSession>;
  return <SessionContext.Provider value={noSession}>{children}</SessionContext.Provider>;
}

/** An API call as the signed-in user. */
export function useAuthedApi() {
  const { getToken } = useSession();
  return useCallback(
    async <T,>(path: string, init: Parameters<typeof api>[1] = {}) => api<T>(path, { ...init, token: await getToken() }),
    [getToken],
  );
}
