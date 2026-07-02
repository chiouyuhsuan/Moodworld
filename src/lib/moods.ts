// Mood palette, face SVG mouth paths, and copy — ported verbatim from the
// design handoff (README.md "Design Tokens" + MoodWorld.dc.html Component).
// Keep this file as the single source of truth; the frontend and (if ever
// needed) the backend both import from here.

export type Mood = {
  level: number; // 1..7
  label: string;
  color: string;
  color2: string;
  mouth: string; // SVG path `d` for the mouth, viewBox 0 0 100 100
};

export const MOODS: Mood[] = [
  { level: 1, label: "Awful", color: "#6C79D6", color2: "#5866C4", mouth: "M32 71 Q50 52 68 71" },
  { level: 2, label: "Bad", color: "#5B95DB", color2: "#4A82CC", mouth: "M32 69 Q50 56 68 69" },
  { level: 3, label: "Low", color: "#4FB0C0", color2: "#3E9DAD", mouth: "M33 67 Q50 61 67 67" },
  { level: 4, label: "Okay", color: "#F2C14E", color2: "#EDB235", mouth: "M34 65 L66 65" },
  { level: 5, label: "Good", color: "#F5A63B", color2: "#EE9622", mouth: "M33 63 Q50 71 67 63" },
  { level: 6, label: "Great", color: "#F2823C", color2: "#EB6F24", mouth: "M32 61 Q50 76 68 61" },
  { level: 7, label: "Amazing", color: "#EE6B4D", color2: "#E85535", mouth: "M31 60 Q50 83 69 60" },
];

export const ENCOURAGEMENT: string[] = [
  "Sending you some warmth. Rough days don't last forever — showing up still counts.",
  "It's okay to not be okay. Be gentle with yourself today.",
  "Go easy on yourself — a slow day is still a day. One small kind thing for you?",
  "Steady wins. Here's to a calm, even day.",
  "Love that. Carry the good energy with you today.",
  "Keep it up — whatever you're doing, it's working.",
  "Amazing — soak it all in, and pass a little sunshine on.",
];

export const VOTE_HINT =
  "Tap the face that fits. You'll get a little note back — then we'll show you how the whole world is feeling today.";

export function moodByLevel(level: number): Mood {
  const idx = Math.max(0, Math.min(6, Math.round(level) - 1));
  return MOODS[idx];
}

export function clampMood(v: number): number {
  return Math.max(1, Math.min(7, v));
}
