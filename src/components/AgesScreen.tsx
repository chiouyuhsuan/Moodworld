"use client";

import { moodByLevel } from "@/lib/moods";
import { ageRangeDisplay } from "@/lib/referenceData";
import { trackEvent } from "@/lib/analytics";
import MoodFace from "./MoodFace";
import type { AgeStats } from "@/lib/types";
import type { TabId } from "./TabBar";

type VoteRecord = { mood: number; country: string; city: string | null; age_range: string };

export default function AgesScreen({
  stats,
  loading,
  voted,
  voteRecord,
  onGoTab,
}: {
  stats: AgeStats | null;
  loading: boolean;
  voted: boolean;
  voteRecord: VoteRecord | null;
  onGoTab: (t: TabId) => void;
}) {
  if (loading || !stats) {
    return (
      <div style={{ padding: "58px 22px 118px" }}>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733" }}>By age</div>
        <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 8 }}>Loading…</div>
      </div>
    );
  }

  const withData = stats.ranges.filter((r) => r.average !== null) as { age_range: string; average: number }[];
  const hasAny = withData.length > 0;
  const maxRow = hasAny ? withData.reduce((a, b) => (b.average > a.average ? b : a)) : null;
  const minRow = hasAny ? withData.reduce((a, b) => (b.average < a.average ? b : a)) : null;
  const bm = maxRow ? moodByLevel(maxRow.average) : null;
  const wm = minRow ? moodByLevel(minRow.average) : null;

  let ac: {
    yourColor: string;
    yourMouth: string;
    yourLabel: string;
    groupColor: string;
    groupMouth: string;
    group: string;
    groupVal: string;
    sentence: string;
  } | null = null;
  if (voted && voteRecord) {
    const grp = withData.find((r) => r.age_range === voteRecord.age_range);
    const gAvg = grp ? grp.average : null;
    if (gAvg !== null) {
      const ym = moodByLevel(voteRecord.mood);
      const gmv = moodByLevel(gAvg);
      const diff = voteRecord.mood - gAvg;
      const rel = diff > 0.4 ? "above" : diff < -0.4 ? "below" : "right in line with";
      ac = {
        yourColor: ym.color,
        yourMouth: ym.mouth,
        yourLabel: ym.label,
        groupColor: gmv.color,
        groupMouth: gmv.mouth,
        group: ageRangeDisplay(voteRecord.age_range),
        groupVal: gAvg.toFixed(1),
        sentence: `You're feeling ${ym.label} today — ${rel} the ${ageRangeDisplay(voteRecord.age_range)} average of ${gAvg.toFixed(1)}.`,
      };
    }
  }

  return (
    <div style={{ padding: "58px 22px 118px" }}>
      <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733" }}>By age</div>
      <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 2, marginBottom: 20 }}>
        Average mood across age ranges today
      </div>

      <div style={{ background: "#fff", borderRadius: 28, padding: "22px 18px 16px", boxShadow: "0 16px 36px -24px rgba(90,60,120,.5)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, height: 236 }}>
          {stats.ranges.map((r) => {
            const has = r.average !== null;
            const mo = has ? moodByLevel(r.average as number) : null;
            const h = has ? (((r.average as number) - 3.4) / (5.6 - 3.4)) * 100 : 14;
            const hp = Math.max(14, Math.min(100, h));
            return (
              <div key={r.age_range} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 7 }}>
                <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 12.5, color: mo ? mo.color : "#C3BBCE" }}>
                  {has ? (r.average as number).toFixed(1) : "—"}
                </div>
                <div
                  style={{
                    width: 26,
                    height: `${hp}%`,
                    background: mo ? `linear-gradient(180deg, ${mo.color}, ${mo.color2})` : "#EFE9F3",
                    borderRadius: 12,
                  }}
                />
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "#9B93A6", letterSpacing: "-.2px" }}>{ageRangeDisplay(r.age_range)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {hasAny && bm && wm && maxRow && minRow ? (
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1, background: `linear-gradient(160deg, ${bm.color}, ${bm.color2})`, borderRadius: 22, padding: 18, color: "#fff", boxShadow: `0 16px 34px -22px ${bm.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".5px", opacity: 0.9 }}>SUNNIEST</div>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 26, marginTop: 4 }}>{ageRangeDisplay(maxRow.age_range)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.92, marginTop: 2 }}>
              {maxRow.average.toFixed(1)} · {bm.label}
            </div>
          </div>
          <div style={{ flex: 1, background: `linear-gradient(160deg, ${wm.color}, ${wm.color2})`, borderRadius: 22, padding: 18, color: "#fff", boxShadow: `0 16px 34px -22px ${wm.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".5px", opacity: 0.9 }}>HEAVIEST</div>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 26, marginTop: 4 }}>{ageRangeDisplay(minRow.age_range)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.92, marginTop: 2 }}>
              {minRow.average.toFixed(1)} · {wm.label}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 16, background: "#F6F1F9", borderRadius: 16, padding: "16px 18px", fontSize: 13, color: "#6B6478", fontWeight: 700, textAlign: "center" }}>
          Not enough check-ins yet to rank age groups.
        </div>
      )}

      {ac ? (
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 26, padding: "22px 20px", boxShadow: "0 16px 36px -24px rgba(90,60,120,.5)" }}>
          <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 16, color: "#2B2733", marginBottom: 18 }}>You vs your age group</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <MoodFace color={ac.yourColor} mouth={ac.yourMouth} size={58} eyeMouthColor="rgba(28,22,42,.55)" />
              <div style={{ fontSize: 11, fontWeight: 800, color: "#9B93A6", textTransform: "uppercase", letterSpacing: ".5px" }}>You</div>
              <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 15, color: ac.yourColor }}>{ac.yourLabel}</div>
            </div>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 15, color: "#C3BBCE" }}>vs</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <MoodFace color={ac.groupColor} mouth={ac.groupMouth} size={58} eyeMouthColor="rgba(28,22,42,.55)" />
              <div style={{ fontSize: 11, fontWeight: 800, color: "#9B93A6", textTransform: "uppercase", letterSpacing: ".5px" }}>{ac.group}</div>
              <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 15, color: ac.groupColor }}>{ac.groupVal} avg</div>
            </div>
          </div>
          <div style={{ marginTop: 18, background: "#F6F1F9", borderRadius: 16, padding: "13px 15px", fontSize: 13.5, fontWeight: 700, color: "#6B6478", lineHeight: 1.5, textAlign: "center" }}>
            {ac.sentence}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 26, padding: "24px 22px", textAlign: "center", boxShadow: "0 16px 36px -24px rgba(90,60,120,.5)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#6B6478", lineHeight: 1.55 }}>
            Check in today to see how your mood stacks up against your age group.
          </div>
          <button
            onClick={() => {
              trackEvent("age_checkin_cta_click");
              onGoTab("vote");
            }}
            style={{ marginTop: 14, background: "#2B2733", color: "#fff", borderRadius: 14, padding: "12px 22px", fontSize: 14, fontWeight: 800, fontFamily: "Fredoka" }}
          >
            Check in
          </button>
        </div>
      )}
    </div>
  );
}
