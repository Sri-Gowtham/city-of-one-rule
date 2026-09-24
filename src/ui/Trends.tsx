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
