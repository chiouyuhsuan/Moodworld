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

// Share-card messages (src/app/share, src/app/api/og/share) — a bigger, more
// varied pool than ENCOURAGEMENT above, grouped into three tone bands so the
// message actually matches how rough/fine/great the mood was. Index is baked
// into the share URL (?e=<index>) so the same shared link always renders the
// same message — random only at the moment of sharing, deterministic after.
export const SHARE_MESSAGES: string[] = [
  // 0-9: moods 1-2 (Awful/Bad) — gentle, no toxic positivity
  "Rough days don't last forever — showing up still counts.",
  "It's okay to not be okay today. Be gentle with yourself.",
  "Sending some warmth your way. Tomorrow's a new tally.",
  "Bad day, not a bad life. You're allowed to just get through it.",
  "You checked in even on a hard day — that's not nothing.",
  "Low moments pass. You don't have to fix it today.",
  "Whatever today was, you made it to the end of it.",
  "Feelings aren't forecasts. This one will move.",
  "A hard day is still just one day.",
  "No pressure to bounce back fast. Slow is fine too.",
  // 10-19: moods 3-4 (Low/Okay) — steady, unremarkable, that's fine
  "Steady wins. Here's to a calm, even day.",
  "An okay day is still a day you got through.",
  "Not every day needs to be amazing to count.",
  "Middle-of-the-road days keep the world turning too.",
  "Even, calm, and unremarkable — that's a fine place to be.",
  "You don't owe today a five-star review.",
  "Coasting is still moving forward.",
  "Some days are just... fine. Fine is good.",
  "A quiet day has its own kind of value.",
  "Not up, not down — just here, and that's okay.",
  // 20-29: moods 5-7 (Good/Great/Amazing) — celebratory
  "Love that. Carry the good energy with you today.",
  "Keep it up — whatever you're doing, it's working.",
  "Amazing — soak it all in, and pass a little sunshine on.",
  "That's a great look on you. Hang onto this feeling.",
  "A good day like this is worth noticing. Nice work.",
  "Ride this one out — you've earned the good feeling.",
  "This is the good stuff. Bottle it if you can.",
  "Great days deserve a little victory lap. Enjoy it.",
  "You're having a good one — let it be contagious.",
  "Bright day energy. Share it around.",
];

// Pick a random message index appropriate to the mood's tone band. Called
// once, at the moment the user opens the share sheet — the resulting index
// then gets baked into the share URL so it's stable from then on.
export function pickShareMessageIndex(mood: number): number {
  const band = mood <= 2 ? 0 : mood <= 4 ? 10 : 20;
  return band + Math.floor(Math.random() * 10);
}

export function moodByLevel(level: number): Mood {
  const idx = Math.max(0, Math.min(6, Math.round(level) - 1));
  return MOODS[idx];
}

export function clampMood(v: number): number {
  return Math.max(1, Math.min(7, v));
}
