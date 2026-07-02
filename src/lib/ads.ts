"use client";

// Ad adapter — "tap the ad" flow, backed by an Adsterra Smartlink (a plain
// monetized URL, not an embedded SDK). See README.md "Give / ads".
//
// A Smartlink has no completion callback at all — clicking it is the whole
// interaction. So there is no way to verify the user actually looked at
// anything; this is deliberately the simplest, most honest-about-its-limits
// option. We open it in a new tab and credit after a short delay as a
// best-effort "didn't just instant-bounce" signal, nothing more. The
// per-device daily cap in /api/give/ad-watched is the real abuse guard.
//
// To go live: set NEXT_PUBLIC_AD_LINK_URL (your Adsterra Smartlink URL) in
// Vercel's Environment Variables and redeploy. The Give button un-disables
// itself automatically once it's set.

const CREDIT_DELAY_MS = 4000;

export function adsConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_AD_LINK_URL;
}

export type AdResult = { completed: boolean; token?: string };

export async function showRewardedAd(): Promise<AdResult> {
  const url = process.env.NEXT_PUBLIC_AD_LINK_URL;
  if (!url) return { completed: false };

  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    // Popup blocked — nothing to credit.
    return { completed: false };
  }

  await new Promise((resolve) => setTimeout(resolve, CREDIT_DELAY_MS));
  return { completed: true, token: `link-${Date.now()}` };
}
