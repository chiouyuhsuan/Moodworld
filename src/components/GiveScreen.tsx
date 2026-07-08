"use client";

import { useState } from "react";
import type { GiveSummary } from "@/lib/types";
import { adsConfigured, showRewardedAd } from "@/lib/ads";

type Props = {
  summary: GiveSummary | null;
  fingerprint: string;
  today: string;
  onCredited: () => void;
};

export default function GiveScreen({ summary, fingerprint, today, onCredited }: Props) {
  const goal = summary?.monthly_goal ?? 75000;
  const raised = summary?.raised_this_month ?? 0;
  const pct = Math.min(100, (raised / goal) * 100);
  const donatedPct = summary?.donated_pct ?? 65;
  const opsPct = summary?.ops_pct ?? 35;
  const you = summary?.you;

  const checkin = summary?.checkin_giving;
  const checkinCap = checkin?.monthly_cap ?? 3000;
  const checkinRaised = checkin?.raised_this_month ?? 0;
  const checkinPct = Math.min(100, (checkinRaised / checkinCap) * 100);

  const configured = adsConfigured();
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "no-fill">("idle");

  const handleWatchAd = async () => {
    if (!configured || status === "loading") return;
    setStatus("loading");
    try {
      const result = await showRewardedAd();
      if (!result.completed || !result.token) {
        setStatus("no-fill");
        return;
      }
      const res = await fetch("/api/give/ad-watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint, date: today, ad_network: "web", verification: result.token }),
      });
      if (res.ok) {
        setStatus("idle");
        onCredited();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div style={{ padding: "58px 22px 118px" }}>
      <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733" }}>Give</div>
      <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, marginTop: 2, marginBottom: 18 }}>
        Turn a good moment into a little good.
      </div>

      <div
        style={{
          background: "linear-gradient(155deg,#F5A63B 0%,#EE6B4D 100%)",
          borderRadius: 30,
          padding: "26px 22px 24px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 42px -22px #EE6B4D",
        }}
      >
        <div style={{ position: "absolute", width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,.13)", top: -64, right: -46 }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 24, lineHeight: 1.15 }}>
            Feeling good?
            <br />
            Pass it on.
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.55, opacity: 0.95, marginTop: 10 }}>
            Tap the ad below. The ad revenue — minus what it costs to run MoodWorld — goes to mental-health support.
          </div>
          <button
            disabled={!configured || status === "loading"}
            onClick={handleWatchAd}
            style={{
              marginTop: 18,
              width: "100%",
              background: configured ? "#fff" : "rgba(255,255,255,.55)",
              color: "#E85535",
              borderRadius: 16,
              padding: 15,
              fontSize: 15.5,
              fontWeight: 700,
              fontFamily: "Fredoka",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: configured ? "0 12px 24px -12px rgba(0,0,0,.3)" : "none",
            }}
          >
            {status === "loading" ? "Opening…" : "Tap the ad"}
            {!configured && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: ".4px",
                  background: "rgba(255,255,255,.6)",
                  color: "#B2500F",
                  borderRadius: 999,
                  padding: "3px 8px",
                }}
              >
                COMING SOON
              </span>
            )}
          </button>
          {status === "no-fill" && (
            <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 8 }}>
              Couldn&apos;t open the ad — check your popup blocker and try again.
            </div>
          )}
          {status === "error" && (
            <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 8 }}>
              Something went wrong — try again.
            </div>
          )}
          <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, opacity: 0.9, marginTop: 10 }}>
            {you ? you.today_ads : 0} tapped today · every bit adds up
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 26, padding: 20, marginTop: 14, boxShadow: "0 16px 36px -24px rgba(90,60,120,.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#9B93A6", textTransform: "uppercase", letterSpacing: ".5px" }}>Raised this month</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#F2823C" }}>{Math.round(pct)}%</div>
        </div>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 34, color: "#2B2733", marginTop: 4 }}>
          ${raised.toLocaleString("en-US")}
        </div>
        <div style={{ height: 10, background: "#F1ECF5", borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#F5A63B,#EE6B4D)", borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#9B93A6", marginTop: 8 }}>
          of ${goal.toLocaleString("en-US")} goal · donated to mental-health nonprofits
        </div>
      </div>

      {you && you.lifetime_ads > 0 && (
        <div style={{ background: "#FFF0E4", borderRadius: 22, padding: "18px 20px", marginTop: 12, display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "#fff",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              boxShadow: "0 8px 18px -10px rgba(238,107,77,.6)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EE6B4D" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#C08A5E", textTransform: "uppercase", letterSpacing: ".5px" }}>Your part</div>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 17, color: "#2B2733" }}>
              {you.lifetime_ads} {you.lifetime_ads === 1 ? "ad" : "ads"} · ${you.funded.toFixed(2)} raised
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#9B7B62", marginTop: 1 }}>
              that&apos;s {you.lifetime_ads} small {you.lifetime_ads === 1 ? "moment" : "moments"} passed on
            </div>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 26, padding: 20, marginTop: 12, boxShadow: "0 16px 36px -24px rgba(90,60,120,.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#9B93A6", textTransform: "uppercase", letterSpacing: ".5px" }}>
            Check-in giving
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#F2823C" }}>{Math.round(checkinPct)}%</div>
        </div>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 34, color: "#2B2733", marginTop: 4 }}>
          NT${checkinRaised.toLocaleString("en-US")}
        </div>
        <div style={{ height: 10, background: "#F1ECF5", borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${checkinPct}%`, background: "linear-gradient(90deg,#F5A63B,#EE6B4D)", borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#9B93A6", marginTop: 8 }}>
          of NT${checkinCap.toLocaleString("en-US")} monthly cap · NT$1 pledged every 7 check-ins, from everyone worldwide
        </div>
        {checkin?.cap_reached && (
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#E85535", marginTop: 8, lineHeight: 1.5 }}>
            This month&apos;s cap is reached — thank you for all the check-ins. 💛
          </div>
        )}
        {!!checkin && checkin.you_this_month > 0 && (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#F2823C", marginTop: 8 }}>
            You&apos;ve personally triggered {checkin.you_this_month} × NT$1 this month
          </div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 22, padding: 20, marginTop: 12, boxShadow: "0 14px 32px -26px rgba(90,60,120,.5)" }}>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 16, color: "#2B2733" }}>Where your good goes</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#6B6478", lineHeight: 1.55, marginTop: 6 }}>
          The donated share supports vetted mental-health nonprofits — crisis lines, low-cost counseling, and youth support programs.
        </div>
      </div>

      <div style={{ background: "#F6F1F9", borderRadius: 22, padding: 20, marginTop: 12 }}>
        <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 15, color: "#2B2733" }}>The honest bit</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#8A8296", lineHeight: 1.6, marginTop: 6 }}>
          This is ad revenue, not a guaranteed donation. We keep a share to run MoodWorld and donate the rest — we can&apos;t promise
          every cent goes out. We publish the totals and the split each month.
          {!configured && " (Ads aren't live yet — the split below is the plan, not a current payout.)"} Check-in giving above is
          a pledge tracked from real check-ins, capped and fulfilled by hand each month — not an automatic payment.
        </div>
        <div style={{ display: "flex", height: 14, borderRadius: 99, overflow: "hidden", marginTop: 14 }}>
          <div style={{ width: `${donatedPct}%`, background: "#F2823C" }} />
          <div style={{ width: `${opsPct}%`, background: "#C9BFD6" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11.5, fontWeight: 800 }}>
          <span style={{ color: "#F2823C" }}>≈{donatedPct}% donated</span>
          <span style={{ color: "#9B93A6" }}>≈{opsPct}% runs MoodWorld</span>
        </div>
      </div>
    </div>
  );
}
