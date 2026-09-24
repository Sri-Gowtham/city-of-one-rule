import type { Sim } from "../sim/engine";
import { ruleById } from "../sim/rules";
import { CULTURE_KEYS, METRIC_KEYS } from "../sim/types";
import type { MetricKey } from "../sim/types";
import { CULTURE_LABEL, METRIC_META } from "./labels";

const W = 900;
const H = 260;

export function TrendsPanel({ sim }: { sim: Sim }) {
  const s = sim.samples;
  const eras = Math.max(1, sim.era);
  const x = (era: number, hour: number) => ((era - 1 + (hour - 6) / 18) / eras) * W;
  const y = (v: number) => H - (v / 100) * H;
  const path = (k: MetricKey) => s.map((p, i) => `${i ? "L" : "M"}${x(p.era, p.hour).toFixed(1)},${y(p.m[k]).toFixed(1)}`).join("");
  const snaps = sim.snapshots;

  return (
    <section className="sheet">
      <div className="sheet-head">
        <h2>Trends</h2>
        <span className="muted">How the city moved, hour by hour, under each rule</span>
      </div>
      {s.length < 2 ? (
        <p className="muted">Trends appear once the first day is underway.</p>
      ) : (
        <div className="chart-wrap">
          <svg viewBox={`-30 -24 ${W + 40} ${H + 44}`} className="chart">
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line x1={0} x2={W} y1={y(v)} y2={y(v)} className="grid" />
                <text x={-8} y={y(v) + 4} className="axis" textAnchor="end">
                  {v}
                </text>
              </g>
            ))}
            {sim.history.map((h) => (
              <g key={h.era}>
                <line x1={x(h.era, 6)} x2={x(h.era, 6)} y1={-6} y2={H} className="day-line" />
                <text x={x(h.era, 6) + 4} y={-10} className="day-label">
                  D{h.era}
                </text>
              </g>
            ))}
            {METRIC_KEYS.map((k) => (
              <path key={k} d={path(k)} fill="none" stroke={METRIC_META[k].color} strokeWidth={2.2} strokeLinejoin="round" />
            ))}
          </svg>
          <div className="legend">
            {METRIC_KEYS.map((k) => (
              <span key={k}>
                <i style={{ background: METRIC_META[k].color }} /> {METRIC_META[k].label} {Math.round(sim.metrics[k])}
              </span>
            ))}
          </div>
          <div className="day-key">
            {sim.history.map((h) => (
              <span key={h.era}>
                <b>D{h.era}</b> {ruleById(h.ruleId).title}
              </span>
            ))}
          </div>
        </div>
      )}
      {sim.daySamples.length > 1 && <GrowthChart sim={sim} />}
      <h3 className="sub">Culture memory</h3>
      <p className="muted small">Culture changes slowly and outlives the rules that shaped it.</p>
      <div className="culture-grid">
        {CULTURE_KEYS.map((k) => {
          const vals = snaps.map((sn) => sn.culture[k]);
          const pts = vals.map((v, i) => `${(i / Math.max(1, vals.length - 1)) * 120},${36 - (v / 100) * 36}`).join(" ");
          const last = vals[vals.length - 1];
          const first = vals[0];
          return (
            <div className="culture-card" key={k}>
              <div>
                <b>{CULTURE_LABEL[k]}</b>
                <em className={last - first > 3 ? "up" : last - first < -3 ? "down" : ""}>
                  {last - first > 3 ? "▲" : last - first < -3 ? "▼" : "●"}
                </em>
              </div>
              <svg viewBox="0 0 120 36">
                <polyline points={pts} fill="none" stroke="#ffd84a" strokeWidth="2" />
              </svg>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GrowthChart({ sim }: { sim: Sim }) {
  const d = sim.daySamples;
  const GW = 900;
  const GH = 180;
  const x = (i: number) => (i / Math.max(1, d.length - 1)) * GW;
  const pops = d.map((s) => s.population);
  const lo = Math.min(...pops) * 0.98;
  const hi = Math.max(...pops) * 1.02;
  const series: { label: string; color: string; v: (s: (typeof d)[number]) => number }[] = [
    { label: "Population", color: "#f4f1e8", v: (s) => ((s.population - lo) / Math.max(1, hi - lo)) * 100 },
    { label: "Education", color: "#5aa9e6", v: (s) => s.education * 100 },
    { label: "Unemployment", color: "#ff7b6b", v: (s) => s.unemployment * 300 },
    { label: "Land value", color: "#e9c46a", v: (s) => s.landValue },
  ];
  const y = (v: number) => GH - (Math.max(0, Math.min(100, v)) / 100) * GH;
  const last = d[d.length - 1];
  return (
    <>
      <h3 className="sub">City growth</h3>
      <p className="muted small">
        {last.population.toLocaleString()} residents · education {Math.round(last.education * 100)}% · {(last.unemployment * 100).toFixed(1)}%
        unemployed · land value {Math.round(last.landValue)}. Population is scaled to its own range; unemployment is shown ×3.
      </p>
      <div className="chart-wrap">
        <svg viewBox={`-10 -10 ${GW + 20} ${GH + 20}`} className="chart">
          {[0, 50, 100].map((v) => (
            <line key={v} x1={0} x2={GW} y1={y(v)} y2={y(v)} className="grid" />
          ))}
          {series.map((s) => (
            <polyline
              key={s.label}
              points={d.map((p, i) => `${x(i).toFixed(1)},${y(s.v(p)).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2.2}
            />
          ))}
        </svg>
        <div className="legend">
          {series.map((s) => (
            <span key={s.label}>
              <i style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
