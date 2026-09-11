# Corderito Tracker

A Cronometer-like calorie/protein tracker built for exactly two people to
share. No pre-filled food database — you create every food item yourselves.
Web app / PWA only (open in Safari → Add to Home Screen), no native app.

Stack: **Next.js** (App Router, TypeScript, Tailwind) on **Vercel**,
**Supabase** (Postgres) for data. Both have free tiers that comfortably
cover 2 users.

## How the data model works

- `foods` stores **per-portion** values (kcal, protein).
- `log_entries` reference a food + a quantity multiplier (e.g. food ×1.5) —
  they don't duplicate the food's numbers. Or, for a one-off item not worth
  saving, a "quick log" entry carries its own kcal/protein directly and has
  no food reference.
- `weight_logs` and `targets` are simple per-user tables.

See `supabase/migrations/0001_init.sql` for the full schema.

There's no login system. Instead:

- The app has a one-tap **profile picker** ("Who's logging?") in the header.
  The chosen profile is remembered in the browser's local storage, so
  either of you can switch and log for the other after a shared meal.
- Every write endpoint (`POST /api/log-entries`, `POST /api/weight`, etc.)
  requires a `user_id` in the request body and rejects unknown ones. That's
  the whole authorization model — it's intentionally minimal for a 2-person
  household tool. See `src/lib/api-helpers.ts`.

## First-time setup

If you're new to Supabase/Vercel, here's the full path from zero to a
working app.

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and click **New
   project**. Pick any name/region; the free tier is fine.
2. Once it's provisioned, open **SQL Editor** in the left sidebar, paste in
   the contents of `supabase/migrations/0001_init.sql`, and run it. This
   creates all the tables and seeds two `users` rows named "Omer" and
   "Wife" — rename those two rows (Table Editor → `users`) to whatever
   display names you actually want; nothing else references the names, so
   this is safe to do any time.
3. Go to **Settings → API**. You'll need two values in the next step:
   - **Project URL**
   - **`service_role` secret key** (not the `anon` key — the service role
     key is what lets the server read/write the database; it must never be
     exposed to the browser, which is why it has no `NEXT_PUBLIC_` prefix).

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the two values from
above:

```bash
cp .env.local.example .env.local
```

### 3. Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the two
seeded profiles in the header — pick one, add a food on the Foods tab, then
log it.

### 4. Deploy to Vercel

1. Push this repo to GitHub (if not already).
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. In the import screen (or later under Project Settings → Environment
   Variables), add the same two variables from `.env.local`:
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy. You'll get a `*.vercel.app` URL — that's what you open in
   Safari and "Add to Home Screen" on each of your phones.

## iOS Shortcuts integration

Each of you can build a personal Shortcut that logs directly via the API,
bypassing the in-app profile picker entirely — useful for a one-tap "log
this" from the home screen or Siri.

1. Open the app, pick your profile, go to **Settings**, and copy your user
   ID (shown at the bottom of that page).
2. In the Shortcuts app, build a shortcut that makes a **Get Contents of
   URL** request:
   - URL: `https://your-app.vercel.app/api/log-entries`
   - Method: `POST`
   - Headers: `Content-Type: application/json`
   - Request body (JSON), e.g. for a food you've already saved:
     ```json
     { "user_id": "YOUR-USER-ID", "food_id": "SOME-FOOD-ID", "quantity": 1 }
     ```
     or a quick log:
     ```json
     { "user_id": "YOUR-USER-ID", "kcal": 250, "protein": 20 }
     ```
   - `date`/`time` are optional and default to "now" on the server.
3. Same idea for weight: `POST /api/log-entries` → `/api/weight` with
   `{ "user_id": "YOUR-USER-ID", "weight": 78.4 }`.

Because `user_id` is hardcoded per-Shortcut, it always logs to the correct
person no matter what profile is currently selected in the app on anyone's
phone.

## Project structure

- `src/app/` — pages (`/`, `/foods`, `/log`, `/weight`, `/settings`) and API
  routes (`src/app/api/**/route.ts`).
- `src/lib/supabase-server.ts` — server-only Supabase client (service role
  key). Never imported from a client component.
- `src/lib/api-helpers.ts` — shared `user_id` validation for API routes.
- `src/lib/profile-context.tsx` — the client-side "who's logging" state,
  persisted to local storage.
- `supabase/migrations/0001_init.sql` — full DB schema + seed data.

## Not built yet (see project CLAUDE.md for the running list)

- Offline support / push notifications for the PWA.
- A shared password gate in front of the app (optional, low priority for a
  2-person household tool).
- Custom domain (currently on the free `*.vercel.app` subdomain).
