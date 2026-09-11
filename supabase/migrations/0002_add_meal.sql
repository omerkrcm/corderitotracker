-- Break log entries down by meal (breakfast/lunch/dinner/snack).
-- Existing rows backfill to 'snack' since we don't know which meal they
-- were; the default also covers any write path that doesn't send one
-- (e.g. an iOS Shortcut built before this column existed).
alter table log_entries
  add column if not exists meal text not null default 'snack'
  check (meal in ('breakfast', 'lunch', 'dinner', 'snack'));
