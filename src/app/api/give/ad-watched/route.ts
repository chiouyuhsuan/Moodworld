import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const PER_AD_REWARD = Number(process.env.GIVE_PER_AD_REWARD || 0.02);
// Self-serve rewarded-ad networks (unlike AdMob) generally have no
// server-to-server verification, so a client can, in principle, spoof a
// completion. We can't fully prevent that at this scale — but we can bound
// the damage with a simple per-device daily cap instead of trusting it
// unlimited. Tune this once a real network is wired in.
const MAX_ADS_PER_FINGERPRINT_PER_DAY = 20;

// POST /api/give/ad-watched — record a rewarded-ad completion.
//
// Ships disabled until a real ad network is wired in (see src/lib/ads.ts —
// the Give button stays "Coming soon" client-side while
// NEXT_PUBLIC_AD_SCRIPT_URL / NEXT_PUBLIC_AD_ZONE_ID are unset, so this route
// currently never gets called in production). Once a network's completion
// token is available, pass it through as `verification` — if that network
// offers a server-side verification API/webhook, prefer wiring that in
// instead of trusting the token blindly.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { fingerprint, date, ad_network, verification } = body || {};
  if (typeof fingerprint !== "string" || fingerprint.length < 4) {
    return NextResponse.json({ ok: false, error: "missing_fingerprint" }, { status: 400 });
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
  }
  if (typeof verification !== "string" || verification.length < 1) {
    return NextResponse.json({ ok: false, error: "missing_verification" }, { status: 400 });
  }

  const pool = getPool();

  const todayCountRes = await pool.query(
    `SELECT COUNT(*)::int AS c FROM ad_events WHERE fingerprint = $1 AND event_date = $2`,
    [fingerprint, date]
  );
  if (todayCountRes.rows[0].c >= MAX_ADS_PER_FINGERPRINT_PER_DAY) {
    return NextResponse.json({ ok: false, error: "daily_limit_reached" }, { status: 429 });
  }

  await pool.query(
    `INSERT INTO ad_events (event_date, fingerprint, ad_network, reward_amount) VALUES ($1,$2,$3,$4)`,
    [date, fingerprint, typeof ad_network === "string" ? ad_network.slice(0, 40) : null, PER_AD_REWARD]
  );

  const countsRes = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE event_date = $2)::int AS today_count,
       COUNT(*)::int AS lifetime_count
     FROM ad_events WHERE fingerprint = $1`,
    [fingerprint, date]
  );

  return NextResponse.json(
    {
      ok: true,
      today_count: countsRes.rows[0].today_count,
      lifetime_count: countsRes.rows[0].lifetime_count,
      reward_amount: PER_AD_REWARD,
    },
    { status: 201 }
  );
}
