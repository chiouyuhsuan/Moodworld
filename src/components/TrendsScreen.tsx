"use client";

import { MOODS, moodByLevel } from "@/lib/moods";
import { CONTINENTS } from "@/lib/referenceData";
import { trackEvent } from "@/lib/analytics";
import MoodFace from "./MoodFace";
import type { TrendStats, DistributionStats } from "@/lib/types";

type VoteRecord = { mood: number; country: string; city: string | null; age_range: string };

// Fill gaps (days with zero votes) so the line is continuous rather than
// jagged/undefined — forward-fill, then back-fill, then a neutral default.
function fillSeries(points: { date: string; average: number | null }[]): number[] {
  const vals = points.map((p) => p.average);
  let last: number | null = null;
  const fwd = vals.map((v) => {
    if (v !== null) last = v;
    return last;
  });
  let next: number | null = null;
  for (let i = fwd.length - 1; i >= 0; i--) {
    if (fwd[i] !== null) next = fwd[i] as number;
    else fwd[i] = next;
  }
  return fwd.map((v) => (v === null ? 4 : v));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function TrendsScreen({
  trend,
  distribution,
  loading,
  trendScope,
  setTrendScope,
  trendRange,
  setTrendRange,
  voted,
  voteRecord,
}: {
  trend: TrendStats | null;
  distribution: DistributionStats | null;
  loading: boolean;
  trendScope: string;
  setTrendScope: (s: string) => void;
  trendRange: 7 | 30;
  setTrendRange: (n: 7 | 30) => void;
  voted: boolean;
  voteRecord: VoteRecord | null;
}) {
  if (loading || !trend) {
    return (
      <div style={{ padding: "58px 22px 118px" }}>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733" }}>Trends</div>
        <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 8 }}>Loading…</div>
      </div>
    );
  }

  const series = fillSeries(trend.series);
  const refSeries = fillSeries(trend.global);
  const hasRef = trendScope !== "global";

  const W = 302,
    padX = 6,
    padTop = 12,
    botY = 112,
    plotH = botY - padTop;
  const X = (i: number) => padX + (i / (series.length - 1)) * (W - 2 * padX);
  const Y = (val: number) => padTop + (1 - (val - 1) / 6) * plotH;
  const linePts = series.map((s, i) => `${X(i).toFixed(1)},${Y(s).toFixed(1)}`).join(" ");
  const refPts = refSeries.map((s, i) => `${X(i).toFixed(1)},${Y(s).toFixed(1)}`).join(" ");
  const areaPath = `M${X(0).toFixed(1)},${botY} ${series.map((s, i) => `L${X(i).toFixed(1)},${Y(s).toFixed(1)}`).join(" ")} L${X(series.length - 1).toFixed(1)},${botY} Z`;

  const trendMood = moodByLevel(series[series.length - 1]);
  const delta = trend.delta;
  let deltaLabel: string, deltaColor: string;
  if (Math.abs(delta) < 0.05) {
    deltaLabel = "holding steady";
    deltaColor = "#9B93A6";
  } else if (delta > 0) {
    deltaLabel = `▲ +${delta.toFixed(1)} vs start`;
    deltaColor = "#3E9DAD";
  } else {
    deltaLabel = `▼ ${delta.toFixed(1)} vs start`;
    deltaColor = "#E85535";
  }

  const firstDateStr = trend.series[0]?.date;
  let firstLabel = "";
  if (firstDateStr) {
    const fd = new Date(firstDateStr + "T00:00:00Z");
    firstLabel = `${MONTHS[fd.getUTCMonth()]} ${fd.getUTCDate()}`;
  }

  const scopeDefs: { id: string; label: string }[] = [{ id: "global", label: "Global" }];
  if (voted && voteRecord) scopeDefs.push({ id: `country:${voteRecord.country}`, label: voteRecord.country });
  CONTINENTS.forEach((c) => scopeDefs.push({ id: `continent:${c}`, label: c }));

  // distribution
  const dist =
    distribution &&
    MOODS.map((m, i) => ({
      ...m,
      pct: distribution.levels[i]?.pct ?? 0,
    }));
  const distMode = dist ? dist.reduce((a, b) => (b.pct > a.pct ? b : a), dist[0]) : null;
  const distHasData = dist ? dist.some((d) => d.pct > 0) : false;

  return (
    <div style={{ padding: "58px 22px 118px" }}>
      <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733" }}>Trends</div>
      <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 2, marginBottom: 18 }}>How the world&apos;s mood is moving</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[7, 30].map((r) => {
          const sel = trendRange === r;
          return (
            <button
              key={r}
              onClick={() => {
                trackEvent("trend_range_toggle", { range: r });
                setTrendRange(r as 7 | 30);
              }}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 14,
                fontSize: 13.5,
                fontWeight: 800,
                fontFamily: "Fredoka",
                background: sel ? "#2B2733" : "#fff",
                color: sel ? "#fff" : "#9B93A6",
                boxShadow: sel ? "none" : "0 6px 18px -14px rgba(90,60,120,.5)",
              }}
            >
              {r} days
            </button>
          );
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 28, padding: "22px 18px 18px", boxShadow: "0 16px 36px -24px rgba(90,60,120,.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 19, whiteSpace: "nowrap", color: trendMood.color }}>
            {series[series.length - 1].toFixed(1)}
            <span style={{ fontSize: 13, color: "#9B93A6" }}> /7</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: deltaColor }}>{deltaLabel}</div>
        </div>
        <svg viewBox="0 0 302 132" width="100%" height="150" preserveAspectRatio="none" style={{ overflow: "visible" }}>
          <line x1="6" y1="112" x2="296" y2="112" stroke="#EFE9F3" strokeWidth={1.5} />
          <line x1="6" y1="63" x2="296" y2="63" stroke="#F4F0F8" strokeWidth={1.5} strokeDasharray="3 4" />
          {hasRef && (
            <polyline points={refPts} fill="none" stroke="#D9CFE6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 5" />
          )}
          <path d={areaPath} fill={trendMood.color} opacity={0.12} />
          <polyline points={linePts} fill="none" stroke={trendMood.color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={X(series.length - 1)} cy={Y(series[series.length - 1])} r={5.5} fill={trendMood.color} stroke="#fff" strokeWidth={2.5} />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, fontWeight: 800, color: "#B7AEC4" }}>
          <span>{firstLabel}</span>
          <span>Today</span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#9B93A6", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 9 }}>Compare</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {scopeDefs.map((d) => {
            const sel = trendScope === d.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  trackEvent("trend_scope_change", { scope: d.id });
                  setTrendScope(d.id);
                }}
                style={{
                  padding: "9px 15px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  background: sel ? trendMood.color : "#F6F1F9",
                  color: sel ? "#fff" : "#6B6478",
                  border: `1.5px solid ${sel ? trendMood.color : "#ECE3F1"}`,
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        {!voted && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: "#B0A8BE", fontWeight: 700, lineHeight: 1.5 }}>
            Check in on the Vote tab to line your country up against the global trend.
          </div>
        )}
        {hasRef && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#9B93A6" }}>
            <span style={{ width: 18, height: 0, borderTop: "2.5px dashed #D9CFE6" }} /> dashed line = global average
          </div>
        )}
      </div>

      <div style={{ marginTop: 22, background: "#fff", borderRadius: 28, padding: "22px 20px", boxShadow: "0 16px 36px -24px rgba(90,60,120,.5)" }}>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 18, color: "#2B2733" }}>Today&apos;s mood mix</div>
        {distHasData && dist && distMode ? (
          <>
            <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 2, marginBottom: 16 }}>
              Most of the world is feeling <b style={{ color: "#2B2733" }}>{distMode.label}</b> · {Math.round(distMode.pct)}% of check-ins
            </div>
            <div style={{ display: "flex", height: 22, borderRadius: 999, overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(90,60,120,.06)" }}>
              {dist.map((d) => (
                <div key={d.level} style={{ width: `${d.pct.toFixed(2)}%`, background: d.color, height: "100%" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 16, alignItems: "center" }}>
              {dist.map((d) => (
                <div key={d.level} style={{ display: "flex", flex: "1 1 0%", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <MoodFace color={d.color} mouth={d.mouth} size={26} eyeMouthColor="rgba(28,22,42,.5)" />
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "#6B6478" }}>{Math.round(d.pct)}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 8 }}>No check-ins yet today to show a mix.</div>
        )}
      </div>
    </div>
  );
}
