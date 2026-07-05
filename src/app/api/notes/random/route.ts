import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/notes/random?fingerprint=X
//
// Returns one random approved note to show after voting — a short,
// anonymous message from either MoodWorld's own curated pool ('internal',
// see db/notes_seed.sql) or a real person whose submission already cleared
// manual review ('user', see POST /api/notes/submit). Delivery is
// deliberately NOT matched to the recipient's own mood: at current volume,
// mood-matching would shrink the pool too much, and full randomness reads
// as fairer than assuming what someone wants to hear (discussed with 軒 —
// picked "random" over same-mood/opposite-mood matching).
//
// `fingerprint IS DISTINCT FROM $1` excludes a note from being shown back to
// its own author, while still including every internal note (fingerprint is
// NULL there, and NULL IS DISTINCT FROM anything is true).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fingerprint = searchParams.get("fingerprint") || "";

  const pool = getPool();
  const res = await pool.query(
    `SELECT id, text, source, country, mood, inspiring_count, not_helpful_count
     FROM notes
     WHERE status = 'approved' AND fingerprint IS DISTINCT FROM $1
     ORDER BY random()
     LIMIT 1`,
    [fingerprint]
  );
  const row = res.rows[0];
  if (!row) return NextResponse.json({ note: null });

  return NextResponse.json({
    note: {
      id: row.id,
      text: row.text,
      source: row.source,
      country: row.country,
      mood: row.mood,
      inspiring_count: row.inspiring_count,
      not_helpful_count: row.not_helpful_count,
    },
  });
}
