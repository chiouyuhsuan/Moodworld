import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { AGE_RANGES } from "@/lib/referenceData";

export const dynamic = "force-dynamic";

// GET /api/stats/ages?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const pool = getPool();
  const res = await pool.query(
    `SELECT age_range, AVG(mood)::numeric(4,2) AS average
     FROM votes WHERE vote_date = $1 GROUP BY age_range`,
    [date]
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

  return NextResponse.json({ date, ranges, highest, lowest });
}
