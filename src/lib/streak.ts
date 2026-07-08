import type { Pool } from "pg";

// "Streak" used to mean an unbroken run of consecutive daily check-ins,
// resetting to 0 on any missed day. Per product decision (2026-07) it's now
// a cyclical counter of TOTAL check-ins ever made by a device — missing a
// day no longer breaks it. Every 7th cumulative check-in completes a
// "cycle" (the display wraps back to 1 on the next vote) and triggers a
// small real-world pledge — see the check-in-giving section below.

// Maps a lifetime total check-in count to its 1-7 position in the cycle.
// 0 total (shouldn't happen post-vote, but defensive) reports 0.
export function cyclePosition(total: number): number {
  if (total <= 0) return 0;
  const m = total % 7;
  return m === 0 ? 7 : m;
}

// True on the exact check-in that completes a 7-cycle (the 7th, 14th, 21st... ever).
export function completesCycle(total: number): boolean {
  return total > 0 && total % 7 === 0;
}

export type CheckinStats = { total: number; cycle: number; justCompletedCycle: boolean };

// Lifetime check-in count for a device, and where that puts it in the
// current 1-7 cycle. Cheap: one COUNT(*) against the UNIQUE(fingerprint,
// vote_date) votes table, no date-gap logic needed now that gaps don't matter.
export async function getCheckinStats(pool: Pool, fingerprint: string): Promise<CheckinStats> {
  const res = await pool.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM votes WHERE fingerprint = $1`, [
    fingerprint,
  ]);
  const total = Number(res.rows[0]?.c ?? 0);
  return { total, cycle: cyclePosition(total), justCompletedCycle: completesCycle(total) };
}

// ---- Check-in giving: every completed 7-cycle pledges CHECKIN_GIVE_AMOUNT
// TWD, site-wide total capped at CHECKIN_GIVE_MONTHLY_CAP per calendar
// month. This is a recorded pledge only (no payment integration) — same
// honesty model as the Give tab's ad revenue: real numbers, manually
// fulfilled by the site owner. See db/schema.sql `checkin_donations`. ----

export const CHECKIN_GIVE_AMOUNT = 1.0; // TWD per completed cycle
export const CHECKIN_GIVE_MONTHLY_CAP = 3000; // TWD, site-wide, per calendar month

// Records one pledge event. Call exactly once, right after a vote insert
// that completes a cycle (see POST /api/vote). Deliberately NOT capped at
// insert time — every real cycle-completion is recorded so the ledger stays
// a complete, honest history; the monthly cap is applied only when
// *reporting* totals (getCheckinGivingSummary), so a user's 7th check-in
// still earns them the "you contributed" moment even in a month where the
// site-wide total has already passed what will actually be donated.
export async function recordCheckinDonation(
  pool: Pool,
  fingerprint: string,
  voteId: number,
  voteDate: string
): Promise<void> {
  const month = voteDate.slice(0, 7); // YYYY-MM, derived from the vote's own local date
  await pool.query(
    `INSERT INTO checkin_donations (credit_month, fingerprint, vote_id, amount) VALUES ($1,$2,$3,$4)`,
    [month, fingerprint, voteId, CHECKIN_GIVE_AMOUNT]
  );
}

export type CheckinGivingSummary = {
  raised_this_month: number; // capped at CHECKIN_GIVE_MONTHLY_CAP — the honest, payable figure
  monthly_cap: number;
  cap_reached: boolean;
  you_this_month: number; // this device's own pledge count this month (uncapped personal stat)
};

export async function getCheckinGivingSummary(
  pool: Pool,
  month: string,
  fingerprint?: string
): Promise<CheckinGivingSummary> {
  const totalRes = await pool.query<{ raised: string }>(
    `SELECT COALESCE(SUM(amount),0)::numeric(12,2) AS raised FROM checkin_donations WHERE credit_month = $1`,
    [month]
  );
  const rawRaised = Number(totalRes.rows[0].raised);

  let you_this_month = 0;
  if (fingerprint) {
    const youRes = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM checkin_donations WHERE credit_month = $1 AND fingerprint = $2`,
      [month, fingerprint]
    );
    you_this_month = Number(youRes.rows[0]?.c ?? 0);
  }

  return {
    raised_this_month: Math.min(rawRaised, CHECKIN_GIVE_MONTHLY_CAP),
    monthly_cap: CHECKIN_GIVE_MONTHLY_CAP,
    cap_reached: rawRaised >= CHECKIN_GIVE_MONTHLY_CAP,
    you_this_month,
  };
}
