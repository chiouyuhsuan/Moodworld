"use client";

// GA4 custom-event helper. Free alternative to Vercel Analytics' Custom
// Events (which are Pro-plan only) — see src/app/layout.tsx for the gtag.js
// loader, gated by NEXT_PUBLIC_GA_MEASUREMENT_ID. No-ops if that env var
// isn't set, so this is always safe to call.

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
