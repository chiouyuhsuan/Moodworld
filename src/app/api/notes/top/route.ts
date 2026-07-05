import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/notes/top?limit=10
//
// Best-received notes, ranked by "🌟 It's inspiring" reactions. Approved
// notes only (curated + manually-approved user submissions). No minimum-
// reaction floor — same philosophy as the country leaderboard in
// /api/stats/global: show real counts honestly rather than hiding
// everything below a threshold. Surfaced on the Global tab.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit")) || 10));

  const pool = getPool();
  const res = await pool.query(
    `SELECT id, text, source, country, mood, inspiring_count, not_helpful_count
     FROM notes
     WHERE status = 'approved' AND inspiring_count > 0
     ORDER BY inspiring_count DESC, not_helpful_count ASC, created_at DESC
     LIMIT $1`,
    [limit]
  );

  return NextResponse.json({
    notes: res.rows.map((r) => ({
      id: r.id,
      text: r.text,
      source: r.source,
      country: r.country,
      mood: r.mood,
      inspiring_count: r.inspiring_count,
      not_helpful_count: r.not_helpful_count,
    })),
  });
}
