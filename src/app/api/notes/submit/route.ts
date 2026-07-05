import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_LEN = 50;
const MIN_LEN = 3;

// Deliberately basic — every submission also sits as status='pending' and
// waits for manual review before it can ever be shown to anyone (see
// db/schema.sql), so this filter only needs to catch obvious junk before it
// reaches that review queue, not police everything perfectly.
const BLOCKED_PATTERNS = [
  /https?:\/\//i,
  /www\./i,
  /\b[\w-]+\.(com|net|org|io|co|tw|cn)\b/i,
  /fuck|shit|bitch|asshole|cunt|nigger|retard/i,
];

// POST /api/notes/submit — { fingerprint, date, mood, country, text }
//
// Submitted notes never go live automatically. They're inserted with
// status='pending' and only become eligible for GET /api/notes/random once
// a human flips them to 'approved' — currently done by hand (軒, via
// Supabase's table editor), roughly the next day while the queue is small
// enough to review manually. One submission per person per day, enforced by
// the (fingerprint, vote_date) UNIQUE constraint on notes.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { fingerprint, date, mood, country, text } = body || {};

  if (typeof fingerprint !== "string" || fingerprint.length < 4) {
    return NextResponse.json({ ok: false, error: "missing_fingerprint" }, { status: 400 });
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
  }
  const moodNum = Number(mood);
  const moodVal = Number.isInteger(moodNum) && moodNum >= 1 && moodNum <= 7 ? moodNum : null;
  const countryVal = typeof country === "string" && country.trim() ? country.trim().slice(0, 40) : null;

  const trimmed = typeof text === "string" ? text.trim().replace(/\s+/g, " ") : "";
  if (trimmed.length < MIN_LEN || trimmed.length > MAX_LEN) {
    return NextResponse.json({ ok: false, error: "invalid_length" }, { status: 400 });
  }
  if (BLOCKED_PATTERNS.some((p) => p.test(trimmed))) {
    return NextResponse.json({ ok: false, error: "blocked_content" }, { status: 400 });
  }

  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO notes (text, source, status, fingerprint, vote_date, country, mood)
       VALUES ($1, 'user', 'pending', $2, $3, $4, $5)`,
      [trimmed, fingerprint, date, countryVal, moodVal]
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    if (err && err.code === "23505") {
      return NextResponse.json({ ok: false, error: "already_submitted_today" }, { status: 409 });
    }
    console.error("POST /api/notes/submit failed", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
