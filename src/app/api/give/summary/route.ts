import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCheckinGivingSummary } from "@/lib/streak";

export const dynamic = "force-dynamic";

const MONTHLY_GOAL = Number(process.env.GIVE_MONTHLY_GOAL || 75000);
const DONATED_PCT = Number(process.env.GIVE_DONATED_PCT || 65);
const OPS_PCT = Number(process.env.GIVE_OPS_PCT || 35);

// GET /api/give/summary?fingerprint=...&month=YYYY-MM
// Give is marked "coming soon" in the UI until a real rewarded-ad SDK is
// wired in (see ARCHITECTURE.md) — so this honestly reports real ad_events
// (currently zero for everyone) rather than any placeholder/fake numbers.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fingerprint = searchParams.get("fingerprint") || "";
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const pool = getPool();
  const totalRes = await pool.query(
    `SELECT COALESCE(SUM(reward_amount),0)::numeric(12,2) AS raised
     FROM ad_events WHERE to_char(event_date,'YYYY-MM') = $1`,
    [month]
  );

  let lifetime_ads = 0;
  let funded = 0;
  let today_ads = 0;
  if (fingerprint) {
    const youRes = await pool.query(
      `SELECT COUNT(*)::int AS lifetime_ads, COALESCE(SUM(reward_amount),0)::numeric(10,2) AS funded
       FROM ad_events WHERE fingerprint = $1`,
      [fingerprint]
    );
    lifetime_ads = youRes.rows[0].lifetime_ads;
    funded = Number(youRes.rows[0].funded);
    const todayRes = await pool.query(
      `SELECT COUNT(*)::int AS c FROM ad_events WHERE fingerprint = $1 AND event_date = CURRENT_DATE`,
      [fingerprint]
    );
    today_ads = todayRes.rows[0].c;
  }

  // Defensive: falls back to a safe zeroed summary if checkin_donations
  // hasn't been migrated onto the live DB yet (see db/schema.sql), so a
  // pending migration can never take down the rest of this endpoint —
  // Global/Ages/Trends all load via the same Promise.all as this summary.
  let checkin_giving;
  try {
    checkin_giving = await getCheckinGivingSummary(pool, month, fingerprint || undefined);
  } catch (err) {
    console.error("getCheckinGivingSummary failed (has db/schema.sql's checkin_donations table been created?)", err);
    checkin_giving = { raised_this_month: 0, monthly_cap: 3000, cap_reached: false, you_this_month: 0 };
  }

  return NextResponse.json({
    raised_this_month: Number(totalRes.rows[0].raised),
    monthly_goal: MONTHLY_GOAL,
    donated_pct: DONATED_PCT,
    ops_pct: OPS_PCT,
    you: { lifetime_ads, funded, today_ads },
    checkin_giving,
  });
}
