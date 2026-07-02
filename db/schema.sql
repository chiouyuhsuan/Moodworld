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
