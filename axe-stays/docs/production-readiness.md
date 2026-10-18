# Axe Stays: what's missing for production

Audit of the app as of the Axe Stays rebrand. It runs end to end with no outside
services, which is good for a demo and not enough for real guests, hosts or money.
Each item says what the app does today, why that's a problem, and what to replace it with.

Severity: **Blocker** means you can't launch with it; **High** means fix before real users; **Later** means fine for a first release.

## 1. Mocked or placeholder features

| Area | What it does today | Severity | Replace with |
| --- | --- | --- | --- |
| Booking | "Book this stay" opens a summary. Dates and guests say "Coming soon", and **Confirm and pay** is permanently disabled (`src/app/stay/[slug]/book.tsx`). The total is `price × minNights + cleaningFee`. | Blocker | Date picker, availability, a booking record, payment (section 3). |
| Pricing | The sample policies promise a **12% service fee**, taxes, pet fees and refunds by cancellation tier. None of that is calculated anywhere. | Blocker (legal) | One server-side price function used for quotes, checkout and refunds; policy text that matches it. |
| Trips | The tab is a placeholder; Profile always shows "0 trips". | High | The guest's bookings. |
| Saved stays | Hearts live in memory and are gone on restart (`src/lib/favorites.ts`). | High | Saved per account in the database. |
| Guest profile | Always "Axe Stays guest" with a letter avatar, and the rating always shows "New". | High | The signed-in user's name, photo and data. |
| Payments, Notifications, Help | "Coming soon" screens (`src/app/account/[topic].tsx`). | High | Real screens, or remove the rows for launch. |
| Ratings and reviews | `rating` and `reviewCount` are typed in by the admin. No real reviews exist. | High (trust) | Reviews written by guests after a completed stay; ratings computed from them. |
| Ask about this stay | Keyword matching (`src/lib/ask.ts`). It answers check-in, pets, cancellation, payment, damage and refunds only, and quotes text without generating any. | Later | Good as is; add topics, or a model-based matcher behind the same "quote, never invent" rule. |
| Hosts | 12 fictional sample hosts. Hosts can only be created from the listing form, never edited or removed, and hosts can't sign in. | High | Host accounts that own their listings. |
| Policies | 8 sample policies from the tutorial seed, not editable in the app. | Blocker (legal) | Your own terms, reviewed by a lawyer, editable by staff. |
| Listing content | 30 sample stays from the original tutorial. Their photos are copies of images hosted on the tutorial author's Sanity CDN (`cdn.sanity.io/images/0z83ssmn/...`). | Blocker | Your own listings and photos. Don't ship content you don't hold rights to, or depend on someone else's CDN. |
| Browser demo | `EXPO_PUBLIC_DEMO=1` runs the API inside the page, with the public password `axe-stays-demo` and data in localStorage. | n/a | Keep for demos only; never deploy it as the real app. |

## 2. Auth

| What it does today | Problem |
| --- | --- |
| No guest accounts at all. Anyone can browse; nobody can sign in. | You can't book, save or review without an identity. |
| One shared admin password (`ADMIN_PASSWORD`) for everyone who manages listings. | No individual accounts, no audit trail, no way to remove one person's access. |
| The login returns an HMAC token valid for 7 days (`src/lib/server/admin-auth.ts`). It can't be revoked except by changing the password, which signs everyone out. | A leaked token works for a week. |
| On web the token sits in `localStorage`. | Any XSS bug could read it. |
| Login is slowed by 600 ms after a wrong password, but nothing limits attempts. | Passwords can be guessed by brute force. |
| No roles beyond "admin". | Hosts, support staff and admins need different permissions. |

**Replace with:** a managed auth provider. The original project used **Clerk**, and its Expo SDK is a good fit; **Supabase Auth** also works if you choose Supabase for the database. Use email and social sign-in, with roles `guest`, `host` and `admin` stored on the user. Every API route checks the session and role. Admin routes check ownership, so a host only edits their own listings. Add rate limiting on sign-in and on writes.

## 3. Payments

Nothing exists: no Stripe, no checkout, no payouts, no refunds.

