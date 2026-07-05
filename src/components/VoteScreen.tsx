"use client";

import { useEffect, useMemo, useState } from "react";
import { MOODS, ENCOURAGEMENT, VOTE_HINT, moodByLevel, pickShareMessageIndex } from "@/lib/moods";
import { COUNTRY_NAMES, AGE_RANGES, ageRangeDisplay } from "@/lib/referenceData";
import MoodFace from "./MoodFace";
import type { TabId } from "./TabBar";
import type { Note } from "@/lib/types";

type VoteRecord = { mood: number; country: string; city: string | null; age_range: string };

type Props = {
  todayLabel: string;
  totalVotesToday: number;
  pick: number | null;
  setPick: (n: number) => void;
  country: string;
  setCountry: (s: string) => void;
  city: string;
  setCity: (s: string) => void;
  age: string;
  setAge: (s: string) => void;
  voted: boolean;
  voteRecord: VoteRecord | null;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  countdown: string;
  onGoTab: (t: TabId) => void;
  countryAvg: number | null;
  worldAverage: number | null;
  fingerprint: string;
  today: string;
};

const SITE_URL = "https://moodworld.vercel.app";
const NOTE_MAX_LEN = 50;

export default function VoteScreen(props: Props) {
  const {
    todayLabel,
    totalVotesToday,
    pick,
    setPick,
    country,
    setCountry,
    city,
    setCity,
    age,
    setAge,
    voted,
    voteRecord,
    submitting,
    submitError,
    onSubmit,
    countdown,
    onGoTab,
    countryAvg,
    worldAverage,
    fingerprint,
    today,
  } = props;

  // "Note from a stranger" — a random anonymous note (curated or already
  // manually-approved user submissions, see src/app/api/notes/random),
  // delivered as a two-step popup rather than an always-visible card: it
  // waits 2s after landing on the "voted" screen, then shows the note +
  // reaction step, then (after reacting) slides straight into the "leave
  // your own note" step. Shown at most once per day per device (tracked in
  // localStorage) so revisiting the Vote tab later the same day doesn't
  // re-trigger it every time this component remounts.
  const [note, setNote] = useState<Note | null>(null);
  const [noteReaction, setNoteReaction] = useState<"inspiring" | "not_helpful" | null>(null);
  const [popupStep, setPopupStep] = useState<"hidden" | "receive" | "compose">("hidden");

  useEffect(() => {
    if (!fingerprint) return;
    let cancelled = false;
    fetch(`/api/notes/random?fingerprint=${encodeURIComponent(fingerprint)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setNote(data.note ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fingerprint]);

  useEffect(() => {
    if (!voted || !voteRecord || !note || !today) return;
    const seenKey = `moodworld_note_popup_${today}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(seenKey)) return;
    const t = setTimeout(() => {
      setPopupStep("receive");
      if (typeof window !== "undefined") window.localStorage.setItem(seenKey, "1");
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voted, !!voteRecord, !!note, today]);

  const closePopup = () => setPopupStep("hidden");

  const reactToNote = (type: "inspiring" | "not_helpful") => {
    if (!note || noteReaction) return;
    setNoteReaction(type);
    fetch("/api/notes/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint, noteId: note.id, reaction: type }),
    }).catch(() => {});
    setPopupStep("compose");
  };

  // Leave-a-note form — always starts as status='pending' server-side and
  // only ever becomes visible to anyone else after manual review (see
  // src/app/api/notes/submit). One per person per day, enforced by the DB;
  // a 409 here just means they already sent one today, so it's treated the
  // same as a successful submit rather than shown as an error.
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteSubmitted, setNoteSubmitted] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const skipNote = () => setPopupStep("hidden");

  const submitNote = async () => {
    if (!voteRecord || noteSubmitting) return;
    const trimmed = noteText.trim();
    if (trimmed.length < 3) {
      setNoteError("A little longer, please.");
      return;
    }
    setNoteSubmitting(true);
    setNoteError(null);
    try {
      const res = await fetch("/api/notes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint,
          date: today,
          mood: voteRecord.mood,
          country: voteRecord.country,
          text: trimmed,
        }),
      });
      const data = await res.json();
      if (data.ok || data.error === "already_submitted_today") {
        setNoteSubmitted(true);
        setTimeout(() => setPopupStep("hidden"), 1400);
      } else if (data.error === "blocked_content") {
        setNoteError("That didn't pass our basic filter — try rewording it.");
      } else if (data.error === "invalid_length") {
        setNoteError(`Keep it between 3 and ${NOTE_MAX_LEN} characters.`);
      } else {
        setNoteError("Couldn't submit right now — try again later.");
      }
    } catch {
      setNoteError("Couldn't reach MoodWorld — check your connection.");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const hasPick = !!pick;
  const heroMood = pick ? moodByLevel(pick) : MOODS[3];

  // Share card data — computed once per vote (not re-rolled on every
  // re-render) since the encouragement message index gets baked into the
  // share URL and should stay stable for as long as this vote is shown.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shareData = useMemo(() => {
    if (!voteRecord) return null;
    const idx = pickShareMessageIndex(voteRecord.mood);
    const m = moodByLevel(voteRecord.mood);
    const qs = new URLSearchParams({
      m: String(voteRecord.mood),
      c: voteRecord.country,
      ca: countryAvg !== null ? countryAvg.toFixed(1) : "",
      wa: worldAverage !== null ? worldAverage.toFixed(1) : "",
      e: String(idx),
    }).toString();
    const shareUrl = `${SITE_URL}/share?${qs}`;
    const compareText =
      countryAvg !== null && worldAverage !== null
        ? ` ${voteRecord.country} is at ${countryAvg.toFixed(1)}/7 today (world: ${worldAverage.toFixed(1)}/7).`
        : "";
    const xText = `Feeling ${m.label.toLowerCase()} today — ${voteRecord.mood}/7.${compareText} How about you?`;
    const threadsText = `Today I'm feeling ${m.label.toLowerCase()} (${voteRecord.mood}/7) 🙂${compareText} Go check in and see how you compare 👇`;
    return {
      shareUrl,
      xHref: `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(shareUrl)}`,
      threadsHref: `https://www.threads.com/intent/post?text=${encodeURIComponent(threadsText)}&url=${encodeURIComponent(shareUrl)}`,
    };
  }, [voteRecord?.mood, voteRecord?.country, countryAvg, worldAverage]);

  if (voted && voteRecord) {
    const heroM = moodByLevel(voteRecord.mood);
    const place = voteRecord.city ? `${voteRecord.city}, ${voteRecord.country}` : voteRecord.country;
    return (
      <div style={{ padding: "58px 22px 118px" }}>
        <div
          style={{
            background: `linear-gradient(160deg, ${heroM.color} 0%, ${heroM.color2} 100%)`,
            borderRadius: 30,
            padding: "30px 22px 26px",
            textAlign: "center",
            boxShadow: `0 20px 40px -20px ${heroM.color}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255,255,255,.14)",
              top: -60,
              right: -50,
            }}
          />
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,.24)",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: ".4px",
              }}
            >
              ✓ CHECKED IN TODAY
            </div>
            <div style={{ width: 128, height: 128, margin: "16px auto 0" }}>
              <MoodFace color="rgba(255,255,255,.96)" mouth={heroM.mouth} size={128} eyeMouthColor={heroM.color} />
            </div>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 26, color: "#fff", marginTop: 10 }}>
              Feeling {heroM.label}
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.9)", fontWeight: 700, marginTop: 4 }}>
              {place} · {ageRangeDisplay(voteRecord.age_range)}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "18px 20px",
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 14px 34px -24px rgba(90,60,120,.5)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "#FFF0E4",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F2823C" strokeWidth={2.2} strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l2.5 1.5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#9B93A6", textTransform: "uppercase", letterSpacing: ".5px" }}>
              Next check-in
            </div>
            <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 19, color: "#2B2733" }}>in {countdown}</div>
          </div>
        </div>

        {shareData && (
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: "18px 20px",
              marginTop: 12,
              boxShadow: "0 14px 34px -24px rgba(90,60,120,.5)",
            }}
          >
            <div style={{ fontSize: 13.5, color: "#6B6478", fontWeight: 700, lineHeight: 1.5, marginBottom: 12 }}>
              Share how you&apos;re doing — invite a friend to tap in too.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a
                href={shareData.xHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "#000",
                  color: "#fff",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "Fredoka",
                  textDecoration: "none",
                }}
              >
                𝕏 Share
              </a>
              <a
                href={shareData.threadsHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "#2B2733",
                  color: "#fff",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "Fredoka",
                  textDecoration: "none",
                }}
              >
                @ Threads
              </a>
            </div>
          </div>
        )}

        {popupStep !== "hidden" && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(43,39,51,.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 22,
              zIndex: 50,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 360,
                background: "#fff",
                borderRadius: 24,
                padding: "22px 20px 20px",
                position: "relative",
                boxShadow: "0 30px 70px -20px rgba(0,0,0,.35)",
              }}
            >
              <button
                onClick={closePopup}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: "#F6F1F9",
                  color: "#9B93A6",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>

              {popupStep === "receive" && note && (
                <>
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: "#9B93A6",
                      textTransform: "uppercase",
                      letterSpacing: ".5px",
                      marginBottom: 10,
                      paddingRight: 26,
                    }}
                  >
                    💬 A note from someone else
                  </div>
                  <div style={{ fontSize: 16, color: "#2B2733", fontWeight: 700, lineHeight: 1.55, marginBottom: 18 }}>
                    &ldquo;{note.text}&rdquo;
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => reactToNote("inspiring")}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        background: "#FFF3E7",
                        color: "#E85535",
                        borderRadius: 14,
                        padding: "12px 12px",
                        fontSize: 13.5,
                        fontWeight: 800,
                        fontFamily: "Fredoka",
                      }}
                    >
                      🌟 It&apos;s inspiring
                    </button>
                    <button
                      onClick={() => reactToNote("not_helpful")}
                      style={{
                        flex: 1,
                        background: "#F6F1F9",
                        color: "#6B6478",
                        borderRadius: 14,
                        padding: "12px 12px",
                        fontSize: 13.5,
                        fontWeight: 800,
                        fontFamily: "Fredoka",
                      }}
                    >
                      Not helpful
                    </button>
                  </div>
                </>
              )}

              {popupStep === "compose" && (
                <>
                  <div
                    style={{
                      fontFamily: "Fredoka",
                      fontWeight: 600,
                      fontSize: 18,
                      color: "#2B2733",
                      lineHeight: 1.3,
                      marginBottom: 14,
                      paddingRight: 26,
                    }}
                  >
                    Want to leave a note for the next person?
                  </div>
                  {noteSubmitted ? (
                    <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700, textAlign: "center", padding: "16px 0" }}>
                      Thanks — it&apos;s in the queue for review. 💛
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value.slice(0, NOTE_MAX_LEN))}
                        placeholder="Something kind, honest, or encouraging…"
                        rows={2}
                        style={{
                          width: "100%",
                          background: "#F6F1F9",
                          border: "1.5px solid #ECE3F1",
                          borderRadius: 16,
                          padding: "12px 14px",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#2B2733",
                          fontFamily: "inherit",
                          resize: "none",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                        <span style={{ fontSize: 11, color: "#C3BBCE", fontWeight: 700 }}>
                          {noteText.length}/{NOTE_MAX_LEN}
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={skipNote}
                            style={{
                              background: "#F6F1F9",
                              color: "#6B6478",
                              borderRadius: 12,
                              padding: "9px 14px",
                              fontSize: 13,
                              fontWeight: 800,
                              fontFamily: "Fredoka",
                            }}
                          >
                            Nahh, I&apos;m fine
                          </button>
                          <button
                            onClick={submitNote}
                            disabled={noteSubmitting || noteText.trim().length < 3}
                            style={{
                              background: noteText.trim().length >= 3 ? "#2B2733" : "#E4DBEC",
                              color: "#fff",
                              borderRadius: 12,
                              padding: "9px 16px",
                              fontSize: 13,
                              fontWeight: 800,
                              fontFamily: "Fredoka",
                            }}
                          >
                            {noteSubmitting ? "Sending…" : "Submit"}
                          </button>
                        </div>
                      </div>
                      {noteError && (
                        <div style={{ fontSize: 12, color: "#E85535", fontWeight: 700, marginTop: 8 }}>{noteError}</div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "18px 20px",
            marginTop: 12,
            boxShadow: "0 14px 34px -24px rgba(90,60,120,.5)",
          }}
        >
          <div style={{ fontSize: 13.5, color: "#6B6478", fontWeight: 700, lineHeight: 1.5 }}>
            You nudged <b style={{ color: "#2B2733" }}>{voteRecord.country}</b> today. See how it&apos;s shaping the world →
          </div>
          <button
            onClick={() => onGoTab("global")}
            style={{
              marginTop: 12,
              width: "100%",
              background: "#2B2733",
              color: "#fff",
              borderRadius: 14,
              padding: 13,
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "Fredoka",
            }}
          >
            Explore the data
          </button>
        </div>

        <div
          style={{
            background: "linear-gradient(150deg,#FFF3E7,#FCEAF0)",
            borderRadius: 24,
            padding: "18px 20px",
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#fff",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              boxShadow: "0 8px 18px -10px rgba(238,107,77,.5)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EE6B4D" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#6B6478", lineHeight: 1.5 }}>
              Feeling something today? <b style={{ color: "#2B2733" }}>Turn it into a little good.</b>
            </div>
          </div>
          <button
            onClick={() => onGoTab("give")}
            style={{
              background: "#EE6B4D",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "Fredoka",
              flexShrink: 0,
            }}
          >
            Give
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = hasPick && !!country && !!age && !submitting;

  return (
    <div style={{ padding: "58px 22px 118px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 15, color: "#F2823C", letterSpacing: ".3px" }}>
            MoodWorld
          </div>
          <div
            style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 28, color: "#2B2733", lineHeight: 1.12, marginTop: 4 }}
          >
            How&apos;s your
            <br />
            mood today?
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "#9B93A6", fontWeight: 700, lineHeight: 1.3, paddingTop: 6 }}>
          {todayLabel}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          background: "#fff",
          borderRadius: 999,
          padding: "9px 15px 9px 13px",
          boxShadow: "0 10px 26px -20px rgba(90,60,120,.5)",
          width: "fit-content",
          marginBottom: 18,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#F2823C",
            boxShadow: "0 0 0 4px rgba(242,130,60,.18)",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "#2B2733", fontFamily: "Fredoka" }}>
          {totalVotesToday.toLocaleString("en-US")}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#9B93A6" }}>checked in today</span>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 30, padding: "26px 20px 22px", boxShadow: "0 14px 34px -22px rgba(90,60,120,.5)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <MoodFace color={heroMood.color} mouth={heroMood.mouth} size={130} />
          <div
            style={{
              fontFamily: "Fredoka",
              fontWeight: 600,
              fontSize: 23,
              marginTop: 8,
              color: hasPick ? heroMood.color : "#C3BBCE",
              minHeight: 28,
            }}
          >
            {hasPick ? heroMood.label : "Tap a face"}
          </div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.55,
              marginTop: 8,
              padding: "0 8px",
              minHeight: 44,
              color: hasPick ? heroMood.color2 : "#A79FB4",
            }}
          >
            {hasPick && pick ? ENCOURAGEMENT[pick - 1] : VOTE_HINT}
          </div>
        </div>

        <div style={{ display: "flex", width: "100%", marginTop: 20, alignItems: "center" }}>
          {MOODS.map((m) => {
            const sel = m.level === pick;
            return (
              <button
                key={m.level}
                onClick={() => setPick(m.level)}
                style={{ display: "flex", flex: "1 1 0%", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 0, minWidth: 0 }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    transition: "transform .18s ease, box-shadow .18s ease",
                    transform: sel ? "scale(1.14) translateY(-5px)" : "scale(1)",
                    boxShadow: sel
                      ? `0 0 0 3px #FFF7EC, 0 0 0 6px ${m.color}, 0 10px 18px -6px ${m.color}`
                      : "0 4px 10px -5px rgba(90,60,120,.35)",
                  }}
                >
                  <MoodFace color={m.color} mouth={m.mouth} size={38} eyeMouthColor="rgba(28,22,42,.55)" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {hasPick && (
        <div style={{ marginTop: 16, background: "#FFFFFF", borderRadius: 30, padding: "22px 20px", boxShadow: "0 14px 34px -22px rgba(90,60,120,.5)" }}>
          <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 16, color: "#2B2733", marginBottom: 14 }}>Two quick things</div>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: "#9B93A6", textTransform: "uppercase", letterSpacing: ".6px" }}>
              Where are you?
            </label>
            {!!country && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C3BBCE" }}>Not right? Tap to change</span>
            )}
          </div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{
                width: "100%",
                appearance: "none",
                background: "#F6F1F9",
                border: "1.5px solid #ECE3F1",
                borderRadius: 16,
                padding: "14px 40px 14px 16px",
                fontSize: 15,
                fontWeight: 700,
                color: "#2B2733",
              }}
            >
              <option value="">Select country…</option>
              {COUNTRY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#B7AEC4", fontSize: 12 }}>
              ▼
            </span>
          </div>

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (optional)"
            style={{
              width: "100%",
              background: "#F6F1F9",
              border: "1.5px solid #ECE3F1",
              borderRadius: 16,
              padding: "14px 16px",
              fontSize: 15,
              fontWeight: 700,
              color: "#2B2733",
              marginBottom: 16,
              fontFamily: "inherit",
            }}
          />

          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#9B93A6", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 7 }}>
            Your age range
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {AGE_RANGES.map((code) => {
              const sel = age === code;
              return (
                <button
                  key={code}
                  onClick={() => setAge(code)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 14,
                    fontSize: 13.5,
                    fontWeight: 800,
                    background: sel ? "#2B2733" : "#F6F1F9",
                    color: sel ? "#fff" : "#6B6478",
                    border: `1.5px solid ${sel ? "#2B2733" : "#ECE3F1"}`,
                  }}
                >
                  {ageRangeDisplay(code)}
                </button>
              );
            })}
          </div>

          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 18,
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "Fredoka",
              color: "#fff",
              background: canSubmit ? `linear-gradient(135deg, ${heroMood.color}, ${heroMood.color2})` : "#E4DBEC",
              boxShadow: canSubmit ? `0 14px 26px -12px ${heroMood.color}` : "none",
              transition: ".2s",
            }}
          >
            {submitting ? "Checking in…" : "Check in my mood"}
          </button>
          {submitError && (
            <div style={{ textAlign: "center", fontSize: 12.5, color: "#E85535", fontWeight: 700, marginTop: 10 }}>{submitError}</div>
          )}
          <div style={{ textAlign: "center", fontSize: 11.5, color: "#B0A8BE", fontWeight: 600, marginTop: 14, lineHeight: 1.5 }}>
            Anonymous · no login · no GPS.
            <br />
            Country is guessed from your connection — tap it to change. We store only your country &amp; age range.
          </div>
        </div>
      )}
    </div>
  );
}
