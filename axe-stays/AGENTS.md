# Axe Stays

Expo React Native rental app (web, iOS, Android). Guests browse stays, search with a sentence ("pet friendly cabin with a hot tub under $300") or the full filter sheet, and ask policy questions answered with exact text from the platform's own content. A password-protected admin adds, edits and deletes listings. Everything runs locally: no accounts, keys or outside services.

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

- **Data:** `data/db.json` (gitignored), created from `data/seed.json` on first write; delete it to reset. Shapes are `StayRecord`, `HostRecord` and `PlatformPolicy` in `src/lib/stays.ts`. Everything guests filter on is a typed field; descriptive text (`facts`, `vibes`, `summary`, `description`, `highlights`) lives on the stay. Stays reference a host by `hostSlug` and a cancellation tier by `cancellationPolicySlug`. `src/lib/server/store.ts` reads the file per request and writes through one queue with an atomic rename. `DATA_DIR` moves db.json and `uploads/`.
- **API routes** (`src/app/api/`, server code in `src/lib/server/`, imported only by `+api.ts` files): `GET /api/stays?<filters>` (search; `view=home` for Home cards, `limit=0` for a count), `GET /api/stays/:slug` (details with host and policies), `GET /api/meta` (filter options and known places), `GET /api/policies`. Views (`stay-views.ts`) size Sanity CDN photos and make uploaded photo URLs absolute with the request origin.
- **Admin:** `POST /api/admin/login` checks `ADMIN_PASSWORD` (server env, 8+ chars) and returns an HMAC-signed token valid for 7 days (`admin-auth.ts`). Every `/api/admin/*` route calls `requireAdmin` first. `GET|POST /api/admin/stays`, `GET|PUT|DELETE /api/admin/stays/:id`, `POST /api/admin/uploads` (raw image body, type from magic bytes, 8 MB max, served by `GET /api/uploads/:name`). Input is validated with zod (`stay-input.ts`) and errors come back as `{ error, fields }` keyed by path, which the form shows per field. Slugs are made from the title once and never change. The app keeps the token in SecureStore (native) or localStorage (web) (`src/lib/admin-token*.ts`); a 401 signs the admin out. Screens: `/admin` (sign-in or list) and `/admin/stays/[id]` (`new` to add).
- **Search:** one filter model, `StayFilters` (`src/lib/search/filters.ts`), shared by the app, the URL params (`filtersToParams` / `filtersFromParams`, which drops anything off-list or out of range) and the server (`stay-search.ts`). A typed sentence is read in code by `parse.ts` (`filtersFromSentence`) against the known places from `/api/meta`. Leftover words become keywords: with any filter set they only rank; alone they must match at least one word in the stay's text. Vibes filter only when picked in the sheet. Filters are exact checks; "Best match" ranks by keyword and vibe hits, then rating.
- **Answer text:** none generated. Ask answers locally with the keyword topics in `src/lib/ask.ts`, showing the stay's own fields and policy text word for word with their source. House rules are lines built in code from typed fields (`src/lib/stay-details.ts`). Policy bodies render through `PolicyBody`.

## Rules

- `ADMIN_PASSWORD` is server only: never behind `EXPO_PUBLIC_`. Never commit `.env` or `.env.local`. Keep variable names, without values, in `.env.example`.
- Every admin route validates its input on the server, whatever the form checked.
- Prices, guest counts and places are parsed in code, never guessed.
- API routes need `web.output: "server"` in `app.json`. In dev, relative `fetch("/api/...")` hits the dev server; native release builds need `EXPO_PUBLIC_API_URL`. The dev server re-evaluates API route modules per request, so state that must persist lives in the file or on `globalThis`. Server logs never include what guests type or the admin password.
- When the admin changes a stay, `staysChanged()` (`src/lib/api.ts`) clears the app's cached lists.
- Ask before adding a dependency or service, changing the stored data shape, or deleting data. Prefer Expo modules over third-party libraries.
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
- Labelled two-line fields use `TextField label`. Admin form pieces (`FormSection`, `Field`, `TextArea`, `Row`, `InlineField`) live in `src/components/admin/form-fields.tsx`.
- Primitives live in `src/components/ui/` and take `className` (layout only) and `style` (merged last). Promote other views there only once two screens use them. Native controls (Switch) stay native and get colors through `styled` mappings.
- Routes: `(app)` is the tab group (Home, Search, Trips, Profile): `NativeTabs` on iOS/Android, a plain bottom `Tabs` bar on web (`_layout.web.tsx`, since native tabs float over the page in a browser). `index.tsx` redirects to `/home`. Stays, Ask, Book, account topics and admin screens are pushed over the tabs from the root `Stack`. The splash waits only for fonts. The design-system preview lives at `/design-system`.
- Web-only variants use `.web.tsx`/`.web.ts`: the sort menu (an overlay popover), `Toggle` (react-native-web can't take the native color mapping), the admin token store and the image picker.
- Motion follows the expo-animation skill: tab switches never animate; pressables use `PressableScale` (0.97, 120 ms); curves and durations come from `src/theme/motion.ts` (never ease-in); layout animation builders live at module scope with a `reduceMotion` setting. `expo-haptics` fires once per action, never as the only feedback.
- Single-line `TextInput`s take only `text-input` (no line height); any other `text-*` class wraps them on iOS.
- Stays open at `/stay/[slug]` from Home and Search cards. It's pushed over the tabs (so are its `ask` chat and `book`), and `policies` (`?section=<policy kind>` scrolls to it) is a form sheet with fixed detents (`fitToContents` leaves the sheet bottom see-through on iOS 26). The host shows inline ("Meet your host", `HostSection`). "Book this stay" opens `book`, a placeholder trip summary (stay, dates/guests "Coming soon", `priceLines`, cancellation) with "Confirm and pay" disabled until booking exists. Until dates exist, the total is `price × minNights + cleaningFee`.
- Data hooks key their state by request and never treat a module-cache read in render as the source of truth (the React Compiler memoizes it). Each exposes `refresh()`, `refreshing` and `refreshError`.
- Screen states: empty and error use `EmptyState` (ui); load errors go through `LoadError` (`src/components/load-error.tsx`), worded by cause (can't connect vs something went wrong). Loading uses pulsing `Skeleton` (CSS animation, static with Reduce Motion) shaped like the content; small cached screens use `Spinner`. Home, Search and stay details pull to refresh with `RefreshControl`; a failed refresh keeps the content and shows a dismissible danger `Alert`. Search shows "Finding stays…" on a first load and "Updating…" while newer results load over older ones.
- Profile has no account behind it: "<brand> guest", Trips 0, Saved is the session favorites count, Rating "New". Its Hosting group opens `/admin` ("Manage listings") and `/admin/stays/new`. Payments, Notifications and Help are `/account/[topic]` Coming soon screens. The policy card quotes the guest refund policy and opens `/policies`.
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
