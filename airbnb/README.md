# Roam: an Airbnb-style stays app with an admin

An Expo (React Native) app for browsing and booking-style stays, with a full
filter panel and a password-protected admin for adding, editing and deleting
listings. It runs on web, iOS and Android from one codebase and needs no
outside services or API keys.

It started from JavaScript Mastery's [Roam Airbnb clone](https://github.com/jsmastery-pro/airbnb-clone).
That version used Clerk (accounts), Sanity (content), PostHog (analytics) and
an AI model for search. This version replaces them with a small local backend,
so it runs as soon as it's installed. The 30 sample stays, 12 hosts and 8
policies were exported from the original's public dataset into `data/seed.json`.

## Features

- **Home:** top-rated stays, with Cabins / Beach / City / Villas categories.
- **Search:** type a sentence like *"pet friendly cabin with a hot tub under $300"*.
  Code reads it into filters (type, amenities, pets, price, guests, place), and any
  other words rank results by keyword.
- **Every filter:** type of place, min/max price, guests, bedrooms, beds,
  bathrooms, 17 amenities, pets / smoking / parties, guest rating, Superhost,
  cancellation policy, vibe and location. Quick one-tap chips and removable
  active-filter chips sit above the results, and the filter sheet shows a live
  "Show N stays" count.
- **Sort:** best match, price (both ways), top rated, newest.
- **Stay details:** photo gallery, amenities, house rules, host, policies,
  "Ask about this stay" (answers quoted from the stay's own rules and Roam's
  policies) and a booking summary.
- **Admin (`/admin`, or Profile → Manage listings):** sign in with a password,
  then search, add, edit and delete listings. The form covers every field: basics,
  host (pick one or add a new one), location, rooms, amenities, price, house rules,
  cancellation tier, description, vibes and photos (by URL on any platform, or
  uploaded from the browser on web). The server validates every field and the
  form shows each error next to its field. Changes show in the app right away.

## Run it

```bash
cd airbnb
npm install
cp .env.example .env.local      # then set ADMIN_PASSWORD (8+ characters)
npx expo start                  # press w for web, i for iOS, a for Android
```

Open the web app, go to **Profile → Manage listings** (or `/admin`) and sign in
with your `ADMIN_PASSWORD`.

| Command | What it does |
| --- | --- |
| `npx expo start` | Dev server: the app and its API routes |
| `npx tsc --noEmit` | Type check |
| `npx expo lint` | Lint |
| `npx expo export -p web && npx expo serve` | Production web build and server |

## How it works

```
app (src/app)  ──fetch──▶  API routes (src/app/api/*+api.ts)  ──▶  data/db.json
```

- **Data:** `data/db.json`, created from `data/seed.json` on the first write.
  Delete it to reset to the sample data. Uploaded photos go to `data/uploads/`.
  `DATA_DIR` moves both, e.g. onto a persistent disk in production.
- **Public API:** `GET /api/stays?<filters>` (search, filter, sort),
  `GET /api/stays/:slug`, `GET /api/meta` (filter options), `GET /api/policies`.
- **Admin API** (bearer token from `POST /api/admin/login`):
  `GET|POST /api/admin/stays`, `GET|PUT|DELETE /api/admin/stays/:id`,
  `POST /api/admin/uploads`.
- **Filters** are one shared model (`src/lib/search/filters.ts`) used by the
  app, the URL params and the server (`src/lib/server/stay-search.ts`).

### Deploying

The app needs a server for its API routes (`web.output: "server"`). Build with
`npx expo export -p web` and run it on a Node host that has a persistent disk
(set `DATA_DIR`) and `ADMIN_PASSWORD`. For iOS/Android release builds, set
`EXPO_PUBLIC_API_URL` to that server's URL. In development the app talks to
the dev server and doesn't need it.

## Limits

- One admin password, no guest accounts. Saved stays (hearts) last only for
  the session.
- Booking is a summary screen: there are no dates or payments.
- Photo upload is web-only. On iOS/Android, add photos by URL.
- The JSON file store suits one server. For many concurrent writers, move
  `src/lib/server/store.ts` to a database.
