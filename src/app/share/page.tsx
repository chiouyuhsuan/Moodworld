import type { Metadata } from "next";
import { moodByLevel, SHARE_MESSAGES } from "@/lib/moods";
import MoodFace from "@/components/MoodFace";

// This is a plain Server Component (no "use client") specifically so it can
// export generateMetadata — the root layout's metadata is static, but every
// shared link needs its own Open Graph image (the mood/country/world numbers
// baked into the URL by VoteScreen when someone taps Share). A human who
// actually opens the link never really needs this page to do much beyond
// echoing the same numbers and inviting them to check in themselves — X/
// Threads only ever render the OG image + the tweet/post text, they don't
// screenshot this page.

type Search = { m?: string; c?: string; ca?: string; wa?: string; e?: string };

// A single "who's feeling what" row — same visual language as the Global
// tab's leaderboard rows (MoodFace + label + proportional bar + value), so
// the share page reads as an extension of the app rather than a one-off
// design. Two of these (local country, world) replace the old plain
// side-by-side numbers.
function StatRow({ label, value }: { label: string; value: number }) {
  const mo = moodByLevel(value);
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 10px 26px -22px rgba(90,60,120,.5)",
      }}
    >
      <MoodFace color={mo.color} mouth={mo.mouth} size={32} eyeMouthColor="rgba(28,22,42,.5)" />
      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: "#9B93A6", textTransform: "uppercase", letterSpacing: ".4px" }}>
          {label}
        </div>
        <div style={{ height: 7, background: "#F1ECF5", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.max(4, (value / 7) * 100).toFixed(0)}%`,
              background: mo.color,
              borderRadius: 99,
            }}
          />
        </div>
      </div>
      <div style={{ fontFamily: "Fredoka", fontWeight: 700, fontSize: 19, color: mo.color }}>{value.toFixed(1)}</div>
    </div>
  );
}

function parse(sp: Search) {
  const moodRaw = Number(sp.m);
  const mood = Number.isFinite(moodRaw) ? Math.max(1, Math.min(7, Math.round(moodRaw))) : 4;
  const country = (sp.c || "the world").slice(0, 40);
  const caRaw = Number(sp.ca);
  const countryAvg = Number.isFinite(caRaw) ? caRaw : null;
  const waRaw = Number(sp.wa);
  const worldAvg = Number.isFinite(waRaw) ? waRaw : null;
  const eRaw = Number(sp.e);
  const eIdx = Number.isFinite(eRaw) && eRaw >= 0 && eRaw < SHARE_MESSAGES.length ? eRaw : 20;
  return { mood, country, countryAvg, worldAvg, message: SHARE_MESSAGES[eIdx] };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const sp = await searchParams;
  const { mood, country, message } = parse(sp);
  const m = moodByLevel(mood);
  const qs = new URLSearchParams({
    m: String(mood),
    c: sp.c || "",
    ca: sp.ca || "",
    wa: sp.wa || "",
    e: sp.e || "",
  }).toString();
  const title = `${country} is feeling ${m.label} today — MoodWorld`;
  const imageUrl = `/api/og/share?${qs}`;

  return {
    title,
    description: message,
    openGraph: {
      title,
      description: message,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: message,
      images: [imageUrl],
    },
  };
}

export default async function SharePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { mood, country, countryAvg, worldAvg, message } = parse(sp);
  const m = moodByLevel(mood);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#FFF7EC",
          borderRadius: 36,
          overflow: "hidden",
          boxShadow: "0 40px 90px -30px rgba(90,60,120,.55)",
          padding: "40px 26px 34px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            margin: "0 auto",
            boxShadow: `0 14px 30px -14px ${m.color}`,
            borderRadius: "50%",
          }}
        >
          <MoodFace color={m.color} mouth={m.mouth} size={96} />
        </div>
        <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 24, color: "#2B2733", marginTop: 18 }}>
          I&apos;m feeling {m.label} today
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#F6F1F9",
            borderRadius: 999,
            padding: "5px 13px",
            fontSize: 12.5,
            fontWeight: 800,
            color: "#6B6478",
            marginTop: 10,
          }}
        >
          📍 {country}
        </div>
        <div style={{ fontSize: 15, color: "#6B6478", fontWeight: 600, marginTop: 14, lineHeight: 1.6 }}>
          {message}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
          {countryAvg !== null && <StatRow label={country} value={countryAvg} />}
          {worldAvg !== null && <StatRow label="World today" value={worldAvg} />}
          {countryAvg === null && worldAvg === null && (
            <div style={{ fontSize: 13, color: "#9B93A6", fontWeight: 700 }}>No data yet today.</div>
          )}
        </div>
        <a
          href="/"
          style={{
            display: "block",
            marginTop: 26,
            background: "#2B2733",
            color: "#fff",
            borderRadius: 16,
            padding: "15px 20px",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "sans-serif",
            textDecoration: "none",
          }}
        >
          Tap in with your own mood →
        </a>
      </div>
    </div>
  );
}
