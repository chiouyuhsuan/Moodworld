import type { Pool } from "pg";

// Pure string arithmetic on YYYY-MM-DD — never touches Date objects/timezones,
// so it can't drift from how the dates were produced.
function shiftDateStr(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

// Walks backward from `asOf` (inclusive) counting unbroken consecutive
// dates in `voteDates`. `asOf` and every entry in `voteDates` must already be
// the user's own local calendar date (i.e. straight from `votes.vote_date`,
// never `created_at`) — that's the same value the one-vote-per-day
// UNIQUE(fingerprint, vote_date) constraint uses, so a streak computed this
// way can never disagree with "did I already vote today" by construction.
export function computeStreak(voteDates: string[], asOf: string): number {
  const set = new Set(voteDates);
  let streak = 0;
  let cursor = asOf;
  while (set.has(cursor)) {
    streak++;
    cursor = shiftDateStr(cursor, -1);
  }
  return streak;
}

// 400 days is comfortably more than a year of daily check-ins and keeps this
// query cheap and bounded regardless of how long a device has been voting.
export async function getStreak(pool: Pool, fingerprint: string, asOf: string): Promise<number> {
  const res = await pool.query<{ d: string }>(
    `SELECT vote_date::text AS d FROM votes WHERE fingerprint = $1 ORDER BY vote_date DESC LIMIT 400`,
    [fingerprint]
  );
  return computeStreak(res.rows.map((r) => r.d), asOf);
}
