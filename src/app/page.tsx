"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
            />
          )}
          {tab === "global" && <GlobalScreen stats={globalStats} loading={statsLoading && !globalStats} />}
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
          {tab === "give" && <GiveScreen summary={giveSummary} />}
        </div>

        <TabBar active={tab} onChange={setTab} />
      </div>
    </div>
  );
}
