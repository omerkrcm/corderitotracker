-- Household Calorie & Protein Tracker — initial schema
-- Two-user household app. No auth system: all access is mediated by the
-- Next.js server (service role key), which validates user_id on every
-- write. Row Level Security is left off since the app never talks to
-- Supabase directly from the browser with the anon key.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Seed the two household members. Rename these rows in the Supabase
-- table editor (or via SQL) once you know the display names you want —
-- the rows' ids are what iOS Shortcuts and the app's local storage
-- actually reference, so renaming later is safe.
insert into users (name) values ('Omer'), ('Wife')
  on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- foods — shared library of reusable per-portion food items
-- ---------------------------------------------------------------------
create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kcal_per_portion numeric not null check (kcal_per_portion >= 0),
  protein_per_portion numeric not null check (protein_per_portion >= 0),
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists foods_name_idx on foods (lower(name));

-- ---------------------------------------------------------------------
-- log_entries — either references a food (quantity multiplier) or
-- carries its own kcal/protein directly for one-off "quick log" items.
-- ---------------------------------------------------------------------
create table if not exists log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  -- Restrict (not set null): a food row backs its log entries' math, so
  -- deleting a food that's been logged would either corrupt history or
  -- violate the shape check below. The API blocks deletion with a clear
  -- error instead; deleting is only possible once nothing references it.
  food_id uuid references foods(id) on delete restrict,
  date date not null,
  time time not null default current_time,
  quantity numeric check (quantity > 0),
  kcal numeric check (kcal >= 0),
  protein numeric check (protein >= 0),
  created_at timestamptz not null default now(),
  constraint log_entries_shape check (
    (food_id is not null and quantity is not null and kcal is null and protein is null)
    or
    (food_id is null and quantity is null and kcal is not null and protein is not null)
  )
);

create index if not exists log_entries_user_date_idx on log_entries (user_id, date);

-- ---------------------------------------------------------------------
-- weight_logs — manual daily weight entries
-- ---------------------------------------------------------------------
create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  date date not null,
  weight numeric not null check (weight > 0),
  created_at timestamptz not null default now()
);

create index if not exists weight_logs_user_date_idx on weight_logs (user_id, date);

-- ---------------------------------------------------------------------
-- targets — one editable row per user
-- ---------------------------------------------------------------------
create table if not exists targets (
  user_id uuid primary key references users(id) on delete cascade,
  target_kcal numeric not null default 2000 check (target_kcal >= 0),
  target_protein numeric not null default 100 check (target_protein >= 0),
  updated_at timestamptz not null default now()
);

-- Give both seeded users a default target row so the dashboard has
-- something to compare against before anyone edits it in Settings.
insert into targets (user_id, target_kcal, target_protein)
  select id, 2000, 100 from users
  on conflict (user_id) do nothing;
