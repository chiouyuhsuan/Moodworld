"use client";

import { moodByLevel } from "@/lib/moods";
import MoodFace from "./MoodFace";
import type { GlobalStats } from "@/lib/types";

export default function GlobalScreen({ stats, loading }: { stats: GlobalStats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div style={{ padding: "58px 22px 118px" }}>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733" }}>Global mood</div>
        <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 8 }}>Loading…</div>
      </div>
    );
  }

  const noData = stats.total_checkins === 0;
  const gm = moodByLevel(noData ? 4 : stats.average);

  const Row = ({ r, rank }: { r: { country: string; average: number; checkins: number }; rank: number }) => {
    const mo = moodByLevel(r.average);
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 10px 26px -22px rgba(90,60,120,.5)",
        }}
      >
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 15, color: "#C3BBCE", width: 16 }}>{rank}</div>
        <MoodFace color={mo.color} mouth={mo.mouth} size={30} eyeMouthColor="rgba(28,22,42,.5)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "#2B2733" }}>{r.country}</div>
          <div style={{ height: 7, background: "#F1ECF5", borderRadius: 99, marginTop: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((r.average / 7) * 100).toFixed(0)}%`, background: mo.color, borderRadius: 99 }} />
          </div>
        </div>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 16, color: mo.color }}>{r.average.toFixed(1)}</div>
      </div>
    );
  };

  return (
    <div style={{ padding: "58px 22px 118px" }}>
      <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733" }}>Global mood</div>
      <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 2, marginBottom: 18 }}>
        {stats.total_checkins.toLocaleString("en-US")} check-ins today
      </div>

      <div
        style={{
          background: `linear-gradient(160deg, ${gm.color} 0%, ${gm.color2} 100%)`,
          borderRadius: 30,
          padding: "26px 22px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 20px 40px -22px ${gm.color}`,
        }}
      >
        <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.13)", bottom: -70, left: -40 }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ flexShrink: 0 }}>
            <MoodFace color="rgba(255,255,255,.96)" mouth={gm.mouth} size={86} eyeMouthColor={gm.color} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".5px", opacity: 0.9 }}>TODAY&apos;S AVERAGE</div>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 46, lineHeight: 1, marginTop: 2 }}>
              {noData ? "—" : stats.average.toFixed(1)}
              <span style={{ fontSize: 20, opacity: 0.7 }}> /7</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>
              {noData ? "Be the first to check in" : `Mostly ${gm.label.toLowerCase()}`}
            </div>
          </div>
        </div>
      </div>

      {noData ? (
        <div
          style={{
            marginTop: 18,
            background: "#F6F1F9",
            borderRadius: 16,
            padding: "16px 18px",
            fontSize: 13,
            color: "#6B6478",
            fontWeight: 700,
            lineHeight: 1.55,
            textAlign: "center",
          }}
        >
          No one&apos;s checked in yet today — rankings and averages will fill in as votes come in.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "18px 2px 12px" }}>
            <span style={{ fontSize: 15 }}>☀️</span>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 18, color: "#2B2733" }}>Happiest places</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {stats.happiest.length === 0 && (
              <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700 }}>Not enough check-ins yet for a ranking.</div>
            )}
            {stats.happiest.map((r, i) => (
              <Row key={r.country} r={r} rank={i + 1} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "22px 2px 12px" }}>
            <span style={{ fontSize: 15 }}>🌧️</span>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 18, color: "#2B2733" }}>Toughest days</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {stats.toughest.map((r, i) => (
              <Row key={r.country} r={r} rank={i + 1} />
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 18, background: "#F6F1F9", borderRadius: 16, padding: "13px 15px", fontSize: 11.5, color: "#9B93A6", fontWeight: 600, lineHeight: 1.55 }}>
        Based on self-reported check-ins — not strictly de-duplicated, so treat it as a global vibe, not a census.
      </div>
    </div>
  );
}
