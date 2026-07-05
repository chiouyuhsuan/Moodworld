import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/stats/global?date=YYYY-MM-DD&scope=today|all
//
// scope=today (default): everything filtered to that one date — the
// original behavior.
// scope=all: same shape, but aggregated across every vote ever cast. Early
// on, daily volume is low enough that the "today" leaderboard often shows
// just one or two countries, which reads as broken/empty to a first-time
// visitor. All-time smooths that out and gives every country a fairer shot
// at showing up. `today_checkins` and `since` are always included
// regardless of scope so the UI can keep a "today" pulse visible even while
// browsing the all-time view.
//
// Happiest/toughest show every country with at least 1 check-in (top 5 by
// average), no minimum-sample floor — hiding everything below a vote-count
// threshold made the board look dead for early visitors. Each row's
// `checkins` count is returned so the UI can show it honestly next to the
// country instead of pretending a 1-vote country carries the same weight as
// a 500-vote one.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const scope = searchParams.get("scope") === "all" ? "all" : "today";

  const pool = getPool();

  const where = scope === "all" ? "" : "WHERE vote_date = $1";
  const params = scope === "all" ? [] : [date];

  const totals = await pool.query(
    `SELECT COALESCE(AVG(mood),0)::numeric(4,2) AS average, COUNT(*)::int AS total_checkins
     FROM votes ${where}`,
    params
  );
  const average = Number(totals.rows[0].average) || 0;
  const total_checkins = Number(totals.rows[0].total_checkins) || 0;

  const happiestRes = await pool.query(
    `SELECT country, AVG(mood)::numeric(4,2) AS average, COUNT(*)::int AS checkins
     FROM votes ${where}
     GROUP BY country
     ORDER BY average DESC, checkins DESC LIMIT 5`,
    params
  );
  const toughestRes = await pool.query(
    `SELECT country, AVG(mood)::numeric(4,2) AS average, COUNT(*)::int AS checkins
     FROM votes ${where}
     GROUP BY country
     ORDER BY average ASC, checkins DESC LIMIT 5`,
    params
  );
  const happiest = happiestRes.rows;
  const toughest = toughestRes.rows;

  const todayRes = await pool.query(`SELECT COUNT(*)::int AS c FROM votes WHERE vote_date = $1`, [date]);
  const today_checkins = Number(todayRes.rows[0].c) || 0;

  let since: string | null = null;
  if (scope === "all") {
    const sinceRes = await pool.query(`SELECT to_char(MIN(vote_date), 'YYYY-MM-DD') AS d FROM votes`);
    since = sinceRes.rows[0].d || null;
  }

  return NextResponse.json({
    scope,
    date,
    average,
    total_checkins,
    today_checkins,
    since,
    happiest: happiest.map((r) => ({ country: r.country, average: Number(r.average), checkins: r.checkins })),
    toughest: toughest.map((r) => ({ country: r.country, average: Number(r.average), checkins: r.checkins })),
  });
}
