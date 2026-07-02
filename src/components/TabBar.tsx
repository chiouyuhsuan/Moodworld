export type TabId = "vote" | "global" | "ages" | "trends" | "give";

const ICONS: Record<TabId, JSX.Element> = {
  vote: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="0.6" fill="currentColor" />
      <circle cx="15" cy="10" r="0.6" fill="currentColor" />
      <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
    </svg>
  ),
  global: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  ),
  ages: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M5 20V13M12 20V6M19 20v-9" />
    </svg>
  ),
  trends: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15l5-5 4 3 6-7" />
      <path d="M18 6h2v2" />
    </svg>
  ),
  give: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z" />
    </svg>
  ),
};

const TABS: { id: TabId; label: string }[] = [
  { id: "vote", label: "Vote" },
  { id: "global", label: "Global" },
  { id: "ages", label: "Ages" },
  { id: "trends", label: "Trends" },
  { id: "give", label: "Give" },
];

export default function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 86,
        background: "rgba(255,247,236,.92)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid #F0E7DE",
        display: "flex",
        padding: "10px 12px 24px",
      }}
    >
      {TABS.map((t) => {
        const sel = t.id === active;
        const color = sel ? "#F2823C" : "#B7AEC4";
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 0 }}
          >
            <span style={{ color, display: "grid", placeItems: "center", height: 26, transition: "color .15s" }}>
              {ICONS[t.id]}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 800, color }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
