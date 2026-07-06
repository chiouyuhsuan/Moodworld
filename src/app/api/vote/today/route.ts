import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getStreak } from "@/lib/streak";

export const dynamic = "force-dynamic";

// GET /api/vote/today?fingerprint=...&date=YYYY-MM-DD — has this device voted today?
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fingerprint = searchParams.get("fingerprint");
  const date = searchParams.get("date");

  if (!fingerprint || !date) {
    return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
  }

  const pool = getPool();
  const res = await pool.query(
    `SELECT mood, country, city, age_range FROM votes WHERE fingerprint=$1 AND vote_date=$2`,
    [fingerprint, date]
  );

  if (res.rows.length === 0) {
    return NextResponse.json({ voted: false });
  }
  const row = res.rows[0];
  const streak = await getStreak(pool, fingerprint, date);
  return NextResponse.json({
    voted: true,
    vote: { mood: row.mood, country: row.country, city: row.city, age_range: row.age_range },
    streak,
  });
}
