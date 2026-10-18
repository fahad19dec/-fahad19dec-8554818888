# Axe Stays

Expo React Native rental app (web, iOS, Android). Guests browse stays, search with a sentence ("pet friendly cabin with a hot tub under $300") or the full filter sheet, book with a simulated payment, manage trips, report listings, and ask policy questions answered with exact text from the platform's own content. Listings, users, bookings and reports are managed in the Next.js admin dashboard in `../admin`, which shares this app's database and data layer.

This file is the project's memory: it holds every decision that is still true.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm install: resolves SDK-compatible versions
npx expo start              # dev server (press i for the iOS simulator)
npx expo lint               # lint
npx tsc --noEmit            # type check
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
npx eas-cli@latest <cmd>    # EAS builds, submits, and updates (use instead of bare `eas`)
```

## Expo

- Expo ships breaking changes every SDK release, so don't trust memory. Before touching an Expo, EAS, or React Native API, check the `expo` major version in `package.json` and read `https://docs.expo.dev/versions/v<major>.0.0/`. For anything else, start from https://docs.expo.dev/llms.txt and follow its links.
- Routes live in `src/app/`: every file is a screen and `_layout.tsx` files define navigators. API routes are `src/app/api/*+api.ts`. Keep components, hooks, and utils outside `src/app/`.
- `ios/` and `android/` are generated. Never create or edit them by hand; configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, switch to a development build (`npx expo run:ios`).
- Styling is NativeWind v5 (`className`) on Tailwind v4, configured CSS-first in `src/global.css` (imported once in `src/app/_layout.tsx`). Docs: https://www.nativewind.dev/v5/llms-full.txt. Keep `nativewind` and `react-native-css` pinned as a matching RC pair, and `tailwindcss`, `@tailwindcss/postcss`, and `lightningcss` (plus its `overrides` entry) pinned exactly. Metro's `withNativewind` does the transform, so there is no `babel.config.js`. Use `useColorScheme` from `react-native`, not `nativewind`.

## Who owns what

