"use client";

import { useEffect, useState } from "react";
import { moodByLevel } from "@/lib/moods";
import MoodFace from "./MoodFace";
import type { GlobalStats, Note } from "@/lib/types";

type Scope = "all" | "today";

// Daily volume is low enough right now that the "today" leaderboard often
// shows just one or two countries — reads as broken to a first-time
// visitor. Default to the All Time view (smoothed over every vote ever
// cast) and let people flip to Today if they want the live snapshot; the
// small "today" count stays visible in the subtitle either way so the
// real-time angle isn't lost. See src/app/api/stats/global/route.ts for the
// scope=all aggregation this depends on.
export default function GlobalScreen({
  stats,
  loading,
  today,
}: {
  stats: GlobalStats | null;
  loading: boolean;
  today: string;
}) {
  const [scope, setScope] = useState<Scope>("all");
  const [allStats, setAllStats] = useState<GlobalStats | null>(null);
  const [allLoading, setAllLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setAllLoading(true);
    fetch(`/api/stats/global?scope=all&date=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAllStats(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAllLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [today]);

  // "Best notes" leaderboard — top-reacted notes from the note-from-a-
  // stranger feature (src/components/VoteScreen.tsx, /api/notes/*). Starts
  // empty until reactions accumulate, so the section just doesn't render
  // rather than showing an awkward empty state.
  const [topNotes, setTopNotes] = useState<Note[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/notes/top?limit=8")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTopNotes(data.notes ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const active = scope === "all" ? allStats : stats;
  const activeLoading = scope === "all" ? allLoading && !allStats : loading;

  if (activeLoading || !active) {
    return (
      <div style={{ padding: "58px 22px 118px" }}>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733" }}>Global mood</div>
        <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 8 }}>Loading…</div>
      </div>
    );
  }

  const stats_ = active;
  const noData = stats_.total_checkins === 0;
  const gm = moodByLevel(noData ? 4 : stats_.average);

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
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "#2B2733" }}>{r.country}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C3BBCE", whiteSpace: "nowrap" }}>
              {r.checkins} {r.checkins === 1 ? "vote" : "votes"}
            </div>
          </div>
          <div style={{ height: 7, background: "#F1ECF5", borderRadius: 99, marginTop: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((r.average / 7) * 100).toFixed(0)}%`, background: mo.color, borderRadius: 99 }} />
          </div>
        </div>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 16, color: mo.color }}>{r.average.toFixed(1)}</div>
      </div>
    );
  };

  const todayCheckins = stats_.today_checkins ?? (scope === "today" ? stats_.total_checkins : 0);
  const sinceLabel =
    allStats?.since &&
    new Date(allStats.since + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div style={{ padding: "58px 22px 118px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733" }}>Global mood</div>
          <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 2 }}>
            {scope === "all"
              ? `${stats_.total_checkins.toLocaleString("en-US")} check-ins all time · ${todayCheckins.toLocaleString("en-US")} today`
              : `${stats_.total_checkins.toLocaleString("en-US")} check-ins today`}
          </div>
        </div>
        <div style={{ display: "flex", background: "#F6F1F9", borderRadius: 999, padding: 3, flexShrink: 0 }}>
          {(["all", "today"] as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              style={{
                padding: "7px 13px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 800,
                fontFamily: "Fredoka",
                background: scope === s ? "#2B2733" : "transparent",
                color: scope === s ? "#fff" : "#9B93A6",
                transition: "background .15s ease",
              }}
            >
              {s === "all" ? "All Time" : "Today"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 18 }} />

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
            <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".5px", opacity: 0.9 }}>
              {scope === "all" ? "ALL-TIME AVERAGE" : "TODAY'S AVERAGE"}
            </div>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 46, lineHeight: 1, marginTop: 2 }}>
              {noData ? "—" : stats_.average.toFixed(1)}
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
          {scope === "all"
            ? "No one's checked in yet — rankings and averages will fill in as votes come in."
            : "No one's checked in yet today — rankings and averages will fill in as votes come in."}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "18px 2px 12px" }}>
            <span style={{ fontSize: 15 }}>☀️</span>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 18, color: "#2B2733" }}>Happiest places</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {stats_.happiest.length === 0 && (
              <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700 }}>Not enough check-ins yet for a ranking.</div>
            )}
            {stats_.happiest.map((r, i) => (
              <Row key={r.country} r={r} rank={i + 1} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "22px 2px 12px" }}>
            <span style={{ fontSize: 15 }}>🌧️</span>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 18, color: "#2B2733" }}>Toughest days</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {stats_.toughest.map((r, i) => (
              <Row key={r.country} r={r} rank={i + 1} />
            ))}
          </div>
        </>
      )}

      {topNotes.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "22px 2px 12px" }}>
            <span style={{ fontSize: 15 }}>💬</span>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 18, color: "#2B2733" }}>Top notes</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {topNotes.map((n) => (
              <div
                key={n.id}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: "14px 16px",
                  boxShadow: "0 10px 26px -22px rgba(90,60,120,.5)",
                }}
              >
                <div style={{ fontSize: 14, color: "#2B2733", fontWeight: 700, lineHeight: 1.5 }}>
                  &ldquo;{n.text}&rdquo;
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "#F2823C" }}>🌟 {n.inspiring_count}</span>
                  {n.country && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#C3BBCE" }}>· from {n.country}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 18, background: "#F6F1F9", borderRadius: 16, padding: "13px 15px", fontSize: 11.5, color: "#9B93A6", fontWeight: 600, lineHeight: 1.55 }}>
        {scope === "all" && sinceLabel
          ? `Based on self-reported check-ins since ${sinceLabel} — not strictly de-duplicated, so treat it as a global vibe, not a census.`
          : "Based on self-reported check-ins — not strictly de-duplicated, so treat it as a global vibe, not a census."}
      </div>
    </div>
  );
}
