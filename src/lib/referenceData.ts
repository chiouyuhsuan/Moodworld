// Reference data (countries → continent, age ranges) — ported from README.md /
// API_AND_SCHEMA.md. Mirrors what's seeded into the `countries` / `age_ranges`
// tables (db/seed.sql). Kept here too so the client can render selects/labels
// without a round trip.

export const CONTINENTS = ["Asia", "Europe", "Americas", "Oceania", "Africa"] as const;
export type Continent = (typeof CONTINENTS)[number];

export const COUNTRY_CONTINENT: Record<string, Continent> = {
  Iceland: "Europe",
  Denmark: "Europe",
  Finland: "Europe",
  Netherlands: "Europe",
  Portugal: "Europe",
  Spain: "Europe",
  Italy: "Europe",
  Germany: "Europe",
  UK: "Europe",
  France: "Europe",
  Poland: "Europe",
  Turkey: "Europe",
  "Costa Rica": "Americas",
  Mexico: "Americas",
  Canada: "Americas",
  Brazil: "Americas",
  USA: "Americas",
  Australia: "Oceania",
  "New Zealand": "Oceania",
  Philippines: "Asia",
  Thailand: "Asia",
  Vietnam: "Asia",
  UAE: "Asia",
  India: "Asia",
  Singapore: "Asia",
  Japan: "Asia",
  "South Korea": "Asia",
  Nigeria: "Africa",
  "South Africa": "Africa",
  Egypt: "Africa",
};

export const COUNTRY_NAMES: string[] = Object.keys(COUNTRY_CONTINENT).sort();

export const AGE_RANGES: string[] = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

// Display form uses an en-dash per the design ("13–17"); API/DB use a plain
// hyphen (matches API_AND_SCHEMA.md examples & is friendlier as a URL/JSON value).
export function ageRangeDisplay(code: string): string {
  return code === "65+" ? "65+" : code.replace("-", "–");
}
