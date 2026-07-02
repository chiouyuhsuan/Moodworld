import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/stats/global?date=YYYY-MM-DD
// Happiest/toughest show every country with at least 1 check-in today (top 5
// by average), no minimum-sample floor — early on, hiding everything below a
// vote-count threshold made the board look dead (often just one country) for
// the first visitors, which matters a lot around a launch. Each row's
// `checkins` count is returned so the UI can show it honestly next to the
// country instead of pretending a 1-vote country carries the same weight as
// a 500-vote one.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const pool = getPool();

  const totals = await pool.query(
    `SELECT COALESCE(AVG(mood),0)::numeric(4,2) AS average, COUNT(*)::int AS total_checkins
     FROM votes WHERE vote_date = $1`,
    [date]
  );
  const average = Number(totals.rows[0].average) || 0;
  const total_checkins = Number(totals.rows[0].total_checkins) || 0;

  const happiestRes = await pool.query(
    `SELECT country, AVG(mood)::numeric(4,2) AS average, COUNT(*)::int AS checkins
     FROM votes WHERE vote_date = $1
     GROUP BY country
     ORDER BY average DESC, checkins DESC LIMIT 5`,
    [date]
  );
  const toughestRes = await pool.query(
    `SELECT country, AVG(mood)::numeric(4,2) AS average, COUNT(*)::int AS checkins
     FROM votes WHERE vote_date = $1
     GROUP BY country
     ORDER BY average ASC, checkins DESC LIMIT 5`,
    [date]
  );
  const happiest = happiestRes.rows;
  const toughest = toughestRes.rows;

  return NextResponse.json({
    date,
    average,
    total_checkins,
    happiest: happiest.map((r) => ({ country: r.country, average: Number(r.average), checkins: r.checkins })),
    toughest: toughest.map((r) => ({ country: r.country, average: Number(r.average), checkins: r.checkins })),
  });
}
