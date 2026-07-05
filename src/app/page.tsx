"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { trackEvent } from "@/lib/analytics";
import TabBar, { TabId } from "@/components/TabBar";
import VoteScreen from "@/components/VoteScreen";
import GlobalScreen from "@/components/GlobalScreen";
import AgesScreen from "@/components/AgesScreen";
import TrendsScreen from "@/components/TrendsScreen";
import GiveScreen from "@/components/GiveScreen";
import { getFingerprint, todayKey } from "@/lib/fingerprint";
import type { GlobalStats, AgeStats, DistributionStats, TrendStats, GiveSummary } from "@/lib/types";

type VoteRecord = { mood: number; country: string; city: string | null; age_range: string };

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("vote");

  // This is a single-page app (the tab bar never changes the URL), so
  // page-view analytics only ever see "/". Fire a custom event per tab
  // switch instead: GA4 (free, works immediately once NEXT_PUBLIC_GA_
  // MEASUREMENT_ID is set) + Vercel Analytics' track() (its Custom Events
  // report is Pro-plan only, but the call itself is harmless either way).
  useEffect(() => {
    trackEvent("tab_view", { tab });
    track("tab_view", { tab });
  }, [tab]);

  // vote form
  const [pick, setPick] = useState<number | null>(null);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [voted, setVoted] = useState(false);
  const [voteRecord, setVoteRecord] = useState<VoteRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkingVoted, setCheckingVoted] = useState(true);

  // ticking clock for the countdown
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // stats
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [ageStats, setAgeStats] = useState<AgeStats | null>(null);
  const [distStats, setDistStats] = useState<DistributionStats | null>(null);
  const [giveSummary, setGiveSummary] = useState<GiveSummary | null>(null);
  const [trendStats, setTrendStats] = useState<TrendStats | null>(null);
  const [trendScope, setTrendScope] = useState("global");
  const [trendRange, setTrendRange] = useState<7 | 30>(7);
  const [statsLoading, setStatsLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [countryAvg, setCountryAvg] = useState<number | null>(null);

  const fingerprint = useMemo(() => getFingerprint(), []);
  const today = todayKey(new Date(now));

  // Check today's vote once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vote/today?fingerprint=${encodeURIComponent(fingerprint)}&date=${today}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.voted) {
          setVoted(true);
          setVoteRecord(data.vote);
          setPick(data.vote.mood);
          setCountry(data.vote.country);
          setCity(data.vote.city || "");
          setAge(data.vote.age_range);
          setTrendScope((s) => (s === "global" ? "global" : s));
        }
      } catch {
        // network hiccup — treat as not-yet-known, form stays usable
      } finally {
        if (!cancelled) setCheckingVoted(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Best-effort country auto-fill from the visitor's IP (Vercel's
  // x-vercel-ip-country header — no GPS, no third-party call, see
  // src/app/api/geo/route.ts). Only ever fills in an empty field: uses a
  // functional update so it can never clobber a value the "already voted
  // today" check above or the user's own dropdown pick has set. If detection
  // fails (local dev, VPN, etc.) `data.country` is null and the field just
  // stays on the normal "Select country…" placeholder.
  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data) => {
        if (data.country) {
          setCountry((prev) => prev || data.country);
        }
      })
      .catch(() => {});
  }, []);

  // Once we know which country the day's vote belongs to, fetch that
  // country's own average (not just whether it happens to land in the
  // top-5-each-side leaderboard — see src/app/api/stats/country/route.ts).
  // Powers the "Taiwan: 5.7/7 vs World: 5.2/7" comparison on the share card.
  useEffect(() => {
    if (!voteRecord?.country) return;
    let cancelled = false;
    fetch(`/api/stats/country?country=${encodeURIComponent(voteRecord.country)}&date=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCountryAvg(typeof data.average === "number" ? data.average : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [voteRecord?.country, today]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [g, a, d, gv] = await Promise.all([
        fetch(`/api/stats/global?date=${today}`).then((r) => r.json()),
        fetch(`/api/stats/ages?date=${today}`).then((r) => r.json()),
        fetch(`/api/stats/distribution?date=${today}`).then((r) => r.json()),
        fetch(`/api/give/summary?fingerprint=${encodeURIComponent(fingerprint)}&month=${today.slice(0, 7)}`).then((r) => r.json()),
      ]);
      setGlobalStats(g);
      setAgeStats(a);
      setDistStats(d);
      setGiveSummary(gv);
    } catch {
      // leave previous values in place
    } finally {
      setStatsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, fingerprint]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    let cancelled = false;
    setTrendLoading(true);
    fetch(`/api/stats/trend?scope=${encodeURIComponent(trendScope)}&range=${trendRange}&date=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTrendStats(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTrendLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trendScope, trendRange, today]);

  const handleSubmit = useCallback(async () => {
    if (!pick || !country || !age || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint, date: today, mood: pick, country, city, age_range: age }),
      });
      const data = await res.json();
      if (data.ok) {
        setVoted(true);
        setVoteRecord({ mood: data.vote.mood, country: data.vote.country ?? country, city: data.vote.city ?? (city || null), age_range: data.vote.age_range ?? age });
        setTrendScope("global");
        loadStats();
      } else if (data.error === "already_voted_today" && data.vote) {
        setVoted(true);
        setVoteRecord(data.vote);
      } else {
        setSubmitError("Something went wrong — please try again.");
      }
    } catch {
      setSubmitError("Couldn't reach MoodWorld — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [pick, country, age, city, fingerprint, today, submitting, loadStats]);

  // countdown to local midnight
  const nowDate = new Date(now);
  const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1, 0, 0, 0);
  const secsLeft = Math.max(0, Math.floor((midnight.getTime() - nowDate.getTime()) / 1000));
  const countdown = `${Math.floor(secsLeft / 3600)}h ${String(Math.floor((secsLeft % 3600) / 60)).padStart(2, "0")}m ${String(secsLeft % 60).padStart(2, "0")}s`;

  const todayLabel = `${WEEKDAYS[nowDate.getDay()]} ${MONTHS[nowDate.getMonth()]} ${nowDate.getDate()}`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}>
      <div
        style={{
          width: "100%",
          maxWidth: 402,
          height: "min(848px, 100vh)",
          background: "#FFF7EC",
          borderRadius: 44,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 90px -30px rgba(90,60,120,.55), 0 0 0 1px rgba(255,255,255,.6) inset",
        }}
      >
        <div className="scr" style={{ flex: 1, overflowY: "auto", padding: 0 }}>
          {tab === "vote" && (
            <VoteScreen
              todayLabel={todayLabel}
              totalVotesToday={globalStats?.total_checkins ?? 0}
              pick={pick}
              setPick={setPick}
              country={country}
              setCountry={setCountry}
              city={city}
              setCity={setCity}
              age={age}
              setAge={setAge}
              voted={voted}
              voteRecord={voteRecord}
              submitting={submitting || checkingVoted}
              submitError={submitError}
              onSubmit={handleSubmit}
              countdown={countdown}
              onGoTab={setTab}
              countryAvg={countryAvg}
              worldAverage={globalStats?.average ?? null}
              fingerprint={fingerprint}
              today={today}
            />
          )}
          {tab === "global" && <GlobalScreen stats={globalStats} loading={statsLoading && !globalStats} today={today} />}
          {tab === "ages" && (
            <AgesScreen stats={ageStats} loading={statsLoading && !ageStats} voted={voted} voteRecord={voteRecord} onGoTab={setTab} />
          )}
          {tab === "trends" && (
            <TrendsScreen
              trend={trendStats}
              distribution={distStats}
              loading={trendLoading && !trendStats}
              trendScope={trendScope}
              setTrendScope={setTrendScope}
              trendRange={trendRange}
              setTrendRange={setTrendRange}
              voted={voted}
              voteRecord={voteRecord}
            />
          )}
          {tab === "give" && (
            <GiveScreen summary={giveSummary} fingerprint={fingerprint} today={today} onCredited={loadStats} />
          )}
        </div>

        <TabBar active={tab} onChange={setTab} />
      </div>
    </div>
  );
}
