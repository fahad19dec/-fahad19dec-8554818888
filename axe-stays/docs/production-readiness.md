# Axe Stays: what's missing for production

Audit of the guest app and the admin dashboard (`../admin`) as of the move to a
shared SQLite database, Clerk accounts and simulated bookings. Both run end to end,
but parts are still stand-ins. Each item says what the code does today, why that's
a problem, and what to replace it with.

Severity: **Blocker** means you can't launch with it; **High** means fix before real users; **Later** means fine for a first release.

## Done since the first audit

- **Accounts and roles:** Clerk sign-up and sign-in in the guest app and the admin, with `guest` / `host` / `admin` roles and bans stored in the database and checked on every request. The shared `ADMIN_PASSWORD` is gone.
- **Backend role checks:** every admin change is checked three times (dashboard gate, server action, and `assertAdmin` in the data layer) and written to an audit log.
- **Bookings:** a calendar with booked nights blocked, one server-side price function (nights, weekly discount, cleaning, pet fee, 12% service fee), overlap checks in a transaction, trips, and cancellation with refunds by tier.
- **Admin dashboard:** users (view, ban, role), listings (approve, reject, edit, create, photo upload), bookings (view, cancel with full or policy refund), reports, analytics and an activity log.
- **Database:** SQLite with migrations, replacing the JSON file.

## 1. Mocked or placeholder features

| Area | What it does today | Severity | Replace with |
| --- | --- | --- | --- |
| Payment | Simulated: "Confirm and pay" records a booking with a `sim_` reference; refunds are numbers in the database. No card is collected or charged. | Blocker | Stripe (section 3). |
| Taxes | The policies mention taxes; none are calculated. | Blocker (legal) | Stripe Tax or a tax service in the price function. |
| Time zones | Check-in times are read as UTC for refund windows, because stays have no time zone. | High | A time zone per stay. |
| Saved stays | Hearts live in memory and are gone on restart (`src/lib/favorites.ts`). | High | Saved per account in the database. |
| Payments, Notifications, Help | "Coming soon" screens (`src/app/account/[topic].tsx`). | High | Real screens, or remove the rows for launch. |
| Ratings and reviews | `rating` and `reviewCount` are typed in by the admin. No real reviews exist. | High (trust) | Reviews written by guests after a completed stay; ratings computed from them. |
| Emails | No booking confirmations, cancellation notices, ban notices or report replies. | High | An email provider (Resend, Postmark) with templates. |
| Hosts | 12 fictional sample hosts. Only admins create listings (by choice); hosts can't sign in to manage theirs. | Later | Host accounts that own their listings, if you open the marketplace. |
| Policies | 8 sample policies from the tutorial seed, not editable in the admin. | Blocker (legal) | Your own terms, reviewed by a lawyer, editable by staff. |
| Listing content | 30 sample stays from the original tutorial, with photos on the tutorial author's Sanity CDN (`cdn.sanity.io/images/0z83ssmn/...`). | Blocker | Your own listings and photos. |
| Sample activity | Outside production the seed adds sample guests, bookings and reports so the dashboard has data. | n/a | Off when `NODE_ENV=production` or `SEED_SAMPLE_ACTIVITY=0`. |
| Ask about this stay | Keyword matching (`src/lib/ask.ts`), quoting text without generating any. | Later | Good as is; add topics if needed. |
| Browser demo | `EXPO_PUBLIC_DEMO=1` runs the API inside the page, with any-email sign-in and data in localStorage. | n/a | Keep for demos only; never deploy it as the real app. |

## 2. Auth

| What it does today | Problem |
| --- | --- |
| Without Clerk keys, both apps fall back to dev sign-in (`AUTH_MODE=dev`): any email, no password. It's refused when `NODE_ENV=production`. | Fine locally. Make sure production has the keys and never sets `AUTH_MODE=dev`. |
| The Clerk paths are written against the SDKs' docs but haven't been run against a real Clerk instance here. | Test sign-up, sign-in, email codes and sign-out on staging before launch. |
| Admins are bootstrapped with `ADMIN_EMAILS`, then managed in the dashboard. | Remove the variable once the first admins exist, so a new account with a listed email isn't promoted. |
| A ban blocks the user's next request in our API, but their Clerk session stays alive. | Also lock the user in Clerk (Backend API `banUser`) so they can't sign in at all. |
| No rate limiting on writes (bookings, reports). | Spam and scripted abuse. |
| No MFA requirement for admins. | One stolen password controls the platform. |

