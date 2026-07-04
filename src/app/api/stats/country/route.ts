import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/stats/country?country=Taiwan&date=YYYY-MM-DD
//
// /api/stats/global only ever returns the top-5-happiest and top-5-toughest
// countries, so a voter whose own country lands in the (very common) middle
// of the pack can't find their own country's average from that endpoint.
// The share card (src/app/share, src/app/api/og/share) needs exactly that —
// "how does MY country compare to the world today" — so this is a small,
// single-purpose lookup rather than bolting a "give me every country"
// parameter onto the leaderboard route.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "";
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  if (!country) {
    return NextResponse.json({ error: "missing_country" }, { status: 400 });
  }

  const pool = getPool();
  const res = await pool.query(
    `SELECT AVG(mood)::numeric(4,2) AS average, COUNT(*)::int AS checkins
     FROM votes WHERE vote_date = $1 AND country = $2`,
    [date, country]
  );

  const row = res.rows[0];
  const checkins = Number(row.checkins) || 0;

  return NextResponse.json({
    country,
    date,
    average: checkins > 0 ? Number(row.average) : null,
    checkins,
  });
}
