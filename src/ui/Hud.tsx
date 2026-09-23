import type { Sim } from "../sim/engine";
import { ruleById } from "../sim/rules";
import { METRIC_KEYS } from "../sim/types";
import { METRIC_META, clock } from "./labels";

export type Tab = "city" | "people" | "businesses" | "trends" | "news";

export function TopBar({ sim, muted, onMute }: { sim: Sim; muted: boolean; onMute: () => void }) {
  const rule = sim.activeRule ? ruleById(sim.activeRule) : null;
  const running = sim.phase === "running";
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">◆</span>
        <div>
          <div className="brand-name">CITY OF ONE RULE</div>
          <div className="brand-sub">
            Day {Math.max(1, sim.era)} / {sim.totalEras}
            {running && <span className="clock"> · {clock(sim.hour)}</span>}
          </div>
        </div>
      </div>
      <div className="rule-chip" title={rule?.flavor}>
        <span className="rule-chip-label">ACTIVE RULE</span>
        <span className="rule-chip-title">{rule ? rule.title : "None yet"}</span>
      </div>
      <button className="icon-btn mute" title={muted ? "Unmute" : "Mute"} onClick={onMute}>
        {muted ? "🔇" : "🔊"}
      </button>
      <div className="metrics">
        {METRIC_KEYS.map((k) => {
          const v = sim.metrics[k];
          const d = Math.round(v - sim.eraStartMetrics[k]);
          const meta = METRIC_META[k];
          return (
            <div className="metric" key={k} title={meta.label}>
              <span className="metric-icon">{meta.icon}</span>
              <div className="metric-body">
                <div className="metric-row">
                  <span className="metric-label">{meta.label}</span>
                  <span className="metric-value">{Math.round(v)}</span>
                  {sim.era > 0 && d !== 0 && <span className={`metric-delta ${d > 0 ? "up" : "down"}`}>{d > 0 ? `▲${d}` : `▼${-d}`}</span>}
                </div>
                <div className="metric-bar">
                  <div style={{ width: `${v}%`, background: meta.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}

interface BottomProps {
  sim: Sim;
  tab: Tab;
  setTab: (t: Tab) => void;
  speed: number;
  setSpeed: (s: number) => void;
  onChooseRule: () => void;
  onShowReport: () => void;
}

const SPEEDS: [number, string, string][] = [
  [0, "⏸", "Pause"],
  [1, "▶", "Normal speed"],
  [2, "▶▶", "Fast"],
  [4, "▶▶▶", "Faster"],
  [30, "⏭", "Skip to end of day"],
];

export function BottomBar({ sim, tab, setTab, speed, setSpeed, onChooseRule, onShowReport }: BottomProps) {
  const running = sim.phase === "running";
  const progress = Math.max(0, Math.min(1, (sim.hour - 6) / 18));
  const tabs: [Tab, string][] = [
    ["city", "City"],
    ["people", "People"],
    ["businesses", "Businesses"],
    ["trends", "Trends"],
    ["news", "News"],
  ];
  return (
    <footer className="bottombar">
      <nav className="tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? "tab active" : "tab"} onClick={() => setTab(id)}>
            {label}
            {id === "news" && sim.papers.length > 0 && <span className="tab-count">{sim.papers.length}</span>}
          </button>
        ))}
      </nav>
      <div className="daybar">
        {running ? (
          <>
            <div className="speed">
              {SPEEDS.map(([s, icon, title]) => (
                <button key={s} title={title} className={speed === s ? "on" : ""} onClick={() => setSpeed(s)}>
                  {icon}
                </button>
              ))}
            </div>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
              <span className="progress-label">
                Day {sim.era} · {clock(sim.hour)} — the city is reacting
              </span>
            </div>
          </>
        ) : (
          <div className="progress idle">
            <span className="progress-label">
              {sim.phase === "choosing"
                ? sim.era === 0
                  ? "The city is waiting for its first rule"
                  : `Day ${sim.era} is over`
                : sim.phase === "newspaper"
                  ? "Reading the evening paper"
                  : "Your term is over"}
            </span>
          </div>
        )}
      </div>
      {sim.phase === "report" ? (
        <button className="cta" onClick={onShowReport}>
          SEE WHAT YOUR CITY BECAME
        </button>
      ) : (
        <button className={`cta ${sim.phase === "choosing" ? "pulse" : ""}`} disabled={sim.phase !== "choosing"} onClick={onChooseRule}>
          CHOOSE NEXT RULE
        </button>
      )}
    </footer>
  );
}
