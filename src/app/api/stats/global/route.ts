import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/stats/global?date=YYYY-MM-DD
// Happiest/toughest use a minimum-sample floor per API_AND_SCHEMA.md so a
// country with a handful of votes can't top the board — but at low overall
// volume (a brand new site) that floor is relaxed step-down so the page
// isn't empty on day one. At scale this always resolves at the 30-vote floor.
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

  const floors = [30, 10, 3, 1];
  let happiest: any[] = [];
  let toughest: any[] = [];
  for (const floor of floors) {
    const res = await pool.query(
      `SELECT country, AVG(mood)::numeric(4,2) AS average, COUNT(*)::int AS checkins
       FROM votes WHERE vote_date = $1
       GROUP BY country HAVING COUNT(*) >= $2
       ORDER BY average DESC LIMIT 5`,
      [date, floor]
    );
    if (res.rows.length > 0) {
      happiest = res.rows;
      const res2 = await pool.query(
        `SELECT country, AVG(mood)::numeric(4,2) AS average, COUNT(*)::int AS checkins
         FROM votes WHERE vote_date = $1
         GROUP BY country HAVING COUNT(*) >= $2
         ORDER BY average ASC LIMIT 5`,
        [date, floor]
      );
      toughest = res2.rows;
      break;
    }
  }

  return NextResponse.json({
    date,
    average,
    total_checkins,
    happiest: happiest.map((r) => ({ country: r.country, average: Number(r.average), checkins: r.checkins })),
    toughest: toughest.map((r) => ({ country: r.country, average: Number(r.average), checkins: r.checkins })),
  });
}
