import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { AGE_RANGES } from "@/lib/referenceData";

export const dynamic = "force-dynamic";

// GET /api/stats/ages?date=YYYY-MM-DD&scope=today|all
//
// Mirrors src/app/api/stats/global/route.ts: scope=today (default) filters
// to that one date, same as the original behavior. scope=all aggregates
// across every vote ever cast — early on, a single day's check-ins are
// split thin across 7 age ranges, so most bars read as "—" (no data) and
// the sunniest/heaviest cards disappear. All-time gives every range a
// fairer shot at having something to show. `today_checkins` and `since`
// are always included regardless of scope, same reasoning as the global
// route, so the UI can show a live "today" count even while browsing
// all-time.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const scope = searchParams.get("scope") === "all" ? "all" : "today";

  const pool = getPool();

  const where = scope === "all" ? "" : "WHERE vote_date = $1";
  const params = scope === "all" ? [] : [date];

  const res = await pool.query(
    `SELECT age_range, AVG(mood)::numeric(4,2) AS average, COUNT(*)::int AS checkins
     FROM votes ${where} GROUP BY age_range`,
    params
  );
  const byRange = new Map(res.rows.map((r: any) => [r.age_range, Number(r.average)]));

  const ranges = AGE_RANGES.map((code) => ({
    age_range: code,
    average: byRange.has(code) ? byRange.get(code)! : null,
  }));

  const withData = ranges.filter((r) => r.average !== null) as { age_range: string; average: number }[];
  let highest = "";
  let lowest = "";
  if (withData.length > 0) {
    highest = withData.reduce((a, b) => (b.average > a.average ? b : a)).age_range;
    lowest = withData.reduce((a, b) => (b.average < a.average ? b : a)).age_range;
  }

  const totalRes = await pool.query(`SELECT COUNT(*)::int AS c FROM votes ${where}`, params);
  const total_checkins = Number(totalRes.rows[0].c) || 0;

  const todayRes = await pool.query(`SELECT COUNT(*)::int AS c FROM votes WHERE vote_date = $1`, [date]);
  const today_checkins = Number(todayRes.rows[0].c) || 0;

  let since: string | null = null;
  if (scope === "all") {
    const sinceRes = await pool.query(`SELECT to_char(MIN(vote_date), 'YYYY-MM-DD') AS d FROM votes`);
    since = sinceRes.rows[0].d || null;
  }

  return NextResponse.json({ scope, date, ranges, highest, lowest, total_checkins, today_checkins, since });
}
