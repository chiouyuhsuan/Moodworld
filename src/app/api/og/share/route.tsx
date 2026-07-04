import { ImageResponse } from "next/og";
import { MOODS, moodByLevel, SHARE_MESSAGES } from "@/lib/moods";

export const runtime = "edge";

// GET /api/og/share?m=<mood 1-7>&c=<country>&ca=<country avg>&wa=<world avg>&e=<message index>
//
// Renders the personalized share card: the mood the person picked, their
// country's average today vs. the world's average today, and a short
// encouragement line — the actual image that shows up when a MoodWorld link
// is shared on X/Threads (see src/app/share/page.tsx, which points its
// Open Graph image here). Deliberately reads everything from the query
// string rather than hitting the database again — the values were already
// known client-side at the moment of sharing, and baking them into the URL
// means the image is fast, cacheable, and reproducible from the link alone.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const moodRaw = Number(searchParams.get("m"));
  const mood = Number.isFinite(moodRaw) ? Math.max(1, Math.min(7, Math.round(moodRaw))) : 4;
  const country = (searchParams.get("c") || "the world").slice(0, 40);
  const countryAvgRaw = Number(searchParams.get("ca"));
  const countryAvg = Number.isFinite(countryAvgRaw) ? countryAvgRaw : null;
  const worldAvgRaw = Number(searchParams.get("wa"));
  const worldAvg = Number.isFinite(worldAvgRaw) ? worldAvgRaw : null;
  const eRaw = Number(searchParams.get("e"));
  const eIdx = Number.isFinite(eRaw) && eRaw >= 0 && eRaw < SHARE_MESSAGES.length ? eRaw : 20;

  const m = moodByLevel(mood);
  const message = SHARE_MESSAGES[eIdx];

  let compareLine: string | null = null;
  if (countryAvg !== null && worldAvg !== null) {
    const diff = Math.round((countryAvg - worldAvg) * 10) / 10;
    if (Math.abs(diff) < 0.1) compareLine = `Right at the world average today`;
    else if (diff > 0) compareLine = `${diff.toFixed(1)} above the world average today`;
    else compareLine = `${Math.abs(diff).toFixed(1)} below the world average today`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(155deg, ${m.color} 0%, ${m.color2} 100%)`,
          padding: "56px 64px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* decorative blobs */}
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 340,
            borderRadius: 999,
            background: "rgba(255,255,255,.14)",
            top: -140,
            right: -100,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: 999,
            background: "rgba(255,255,255,.10)",
            bottom: -120,
            left: -80,
            display: "flex",
          }}
        />

        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "rgba(255,255,255,.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🙂
          </div>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>MoodWorld</div>
        </div>

        {/* main row: face + numbers */}
        <div style={{ display: "flex", alignItems: "center", gap: 46, marginTop: 34 }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 999,
              background: "rgba(255,255,255,.97)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 20px 40px rgba(0,0,0,.18)",
            }}
          >
            <svg width="120" height="120" viewBox="0 0 100 100">
              <circle cx="34" cy="40" r="6.5" fill={m.color} />
              <circle cx="66" cy="40" r="6.5" fill={m.color} />
              <path d={m.mouth} stroke={m.color} strokeWidth="7" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "rgba(255,255,255,.85)", fontSize: 22, fontWeight: 700 }}>
              I&apos;m feeling
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div style={{ color: "#fff", fontSize: 88, fontWeight: 800, lineHeight: 1 }}>{m.label}</div>
              <div style={{ color: "rgba(255,255,255,.8)", fontSize: 40, fontWeight: 700 }}>{mood}/7</div>
            </div>
          </div>
        </div>

        {/* comparison card */}
        <div
          style={{
            display: "flex",
            marginTop: 32,
            background: "rgba(255,255,255,.95)",
            borderRadius: 26,
            padding: "22px 30px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#9B93A6", textTransform: "uppercase", letterSpacing: 1 }}>
              {country}
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#2B2733" }}>
              {countryAvg !== null ? `${countryAvg.toFixed(1)}/7` : "—"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#9B93A6", textTransform: "uppercase", letterSpacing: 1 }}>
              World today
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#2B2733" }}>
              {worldAvg !== null ? `${worldAvg.toFixed(1)}/7` : "—"}
            </div>
          </div>
        </div>
        {compareLine && (
          <div style={{ display: "flex", marginTop: 14, color: "rgba(255,255,255,.92)", fontSize: 20, fontWeight: 700 }}>
            {compareLine}
          </div>
        )}

        {/* encouragement + CTA */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 14 }}>
          <div style={{ display: "flex", color: "#fff", fontSize: 24, fontWeight: 700, lineHeight: 1.4, maxWidth: 900 }}>
            {message}
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: "rgba(255,255,255,.95)",
              color: "#E85535",
              borderRadius: 999,
              padding: "12px 26px",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            Tap in at moodworld.vercel.app
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
