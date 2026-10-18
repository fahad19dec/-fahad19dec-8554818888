import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

// Clerk needs its middleware on every request to read the session. Without
// Clerk keys (dev sign-in), requests pass straight through. Either way, the
// admin check itself happens in the pages and actions (src/lib/auth.ts).
const withClerk = process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? clerkMiddleware() : null;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return withClerk ? withClerk(request, event) : NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
