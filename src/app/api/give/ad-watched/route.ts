import { NextResponse } from "next/server";

// POST /api/give/ad-watched — record a verified rewarded-ad completion.
//
// NOT WIRED UP YET. Per the launch decision, the Give tab ships as
// "Coming soon": there is no real ad SDK integrated, and per ARCHITECTURE.md
// a reward must only ever be credited on the SDK's verified completion
// callback (server-to-server), never on the client's word alone. Returning
// 501 here keeps that promise instead of quietly accepting fake credits.
//
// To go live: integrate a rewarded-video SDK (e.g. Google AdMob for native,
// a web ad network for the PWA), verify its completion token server-side,
// then INSERT INTO ad_events (event_date, fingerprint, ad_network, reward_amount)
// and return { ok:true, today_count, lifetime_count, reward_amount } (201).
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "not_yet_available", message: "Give is coming soon — ad SDK not yet integrated." },
    { status: 501 }
  );
}
