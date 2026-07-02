import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/stats/distribution?date=YYYY-MM-DD — share of each mood today.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const pool = getPool();
  const res = await pool.query(
    `SELECT mood, (COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0))::numeric(5,2) AS pct
     FROM votes WHERE vote_date = $1 GROUP BY mood ORDER BY mood`,
    [date]
  );

  const byMood = new Map(res.rows.map((r: any) => [Number(r.mood), Number(r.pct)]));
  const levels = Array.from({ length: 7 }, (_, i) => ({ mood: i + 1, pct: byMood.get(i + 1) || 0 }));
  const mode = levels.reduce((a, b) => (b.pct > a.pct ? b : a), levels[0]).mood;

  return NextResponse.json({ date, mode, levels });
}
