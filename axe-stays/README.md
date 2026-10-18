# Axe Stays

An Expo (React Native) app for finding and booking stays, on web, iOS and
Android from one codebase. Guests search with a sentence or a full filter
panel, book dates with a price breakdown, manage their trips, and report
problem listings. Listings, users, bookings and reports are managed in the
separate [admin dashboard](../admin), which shares this app's database.

**Brand:** everything brand-specific (name, copy, logo, colors, app IDs) lives
in [`brand.config.js`](./brand.config.js), for this app and the admin dashboard.
Change it and restart; rerun `python3 scripts/brand-icons.py` to redraw the icons.

**Production:** what's mocked or missing, and the plan to fix it, is in
[`docs/production-readiness.md`](./docs/production-readiness.md).

It started from JavaScript Mastery's [Roam clone](https://github.com/jsmastery-pro/airbnb-clone).
Sanity, PostHog and the AI search were replaced with a local backend; the 30
sample stays, 12 hosts and 8 policies were exported into `data/seed.json`.

## Features

- **Home:** top-rated stays, with Cabins / Beach / City / Villas categories.
- **Search:** type a sentence like *"pet friendly cabin with a hot tub under $300"*.
  Code reads it into filters (type, amenities, pets, price, guests, place), and
  other words rank results by keyword.
- **Every filter:** type, price range, guests, bedrooms, beds, bathrooms, 17
  amenities, pets / smoking / parties, rating, Superhost, cancellation policy,
  vibe and location, with quick chips, removable active filters and a live count.
- **Stay details:** photos, amenities, house rules, host, policies, "Ask about
  this stay" (answers quoted from the stay's rules and the platform's policies),
  and **Report this listing**.
- **Booking:** a calendar with booked nights blocked, guests and pets, and the
  price as the server charges it: nights, weekly discount, cleaning and pet
  fees, and the 12% service fee. Payment is simulated; no card is charged.
- **Trips:** upcoming, past and cancelled bookings. Guests cancel under the
  stay's cancellation policy and see the refund before confirming.
- **Accounts:** Clerk email sign-up and sign-in (or dev sign-in locally).
  Browsing never needs an account; booking, trips and reports do. Suspended
  accounts are told why and can't book.
- **Live from the admin:** approvals, edits, rejections, bans and cancellations
  made in the dashboard apply on the guest's next request. Open screens refetch
  when they come back into view.

## Run it

Node 22.13+ (for the built-in SQLite).

```bash
cd axe-stays
npm install
cp .env.example .env.local      # Clerk keys, or AUTH_MODE=dev + EXPO_PUBLIC_AUTH_MODE=dev
npx expo start                  # press w for web, i for iOS, a for Android
```

Then start the [admin dashboard](../admin) with the same `DATA_DIR`.

| Command | What it does |
| --- | --- |
| `npx expo start` | Dev server: the app and its API routes |
| `npx tsc --noEmit` | Type check |
| `npx expo lint` | Lint |
| `npx expo export -p web && npx expo serve` | Production web build and server |

## How it works

```
guest app ──▶ API routes (src/app/api) ──┐
                                         ├──▶ DATA_DIR/axe-stays.sqlite (+ uploads/)
admin dashboard (../admin) ──────────────┘
                both use src/lib/db (shared data layer)
```

- **Database:** SQLite through Node's built-in `node:sqlite`, in WAL mode so both
  apps read and write it at once. Created and seeded on first use (outside
  production it also adds clearly marked sample guests, bookings and reports).
  Delete `data/axe-stays.sqlite*` to start over.
- **Shared data layer:** `src/lib/db/` (listings, users, bookings, reports,
  audit log, analytics), `src/lib/booking/pricing.ts` (prices and refunds) and
  `src/lib/server/stay-input.ts` (listing validation). Relative imports only, so
  the admin imports them directly.
- **Auth:** the app sends a Clerk session token (or `dev:<email>` in dev mode);
  `src/lib/server/auth.ts` verifies it and loads the user's role and ban status
  from the database on every request.
- **API:** `GET /api/stays?<filters>`, `GET /api/stays/:slug`, `GET /api/meta`,
  `GET /api/policies` (public, approved stays only); `GET /api/me`,
  `GET|POST /api/bookings`, `GET|DELETE /api/bookings/:id`, `POST /api/reports`
  (signed in, not banned).

### Deploying

Both apps need a Node server and the same persistent `DATA_DIR`, so run them on
one machine or volume (or move the data layer to Postgres; see the production
doc). Set the Clerk keys in both. For iOS/Android release builds, set
`EXPO_PUBLIC_API_URL` to the guest app's server.

## Browser demo

`node scripts/build-demo.mjs` builds a version that runs entirely in the browser
into `demo-site/`. It answers the API in the page (`src/lib/demo/server.ts`) with
the same search, pricing and refund code; sign-in takes any email, and bookings
and reports stay in that browser. The admin dashboard isn't part of the demo.

## Limits

- Payment is simulated. Saved stays (hearts) last only for the session.
- Photos are added in the admin dashboard (upload or URL).
- SQLite on one disk suits one machine; see the production doc for scaling.
