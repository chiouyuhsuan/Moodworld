// Best-effort device fingerprint — a random UUID persisted in localStorage.
// Per ARCHITECTURE.md, this is a *soft* one-vote-per-day mechanism (no login,
// no GPS). It is the ONLY thing this app still keeps in localStorage; the vote
// itself, and all stats, come from the API.

const KEY = "moodworld_fingerprint";

export function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  try {
    let fp = window.localStorage.getItem(KEY);
    if (!fp) {
      fp =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `fp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(KEY, fp);
    }
    return fp;
  } catch {
    return "anonymous";
  }
}

// The user's local calendar date as YYYY-MM-DD — computed client-side so
// "today" always matches what the user sees on their own device/timezone.
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