**Fix:** set the Clerk keys in both apps, require MFA for admin accounts in Clerk, mirror bans to Clerk from `banUserAction`, and add rate limits (Upstash or the host's) on sign-in and writes.

## 3. Payments

**Replace the simulation with:**
- **Stripe** PaymentIntents, using the Stripe React Native SDK in the app and Payment Element on web. `createBooking` becomes "hold the dates, create a PaymentIntent", and the booking confirms when it succeeds.
- **Webhooks** (`payment_intent.succeeded`, `charge.refunded`, disputes) as the source of truth for booking status.
- **Refunds:** the admin and guest cancel paths already compute the amount; call Stripe's refund API with it and store the refund ID.
- **Stripe Connect** (Express accounts) only if hosts get paid out, with the service fee as the application fee.
- A held-dates expiry so abandoned checkouts free the calendar.

## 4. Image uploads

| What it does today | Problem |
| --- | --- |
| The admin saves uploads to `DATA_DIR/uploads/` and the guest app serves them from `/api/uploads/:name`. | Lost on redeploy unless the disk persists. Doesn't work across servers. No CDN. |
| No resizing. An 8 MB photo is served as is. | Slow pages and high data use. |
| Files are never deleted when a photo or listing is removed. | Storage grows forever. |
| The type is checked from the file's bytes, but EXIF location data isn't stripped. | Photos can reveal a home's GPS location. |

**Replace with:** object storage (S3, Cloudflare R2) with signed uploads, an image CDN with resizing, EXIF stripped on upload, and deletion when a photo is removed.

## 5. Data and backend

| What it does today | Problem |
| --- | --- |
| One SQLite file shared by the two apps (WAL mode). | Both servers must run on the same machine or volume. No replicas, and no backups unless you add them. |
| Listings are stored as JSON in `stays.data`; search loads approved stays and filters in memory (at most 100 results). | Fine for thousands of stays; slows beyond that, and there's no pagination. |
| Bookings, users and reports are real tables with indexes. | Good. |
| No date filter in search. | The most important filter for stays. |
| USD only. | No other currencies. |

**Next step:** keep SQLite with nightly backups (Litestream to S3) for a single-server launch. When you need more than one server, move to **Postgres** (Neon, Supabase): the data layer in `src/lib/db/` is the only code that touches the database, so only it changes. Then move stay filtering into SQL and add a date filter.

## 6. Environment variables

**Today** (see both `.env.example` files)

| Name | Where | Used for |
| --- | --- | --- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | guest app / admin | Clerk in the client. |
| `CLERK_SECRET_KEY` | both servers | Verifying sessions, loading profiles. |
| `ADMIN_EMAILS` | both servers | First admins. |
| `AUTH_MODE`, `EXPO_PUBLIC_AUTH_MODE` | dev only | Dev sign-in without Clerk. |
| `DATA_DIR` | both servers | The shared database and uploads. Must be the same folder. |
| `SEED_SAMPLE_ACTIVITY` | server | `0` skips the sample users, bookings and reports. |
| `GUEST_APP_URL` | admin | "View in app" links. |
| `EXPO_PUBLIC_API_URL` | app | API origin for native release builds. |
| `EXPO_PUBLIC_DEMO` | build | Browser demo mode. |

**Still needed:** Stripe keys and webhook secret, storage bucket keys, `SENTRY_DSN`s, and email-provider keys.

**Fix:** validate the server variables with zod at startup and refuse to boot without them (today a missing Clerk key is reported as `auth_not_configured` on the first protected request). Keep secrets in the host's secret manager and EAS secrets, never in git.

## 7. Error handling and monitoring

| What it does today | Problem |
| --- | --- |
| The guest app has no root `ErrorBoundary`. The admin has an `error.tsx` for the dashboard. | One render error blanks the guest app. |
| Guest API calls have no timeout or retry (`src/lib/api.ts`). | A hung server leaves spinners forever. |
| Known errors return stable codes (`dates_unavailable`, `account_suspended`…) shown as plain messages; unknown ones are logged with `console.error`. | No stack traces in a log service, no request IDs or alerts. |
| No crash reporting or analytics. | You won't know when things break. |
| Screens handle loading, empty and error states, and forms show errors per field. | Good. Keep this pattern. |

**Fix:** a root `ErrorBoundary`, request timeouts, Sentry on both apps and servers, structured logs with a request ID, uptime checks, and alerts on failed payments and webhooks.

## 8. Security

- Role and ban checks run on the server for every request and every admin action (done).
- No security headers (CSP, HSTS) on either app.
- The guest API has no request body size limit on JSON routes.
- The admin is a separate app; put it on its own domain, and consider an IP allowlist or Clerk organization restriction.
- No privacy policy, terms or cookie notice, which the app stores require.

## 9. Testing, CI and release

- No automated tests in the repo. The Playwright end-to-end checks (booking, cancel, reports, and the admin flows including replaying an admin action as a non-admin) were run as scratch scripts during development.
- No CI and no `eas.json` for store builds.

**Fix:** unit tests for pricing, refunds, search and the data layer's access checks; the Playwright flows committed under `e2e/`; GitHub Actions running lint, type checks, tests and builds for both apps; `eas.json` with development, preview and production profiles.

## Proposed plan

**Phase 1: Launch-ready basics (about 1 week)**
1. Clerk keys on staging; test both apps' sign-in. Admin MFA; mirror bans to Clerk.
2. Env validation at boot, Sentry, structured logs, a root `ErrorBoundary`, request timeouts.
3. CI with the existing checks plus unit and Playwright tests.
4. Hosting both apps on one machine with a persistent volume for `DATA_DIR`, HTTPS, security headers, and Litestream backups.

**Phase 2: Real money (1–2 weeks)**
1. Stripe PaymentIntents and webhooks in place of the simulated payment; refunds through Stripe.
2. Taxes, held-dates expiry, email confirmations and receipts.
3. Policies rewritten to match the code, with legal review.

**Phase 3: Photos and content (3–4 days)**
1. Object storage, image CDN, EXIF stripping.
2. Your own listings and photos in place of the tutorial's.

**Phase 4: Trust and growth (1–2 weeks)**
1. Reviews from completed stays; saved stays per account; date filter in search.
2. Push notifications, support contact, accessibility pass, store listings and EAS builds.
3. Postgres when you need more than one server.
