/*
# Create events table (single-tenant, no auth)

1. New Tables
- `events`
  - `id` (uuid, primary key)
  - `title` (text, not null) — event name
  - `description` (text) — event description
  - `city` (text) — city where the event takes place
  - `venue` (text) — venue name
  - `event_date` (date, not null) — the date the event occurs
  - `event_time` (text) — human-readable time, e.g. "8:00 PM"
  - `category` (text, not null) — concert / festival / sports / etc.
  - `artist` (text) — singer or artist name
  - `genre` (text) — musical genre
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `events`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no sign-in screen).

3. Indexes
- Index on `event_date` for fast date-based lookups.
- Index on `category`, `artist`, `genre` for fast filtering.
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  city text,
  venue text,
  event_date date NOT NULL,
  event_time text,
  category text NOT NULL,
  artist text,
  genre text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_events_date ON events (event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events (category);
CREATE INDEX IF NOT EXISTS idx_events_artist ON events (artist);
CREATE INDEX IF NOT EXISTS idx_events_genre ON events (genre);
