-- MoodWorld schema — matches API_AND_SCHEMA.md exactly.
-- Run this once against your Postgres instance (Supabase SQL editor, or `npm run db:migrate`).

CREATE TABLE IF NOT EXISTS countries (
  name        TEXT PRIMARY KEY,
  continent   TEXT NOT NULL      -- Asia | Europe | Americas | Oceania | Africa
);

CREATE TABLE IF NOT EXISTS age_ranges (
  code        TEXT PRIMARY KEY,  -- '13-17','18-24','25-34','35-44','45-54','55-64','65+'
  sort_order  SMALLINT NOT NULL
);

-- one row per check-in ---------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  vote_date     DATE        NOT NULL,              -- user's local date
  mood          SMALLINT    NOT NULL CHECK (mood BETWEEN 1 AND 7),
  country       TEXT        NOT NULL REFERENCES countries(name),
  city          TEXT,                              -- optional free text
  age_range     TEXT        NOT NULL REFERENCES age_ranges(code),
  fingerprint   TEXT        NOT NULL,              -- best-effort device id
  -- soft one-vote-per-day:
  UNIQUE (fingerprint, vote_date)
);
CREATE INDEX IF NOT EXISTS votes_vote_date_idx ON votes (vote_date);
CREATE INDEX IF NOT EXISTS votes_vote_date_country_idx ON votes (vote_date, country);
CREATE INDEX IF NOT EXISTS votes_vote_date_age_idx ON votes (vote_date, age_range);

-- give / ads -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_events (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_date    DATE        NOT NULL,
  fingerprint   TEXT        NOT NULL,
  ad_network    TEXT,
  reward_amount NUMERIC(10,4) NOT NULL DEFAULT 0.02  -- ad revenue per view (config)
);
CREATE INDEX IF NOT EXISTS ad_events_event_date_idx ON ad_events (event_date);
CREATE INDEX IF NOT EXISTS ad_events_fingerprint_idx ON ad_events (fingerprint);

-- monthly donation/payout accounting (published for transparency) --------
CREATE TABLE IF NOT EXISTS payouts (
  month         TEXT PRIMARY KEY,        -- 'YYYY-MM'
  gross_revenue NUMERIC(12,2) NOT NULL,
  operating_cost NUMERIC(12,2) NOT NULL,
  donated       NUMERIC(12,2) NOT NULL,
  recipient     TEXT
);

-- notes: short anonymous messages randomly shown to whoever votes next.
-- Two tracks:
--   'internal' — curated by us, status='approved' from the start (seeded in
--                db/notes_seed.sql so the feature isn't empty on day one).
--   'user'     — submitted by real people after voting. Always starts
--                status='pending' and is NEVER shown to anyone (not even in
--                the random pool) until a human manually flips it to
--                'approved' — a deliberate D+1-ish review step while volume
--                is small enough to review by hand (see NOTES_FEATURE.md).
-- fingerprint/vote_date are NULL for internal seed rows; Postgres treats
-- NULL as distinct in UNIQUE constraints, so many internal rows can coexist
-- while still enforcing "one submitted note per person per day" for users.
CREATE TABLE IF NOT EXISTS notes (
  id                BIGSERIAL   PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  text              TEXT        NOT NULL,
  source            TEXT        NOT NULL DEFAULT 'user',    -- 'internal' | 'user'
  status            TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  approved_at       TIMESTAMPTZ,
  fingerprint       TEXT,                                   -- submitter's device id (null for internal notes)
  vote_date         DATE,                                   -- day submitted (null for internal notes)
  country           TEXT,                                   -- submitter's country, if any
  mood              SMALLINT    CHECK (mood IS NULL OR mood BETWEEN 1 AND 7),
  inspiring_count   SMALLINT    NOT NULL DEFAULT 0,
  not_helpful_count SMALLINT    NOT NULL DEFAULT 0,
  UNIQUE (fingerprint, vote_date)
);
CREATE INDEX IF NOT EXISTS notes_status_idx ON notes (status);
CREATE INDEX IF NOT EXISTS notes_inspiring_idx ON notes (inspiring_count DESC);

-- one reaction per person per note (👍 It's inspiring / Not helpful):
CREATE TABLE IF NOT EXISTS note_reactions (
  note_id       BIGINT      NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  fingerprint   TEXT        NOT NULL,
  reaction      TEXT        NOT NULL,  -- 'inspiring' | 'not_helpful'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, fingerprint)
);

-- check-in giving: every 7th cumulative check-in (streak cycle complete,
-- see src/lib/streak.ts) pledges 1 TWD. One row per pledge event — an
-- honest, uncapped ledger. The site-wide monthly 3000 TWD cap is applied
-- only when *reading* totals (getCheckinGivingSummary), never at insert
-- time, so the ledger always reflects real cycle-completions even past
-- what actually gets donated that month. Real payout is manual (no payment
-- integration), same model as ad_events/payouts.
CREATE TABLE IF NOT EXISTS checkin_donations (
  id            BIGSERIAL   PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  credit_month  TEXT        NOT NULL,              -- 'YYYY-MM', from the completing vote's local vote_date
  fingerprint   TEXT        NOT NULL,
  vote_id       BIGINT      REFERENCES votes(id) ON DELETE SET NULL,
  amount        NUMERIC(10,2) NOT NULL DEFAULT 1.00
);
CREATE INDEX IF NOT EXISTS checkin_donations_month_idx ON checkin_donations (credit_month);
CREATE INDEX IF NOT EXISTS checkin_donations_fingerprint_idx ON checkin_donations (fingerprint);
