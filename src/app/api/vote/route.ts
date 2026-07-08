import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { AGE_RANGES, COUNTRY_NAMES } from "@/lib/referenceData";
import { getCheckinStats, recordCheckinDonation } from "@/lib/streak";

export const dynamic = "force-dynamic";

// POST /api/vote — cast today's vote (one per device per day). See API_AND_SCHEMA.md.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { fingerprint, date, mood, country, city, age_range } = body || {};

  if (typeof fingerprint !== "string" || fingerprint.length < 4) {
    return NextResponse.json({ ok: false, error: "missing_fingerprint" }, { status: 400 });
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
  }
  const moodNum = Number(mood);
  if (!Number.isInteger(moodNum) || moodNum < 1 || moodNum > 7) {
    return NextResponse.json({ ok: false, error: "invalid_mood" }, { status: 400 });
  }
  if (typeof country !== "string" || !COUNTRY_NAMES.includes(country)) {
    return NextResponse.json({ ok: false, error: "invalid_country" }, { status: 400 });
  }
  if (typeof age_range !== "string" || !AGE_RANGES.includes(age_range)) {
    return NextResponse.json({ ok: false, error: "invalid_age_range" }, { status: 400 });
  }
  const cityVal = typeof city === "string" && city.trim() ? city.trim().slice(0, 80) : null;

  const pool = getPool();
  try {
    const res = await pool.query(
      `INSERT INTO votes (vote_date, mood, country, city, age_range, fingerprint)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, mood, vote_date, country, city, age_range`,
      [date, moodNum, country, cityVal, age_range, fingerprint]
    );
    const row = res.rows[0];
    const { cycle, justCompletedCycle } = await getCheckinStats(pool, fingerprint);
    if (justCompletedCycle) {
      // Fire-and-forget-safe: awaited so a failure surfaces in logs, but
      // never blocks/breaks the vote response — the vote itself already
      // succeeded and must not be rolled back over a giving-ledger hiccup.
      try {
        await recordCheckinDonation(pool, fingerprint, row.id, row.vote_date);
      } catch (err) {
        console.error("recordCheckinDonation failed", err);
      }
    }
    return NextResponse.json(
      {
        ok: true,
        vote: {
          id: row.id,
          mood: row.mood,
          date: row.vote_date,
          country: row.country,
          city: row.city,
          age_range: row.age_range,
        },
        streak: cycle,
        justCompletedCycle,
      },
      { status: 201 }
    );
  } catch (err: any) {
    // unique_violation on (fingerprint, vote_date) => already voted today
    if (err && err.code === "23505") {
      const existing = await pool.query(
        `SELECT mood, vote_date, country, city, age_range FROM votes WHERE fingerprint=$1 AND vote_date=$2`,
        [fingerprint, date]
      );
      const row = existing.rows[0];
      const { cycle, justCompletedCycle } = await getCheckinStats(pool, fingerprint);
      return NextResponse.json(
        {
          ok: false,
          error: "already_voted_today",
          vote: row
            ? { mood: row.mood, date: row.vote_date, country: row.country, city: row.city, age_range: row.age_range }
            : undefined,
          streak: cycle,
          justCompletedCycle,
        },
        { status: 409 }
      );
    }
    console.error("POST /api/vote failed", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