**Replace with:**
- **Stripe** PaymentIntents (or Checkout), using the Stripe React Native SDK in the app and Payment Element on web.
- **Stripe Connect** (Express accounts) so hosts get paid out, with the service fee taken as the application fee.
- **Webhooks** (`payment_intent.succeeded`, refunds, disputes) as the source of truth for booking status, never the app's own redirect.
- **Refunds** computed by the cancellation tier (flexible, moderate or strict) and the price function from section 1.
- **Records:** store every charge and refund against the booking.

## 4. Image uploads

| What it does today | Problem |
| --- | --- |
| Upload saves the raw file to the server's disk (`data/uploads/`) and serves it from `/api/uploads/:name`. | Lost on redeploy unless the disk persists. Doesn't work with more than one server. No CDN. |
| Web only. On iOS and Android admins can only paste a URL (`src/lib/pick-image.ts`). | Hosts on phones can't add photos. |
| No resizing. An 8 MB phone photo is served as is to every guest. | Slow pages and high data use. |
| Files are never deleted when a photo or listing is removed. | Storage grows forever. |
| The type is checked from the file's bytes (good), but nothing scans content or strips EXIF location data. | Privacy leak: photos can reveal a host's home GPS location. |

**Replace with:** object storage (S3, Cloudflare R2 or Supabase Storage). The app asks the API for a **signed upload URL** and uploads straight to storage. Images are served through an image CDN with resizing (Cloudflare Images, imgix, or the storage provider's transforms), and EXIF is stripped on upload. On native, pick photos with **expo-image-picker**. Delete files from storage when a photo is removed.

## 5. Data and backend

| What it does today | Problem |
| --- | --- |
| Listings are one JSON file (`data/db.json`), read in full on every request; writes are queued in one process (`src/lib/server/store.ts`). | Fine for one server and a few hundred stays. Breaks with two servers, and there are no backups or migrations. |
| Search scans every stay in memory and returns at most 100 (`src/lib/server/stay-search.ts`). | Slows with thousands of stays; no pagination. |
| No availability or calendar data. | You can't filter by dates, which is the most important filter for stays. |
| `location` (lat/lng) is stored but unused. | No map or distance search. |
| Prices are whole US dollars; USD is hard-coded in labels and copy. | No other currencies. |

**Replace with:** **Postgres** (Supabase or Neon) with Drizzle or Prisma for the schema and migrations. Tables: users, hosts, stays, photos, availability, bookings, payments, reviews, favorites and policies. Move filtering into SQL with indexes, and add PostGIS for map and distance search. Paginate with a cursor. Take daily backups with point-in-time recovery.

## 6. Environment variables

**Today**

| Name | Where | Used for |
| --- | --- | --- |
| `ADMIN_PASSWORD` | server | Admin sign-in. Only checked when someone tries to log in, so a missing value isn't noticed at deploy time. |
| `DATA_DIR` | server, optional | Location of `db.json` and uploads. |
| `EXPO_PUBLIC_API_URL` | app, optional | API origin for native release builds. If it's missing, a release build can't reach the API at all. |
| `EXPO_PUBLIC_DEMO` | build | Browser demo mode. |

**Needed for production:** `DATABASE_URL`, the auth keys (for Clerk: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`, the storage bucket and keys, `SENTRY_DSN` and `EXPO_PUBLIC_SENTRY_DSN`, and email-provider keys.

**Fix:** validate every server variable with zod when the server starts and refuse to boot if one is missing. Keep `EXPO_PUBLIC_*` limited to values that are safe in the app bundle. Store secrets in the host's secret manager and in EAS secrets, never in git.

## 7. Error handling and monitoring

| What it does today | Problem |
| --- | --- |
| There's no app-wide error screen: no `ErrorBoundary` export in `src/app/_layout.tsx`. | One render error blanks the app. |
| API calls have no timeout or retry (`src/lib/api.ts`). | A hung server leaves spinners forever. |
| The server logs `console.error` with the error's name only (`src/lib/server/http.ts`). | No stack traces, request IDs or alerts. |
| No crash reporting or analytics (PostHog was removed with the original's services). | You won't know when things break or how people use the app. |
| Screens do handle loading, empty and error states, and form errors show per field. | Good. Keep this pattern. |

**Fix:**
- An `ErrorBoundary` in the root layout with a "Try again" action.
- Request timeouts (about 10 s), with one retry for safe GETs.
- **Sentry** on app and server, with source maps uploaded by EAS.
- Structured JSON logs with a request ID.
- Uptime checks on `/api/meta`.
- Alerts on failed payments and webhook errors.

## 8. Security

- No request body size limit on JSON routes; the upload route has an 8 MB limit.
- No security headers (CSP, HSTS) set by the server.
- Nothing checks that requests come over HTTPS.
- Admin rate limiting is a fixed delay, not a limit.
- No privacy policy, terms or cookie notice, all of which the app stores require.

**Fix:** a proper host (Vercel, Fly or Render, or EAS Hosting for Expo API routes) behind HTTPS, with security headers, rate limits (Upstash or the host's own), body size limits, a dependency audit in CI, and the legal pages.

## 9. Testing, CI and release

- No automated tests in the repo. The browser tests used during development were scratch scripts.
- No CI.
- No `eas.json`, so nothing is set up for store builds. App IDs exist now: `com.axestays.app`, from `brand.config.js`.
- No store listing assets (screenshots, descriptions, privacy labels).

**Fix:**
- Unit tests for the price function, search, `filtersFromSentence` and stay validation.
- Playwright end-to-end tests for search, filters and admin, committed under `e2e/`.
- GitHub Actions running lint, type check, tests, and a web export on every PR.
- `eas.json` with development, preview and production profiles, plus EAS Update for over-the-air fixes.

## Proposed plan

Rough effort for one experienced developer. Each phase ends deployable.

**Phase 1: Foundation (about 1 week)**
1. Postgres and an ORM. Move the JSON store behind the same API routes, so the app doesn't change. Add migrations and a seed.
2. Env validation at boot, Sentry, structured logs, a root `ErrorBoundary`, and request timeouts.
3. CI (lint, types, unit tests, web export) and the first Playwright tests.
4. Hosting with HTTPS, security headers and backups. Deploy a staging environment.

**Phase 2: Accounts (about 1 week)**
1. Clerk (or Supabase Auth) for guests, hosts and admins, with roles on the user.
2. Replace `ADMIN_PASSWORD` with role checks, and hosts own their listings.
3. Saved stays and the profile backed by the account. Rate limits on auth and writes.

**Phase 3: Photos (2–3 days)**
1. Object storage with signed uploads, an image CDN with resizing, and EXIF stripping.
2. `expo-image-picker` on iOS and Android. Delete files when photos are removed.
3. Replace the tutorial's sample photos and listings with your own.

**Phase 4: Bookings and payments (2–3 weeks)**
1. Availability calendar per stay, a date and guest picker, and a date filter in search.
2. One price function (nights, cleaning, pet fee, service fee, weekly discount, taxes) shared by quote, checkout and refunds.
3. Stripe PaymentIntents, Connect payouts to hosts, and webhooks driving booking status.
4. Cancellation and refunds by tier, emails for confirmations and receipts, and the Trips tab.
5. Rewrite the policies to match what the code does, with legal review.

**Phase 5: Trust and launch (1–2 weeks)**
1. Reviews from completed stays, with ratings computed from them.
2. Push notifications (`expo-notifications`) for booking updates. Support contact.
3. Accessibility pass, a load test, privacy policy and terms, and store listings.
4. EAS production builds, TestFlight and Play internal testing, then release.

**Decisions to make first**
- **Auth:** Clerk (fastest, fits Expo, paid past the free tier) or Supabase Auth (cheaper if you also use Supabase for the database and storage).
- **Backend host:** keep Expo API routes (EAS Hosting or any Node host) or move the API to a separate service.
- **Payments model:** a marketplace that pays hosts (Stripe Connect), or you own every stay (plain Stripe).
- **Markets:** which countries and currencies, since that drives taxes, legal terms and payouts.
