-- Seed reference data — the 30 countries + continents and 7 age ranges from README.md.
-- Safe to re-run (ON CONFLICT DO NOTHING).

INSERT INTO countries (name, continent) VALUES
  ('Philippines','Asia'), ('Thailand','Asia'), ('Vietnam','Asia'), ('UAE','Asia'),
  ('India','Asia'), ('Singapore','Asia'), ('Japan','Asia'), ('South Korea','Asia'),
  ('Iceland','Europe'), ('Denmark','Europe'), ('Finland','Europe'), ('Netherlands','Europe'),
  ('Portugal','Europe'), ('Spain','Europe'), ('Italy','Europe'), ('Germany','Europe'),
  ('UK','Europe'), ('France','Europe'), ('Poland','Europe'), ('Turkey','Europe'),
  ('Costa Rica','Americas'), ('Mexico','Americas'), ('Canada','Americas'), ('Brazil','Americas'), ('USA','Americas'),
  ('Australia','Oceania'), ('New Zealand','Oceania'),
  ('Nigeria','Africa'), ('South Africa','Africa'), ('Egypt','Africa')
ON CONFLICT (name) DO NOTHING;

INSERT INTO age_ranges (code, sort_order) VALUES
  ('13-17', 1), ('18-24', 2), ('25-34', 3), ('35-44', 4), ('45-54', 5), ('55-64', 6), ('65+', 7)
ON CONFLICT (code) DO NOTHING;
