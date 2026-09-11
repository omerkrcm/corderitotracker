@AGENTS.md

# Project: Household Calorie & Protein Tracker

## What this is
A Cronometer-like calorie/protein tracking web app, built for exactly two
users (me and my wife) to share. No pre-filled food database — all food
items are created by us. Prioritize simplicity and reliability over
features; this is a personal household tool, not a product.

## Platform decisions (already made — don't revisit)
- **Web app / PWA only.** No native iOS app. Distribution is "open in
  Safari → Add to Home Screen." This was a deliberate choice after
  evaluating SideStore (rejected: requires Xcode, 7-day cert expiry,
  unreliable background VPN refresh) and the App Store (rejected:
  unnecessary overhead for a 2-person app).
- **Hosting: Vercel** (frontend). Free tier is sufficient for 2 users.
- **Backend/DB: Supabase** (Postgres + simple data access). Free tier is
  sufficient for 2 users.
- **Domain:** starting on the free `*.vercel.app` subdomain. A custom
  domain may be added later — not a blocker for v1.
- **No HealthKit / Apple Health integration** — not possible from a PWA
  (HealthKit is native-iOS-only). Weight is logged manually in-app.
  (Possible future workaround: an iOS Shortcut that reads Health data
  and POSTs it to our API on a schedule — not in scope for v1.)

## Auth model (deliberately minimal)
- **No real per-user accounts/login system.** Two of us, low stakes data.
- App may sit behind a single shared password (or none).
- On entering the app, a simple profile picker: "Who's logging?
  [Omer] [Wife]" — selecting one sets the active user for that session
  (client-side, e.g. stored in local storage). Switching profiles mid-session
  should be one tap, so either of us can log for the other when needed
  (e.g. one of us handling logging for both after a shared meal).
- **iOS Shortcuts integration:** each of us will have a personal Shortcut
  that calls the logging API directly with a hardcoded `user_id` baked
  into the Shortcut config — this bypasses the in-app profile picker
  entirely, so a Shortcut always logs to the correct person regardless of
  whatever profile is currently selected in the app. The API endpoint
  should validate/require `user_id` on every request and reject or flag
  requests where it's missing or invalid.

## Data model (core concept)
Food items store **per-portion** values. Log entries reference a food and
a **quantity multiplier**, not a duplicated food record.

- `users`: id, name (just the two of us — can be hardcoded/seeded, not a
  signup flow)
- `foods` (shared across both users, not owned by one):
  - id, name, kcal_per_portion, protein_per_portion
  - created_by (optional, informational only — not used for permissions)
- `log_entries`:
  - id, user_id, food_id (nullable), date, time
  - quantity (e.g. 1.5) — multiplied against the food's per-portion values
    at display/calculation time
  - For **quick log** / one-off items not worth saving to `foods`:
    food_id is null and the entry carries its own `kcal` / `protein`
    directly instead.
  - meal: one of breakfast/lunch/dinner/snack. Defaults to "snack" if not
    given (e.g. an older Shortcut payload); the dashboard groups the day's
    entries under these four headings, in that fixed order.
- `weight_logs`: id, user_id, date, weight (manual entry)
- `targets`: user_id, target_kcal, target_protein (editable per user)

Example: "Anne's kısır" is created once as 1 portion = 300 kcal / 10g
protein. Either user can later log it at any quantity (e.g. 1.5) without
creating a new food — the app computes 450 kcal / 15g protein at log time.

## Implementation status
- Next.js App Router + TypeScript + Tailwind, Supabase Postgres via a
  server-only client (service role key) — see `README.md` for the full
  setup path and `supabase/migrations/` for the schema (applied in order).
- Pages: `/` (dashboard), `/foods`, `/log`, `/weight`, `/settings`
  (targets + each profile's Shortcuts user ID).
- API routes under `src/app/api/**` are the single source of truth for
  data access; `src/lib/api-helpers.ts` validates `user_id` on every
  write, which is also what the iOS Shortcuts integration hits directly.
- PWA manifest + icons are in place for Add to Home Screen; no offline
  support / service worker yet (see open questions below).
- Warm/colorful design system with automatic light/dark mode
  (`src/app/globals.css`, follows the phone's system setting).
- Dashboard: day-by-day navigation (prev/next arrows, capped at today),
  a "This week" mini bar chart of calories/protein vs. target, and the
  day's entries grouped under Breakfast/Lunch/Dinner/Snack.
- `/log` supports backdating (date picker capped at today) and a meal
  picker; logging from a past day's dashboard view carries that date
  through automatically.

## Not decided yet / open questions
- Whether to add offline support or push notifications to the PWA later
- Whether a custom domain gets purchased later
- Whether to add the optional shared-password gate

## Working style notes
- I (Omer) have a capital-markets background, comfortable with Python
  and scripting, but this is my first time building a full web app —
  explain infrastructure/deployment steps rather than assuming I know
  them, but no need to over-explain basic programming concepts.
