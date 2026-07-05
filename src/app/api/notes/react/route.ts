import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/notes/react — { fingerprint, noteId, reaction: 'inspiring' | 'not_helpful' }
//
// One reaction per person per note — note_reactions' primary key is
// (note_id, fingerprint), so a repeat reaction just fails with 23505 and the
// route reports it as "already_reacted" instead of double-counting. The
// "best quotes" leaderboard (GET /api/notes/top, surfaced on the Global tab)
// ranks by inspiring_count.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { fingerprint, noteId, reaction } = body || {};

  if (typeof fingerprint !== "string" || fingerprint.length < 4) {
    return NextResponse.json({ ok: false, error: "missing_fingerprint" }, { status: 400 });
  }
  const noteIdNum = Number(noteId);
  if (!Number.isInteger(noteIdNum)) {
    return NextResponse.json({ ok: false, error: "invalid_note" }, { status: 400 });
  }
  if (reaction !== "inspiring" && reaction !== "not_helpful") {
    return NextResponse.json({ ok: false, error: "invalid_reaction" }, { status: 400 });
  }

  const pool = getPool();
  try {
    await pool.query(`INSERT INTO note_reactions (note_id, fingerprint, reaction) VALUES ($1,$2,$3)`, [
      noteIdNum,
      fingerprint,
      reaction,
    ]);
    const column = reaction === "inspiring" ? "inspiring_count" : "not_helpful_count";
    await pool.query(`UPDATE notes SET ${column} = ${column} + 1 WHERE id = $1`, [noteIdNum]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err && err.code === "23505") {
      return NextResponse.json({ ok: false, error: "already_reacted" }, { status: 409 });
    }
    console.error("POST /api/notes/react failed", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
