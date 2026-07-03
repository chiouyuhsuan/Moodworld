import { NextRequest, NextResponse } from "next/server";
import { ISO_TO_COUNTRY } from "@/lib/referenceData";

export const dynamic = "force-dynamic";

// GET /api/geo — best-effort "which country is this visitor probably in".
//
// Vercel's edge network stamps every request with `x-vercel-ip-country`, an
// ISO 3166-1 alpha-2 guess based on the visitor's IP — no GPS permission
// prompt, no third-party geolocation API, no extra data collected beyond
// what's implicit in every HTTP request anyway (country was already a
// required field the user typed in by hand; this just pre-fills the same
// value from a signal we already have for free).
//
// This header is only populated when the request actually passes through
// Vercel's network (i.e. the deployed site) — it's absent in local dev, and
// absent for a fraction of real traffic too (some proxies/VPNs strip or
// spoof it, and Vercel itself may omit it if it can't determine a country).
// In every "can't tell" case we return { country: null } and the client
// falls back to the ordinary "Select country…" placeholder — never a
// silently-wrong guess presented as certain, and never a blank field with
// no prompt.
export async function GET(req: NextRequest) {
  const iso = req.headers.get("x-vercel-ip-country");
  const country = iso ? ISO_TO_COUNTRY[iso.toUpperCase()] ?? null : null;
  return NextResponse.json({ country });
}