- **Database:** SQLite at `DATA_DIR/axe-stays.sqlite` via Node's built-in `node:sqlite` (Node 22.13+), loaded with `process.getBuiltinModule` so bundlers never resolve it. WAL + busy timeout so this app's API routes and the admin dashboard share it. `src/lib/db/` is the only code that touches it: `database.ts` (connection on `globalThis`, `transaction`), `migrations.ts` (append-only, `PRAGMA user_version`), `seed.ts` (first run: `data/seed.json` or a legacy `data/db.json`; sample activity outside production unless `SEED_SAMPLE_ACTIVITY=0`), and repositories for stays, users, bookings, reports, audit and analytics. A stay's record is JSON in `stays.data`; `status` (pending/approved/rejected) is a column. Guests only ever see approved stays.
- **Shared with the admin:** `src/lib/db/`, `src/lib/booking/pricing.ts`, `src/lib/server/stay-input.ts`, `stay-search.ts`, `stay-views.ts`, `src/lib/search/filters.ts`/`parse.ts`, `src/lib/stays.ts`, `src/lib/report-reasons.ts` and `src/brand.ts`. These use relative imports only (no `@/`), because the admin imports them through its own `@core/*` alias.
- **Auth:** Clerk (`@clerk/expo` in the app, `@clerk/backend` `verifyToken` in `src/lib/server/auth.ts`); the app sends `getToken()` as a bearer token. Dev sign-in (`AUTH_MODE=dev` on the server, `EXPO_PUBLIC_AUTH_MODE=dev` in the app, refused when `NODE_ENV=production`) sends `dev:<email>`. Either way the user row (created on first request) decides: `requireUser(request, roles?)` refuses missing (401), banned (403 `account_suspended`) or wrong-role (403) users. `ADMIN_EMAILS` promotes listed emails on first sign-in. `src/lib/session.tsx` gives screens `useSession()` (`isSignedIn`, `getToken`, `account` from `GET /api/me`, refreshed on foreground) and `useAuthedApi()`. Sign-in screens are the `(auth)` group, shown as a modal and closed by the `Stack.Protected` guard once signed in.
- **Admin rules live in the data layer too:** every admin mutation (`createStay`, `updateStay`, `setListingStatus`, `deleteStay`, `banUser`, `unbanUser`, `setRole`, `closeReport`, admin `cancelBooking`) re-reads the actor with `assertAdmin` and writes an `audit_log` row. Never add an admin write that skips this.
- **Bookings:** `createBooking` validates with `quoteProblems`, prices with `quote` and checks overlaps inside a write transaction. Payment is simulated (`sim_` reference). Guests cancel under the stay's tier (`guestRefund`); admins choose full or policy refund. Money is integer cents. Check-in times are read as UTC until stays have a time zone.
- **API routes** (`src/app/api/`, server code in `src/lib/server/` and `src/lib/db/`, imported only by `+api.ts` files): public `GET /api/stays?<filters>` (`view=home`, `limit=0` for a count), `GET /api/stays/:slug` (details, host, policies, `booked` ranges), `GET /api/meta`, `GET /api/policies`; signed-in `GET /api/me`, `GET|POST /api/bookings`, `GET|DELETE /api/bookings/:id` (others' bookings are 404), `POST /api/reports`; `GET /api/uploads/:name` serves photos the admin uploaded to `DATA_DIR/uploads`.
- **Search:** one filter model, `StayFilters` (`src/lib/search/filters.ts`), shared by the app, the URL params (`filtersToParams` / `filtersFromParams`, which drops anything off-list or out of range) and the server (`stay-search.ts`). A typed sentence is read in code by `parse.ts` (`filtersFromSentence`) against the known places from `/api/meta`. Leftover words become keywords: with any filter set they only rank; alone they must match at least one word in the stay's text. Vibes filter only when picked in the sheet.
- **Answer text:** none generated. Ask answers locally with the keyword topics in `src/lib/ask.ts`, showing the stay's own fields and policy text word for word with their source.

## Rules

- Secrets (`CLERK_SECRET_KEY`) are server only: never behind `EXPO_PUBLIC_`. Never commit `.env` or `.env.local`. Keep variable names, without values, in `.env.example` (this app's and `../admin`'s).
- Every protected route calls `requireUser` first; every admin write goes through the data layer's `assertAdmin`. Roles and bans are read from the database per request, never from the client or the token.
- Prices, guest counts, dates and places are parsed and checked in code; the server re-prices every booking.
- API routes need `web.output: "server"` in `app.json`. In dev, relative `fetch("/api/...")` hits the dev server; native release builds need `EXPO_PUBLIC_API_URL`. Server logs never include what guests type.
- Lists refetch on focus once older than `STALE_MS` (15 s), so admin changes appear without a manual refresh; this app's own changes call `staysChanged()`.
- Ask before adding a dependency or service, changing the stored data shape (add a migration), or deleting data. Prefer Expo modules over third-party libraries.
- Whenever you need input from the user, ask through your tool's built-in question panel so they pick from options instead of typing. Give two to four clear options with the recommended one first.

## How we build features

For a new feature or a change across several files. Small fixes and questions skip this.

1. **Understand.** Read the code involved and the current docs pages for the APIs you'll use. Don't write version-specific APIs from memory.
2. **Ask.** If a real decision is unclear (scope, visible behavior, data shape), ask in the question panel, batching questions into one round. Pick defaults for the rest and list them. If a decision in this file looks wrong, raise it instead of changing it.
3. **Build** step by step, checking each one. If a step turns out wrong, stop and explain instead of redesigning.
4. **Close out.** Run lint, type check and the app on web, give the report described under Reporting, and update this file: replace or remove rules that are no longer true instead of appending. Keep it under 150 lines.

## Building from designs

Designs are attached in the chat. Screens must match them exactly: layout, spacing, sizes, colors, type, radii, icons, and copy.

- Icons, fonts, and brand images come from `assets/` or the chosen icon library, never recreated from a screenshot. Sample property photos may be remote placeholder images. If an asset is missing, use a marked placeholder and list it.
- Map every color, font, spacing value, and radius to a design-system token. List values with no token in the plan as proposed new tokens instead of hardcoding them. When creating the design system itself, derive the tokens from the designs.
- UI plans describe the design (elements, states, tokens, assets) well enough to build without the image. If building in a new session, ask for the design to be attached again.
- After building, open the screen (web, or the iOS simulator with `xcrun simctl openurl booted axestays://<route>`), take a screenshot and compare it with the design. List every difference, fix, and repeat.

## Design system

- **Brand:** `brand.config.js` is the only place for the name, copy, logo, colors and app IDs. `metro.config.js` turns its colors into `src/theme/brand.generated.css` (gitignored, never edited) on every start; `app.config.ts` reads the name, slug, scheme, `appId` and icon color; app code reads `brand` from `src/brand.ts`. Never write the brand name in code or copy: use `brand.name`, and `{{brand}}` in stored text (sample policies), filled in by `policyView`. Icons are drawn by `python3 scripts/brand-icons.py`. Color tokens are named by role (primary, secondary, accent, ink, surface…), never by hue.
- Other tokens live only in `src/global.css` `@theme` (4px `--spacing`, fonts, `--text-*` ramp, radius, shadows); Tailwind's default palette, ramp, radii and shadows are cleared. JS-only values (motion) live in `src/theme/`. No hex, font size, or arbitrary `[..]` class outside `brand.config.js` and `global.css`. Read `brand.colors` in code only where a component takes a color value (the SVG logo, web icon tints).
- `--text-*--line-height` must be a unitless ratio: NativeWind multiplies it by the font size, so `px` values break layout.
- Text goes through `<Text variant tone>` and icons through `<Icon name tone>` (expo-symbols, names registered in `src/components/ui/icons.ts`). Color is a `tone` prop, never a second `text-*` class, because conflicting classes resolve by CSS order.
- Font is Plus Jakarta Sans (static TTFs in `assets/fonts/`), loaded with `useFonts` in the root layout behind the splash screen. Switch to the `expo-font` config plugin once the app runs on a development build. Weight comes from the family (`font-jakarta-bold`), never from `font-bold`.
- Light mode only (`userInterfaceStyle: "light"`). Add dark values as `prefers-color-scheme` overrides of the same tokens.
- Labelled two-line fields use `TextField label`. The booking calendar is `src/components/booking/date-range-calendar.tsx` (dates as UTC `YYYY-MM-DD`, booked nights blocked).
- Primitives live in `src/components/ui/` and take `className` (layout only) and `style` (merged last). Promote other views there only once two screens use them. Native controls (Switch) stay native and get colors through `styled` mappings.
- Routes: `(app)` is the tab group (Home, Search, Trips, Profile): `NativeTabs` on iOS/Android, a plain bottom `Tabs` bar on web (`_layout.web.tsx`, since native tabs float over the page in a browser). `index.tsx` redirects to `/home`. Stays, Ask, Book, `trips/[id]` and account topics are pushed over the tabs from the root `Stack`; `policies`, `stay/[slug]/policies` and `stay/[slug]/report` are form sheets; `(auth)` is a modal behind `Stack.Protected guard={!isSignedIn}`. The splash waits for fonts and the session. The design-system preview lives at `/design-system`. There is no admin UI in this app.
- Web-only variants use `.web.tsx`/`.web.ts`: the sort menu (an overlay popover), `Toggle` (react-native-web can't take the native color mapping) and the dev sign-in store (`session-token.web.ts`).
- Motion follows the expo-animation skill: tab switches never animate; pressables use `PressableScale` (0.97, 120 ms); curves and durations come from `src/theme/motion.ts` (never ease-in); layout animation builders live at module scope with a `reduceMotion` setting. `expo-haptics` fires once per action, never as the only feedback.
- Single-line `TextInput`s take only `text-input` (no line height); any other `text-*` class wraps them on iOS.
- Stays open at `/stay/[slug]` from Home and Search cards. It's pushed over the tabs (so are its `ask` chat and `book`), and `policies` (`?section=<policy kind>` scrolls to it) is a form sheet with fixed detents (`fitToContents` leaves the sheet bottom see-through on iOS 26). The host shows inline ("Meet your host", `HostSection`). "Book this stay" opens `book`: calendar, guests and pets, the `quote` breakdown, and "Confirm and pay" (sign-in first when signed out), which lands on `trips/[id]` with a confirmation. Stay details end with "Report this listing".
- Data hooks key their state by request and never treat a module-cache read in render as the source of truth (the React Compiler memoizes it). Each exposes `refresh()`, `refreshing` and `refreshError`.
- Screen states: empty and error use `EmptyState` (ui); load errors go through `LoadError` (`src/components/load-error.tsx`), worded by cause (can't connect vs something went wrong). Loading uses pulsing `Skeleton` (CSS animation, static with Reduce Motion) shaped like the content; small cached screens use `Spinner`. Home, Search and stay details pull to refresh with `RefreshControl`; a failed refresh keeps the content and shows a dismissible danger `Alert`. Search shows "Finding stays…" on a first load and "Updating…" while newer results load over older ones.
- Profile shows the signed-in account (name, photo), a suspended-account alert when banned, Trips (confirmed bookings) and Saved counts, and Sign out; signed out, it offers sign-in. Payments, Notifications and Help are `/account/[topic]` Coming soon screens. The policy card quotes the guest refund policy and opens `/policies`.
- Stays with no ratings show "New" (`ratingLabel`), never "0.0".
- Plus Jakarta Sans has no emoji glyphs (iOS draws "?"), so use an `Icon` instead of emoji in text.
- Search result titles use `cardTitle`. Dropdowns use `@expo/ui`: SwiftUI `Menu` (`*.ios.tsx`) and Compose `DropdownMenu`, with an `RNHostView` label; web uses `sort-menu.web.tsx`. Search's filters live in `FilterSheet` (a `Modal`, draft until "Show N stays"), `QuickFilters` and `ActiveFilters` (`src/components/search/`). Favorites are in memory only (`src/lib/favorites.ts`) until persisted.
- Third-party views (`expo-image`, `GlassView`, `react-native-svg`) need `styled(X, { className: "style" })` before `className` works. Size a styled `expo-image` with a plain wrapper `View` and `absolute inset-0` on the image: on web a numeric `style` width breaks it and `h-full` collapses inside horizontal lists.

## Reporting

End every piece of work that changes code (features and fixes, not answers to questions) with this report. Use these headings in this order, and leave out any section that would be empty.

- **Done:** one line on the outcome, then the files changed and what changed in each.
- **Verified:** each check with ✅ or ❌ and its evidence (command output, screenshot). List what wasn't checked as ❌ with the reason. Never mark something ✅ without running it.
- **You need to:** numbered actions only the user can take, such as env values or assets to provide.
- **Test it yourself:** numbered steps to reproduce the result from a fresh start, ending with `Expected:` and what the user should see.
- **Notes:** defaults picked, trade-offs, and anything left for later.

## Checks

- Lint and type check pass before any task is called done.
- Screens that load data handle loading, error, and empty states.
- Search is tried against realistic sentences, and empty results are explained by cause: missing data, how the sentence was read, or the code.
