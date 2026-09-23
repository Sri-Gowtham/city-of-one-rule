import type { Sim } from "../sim/engine";
import { buildReport } from "../sim/report";
import { RULES, ruleById } from "../sim/rules";
import { METRIC_KEYS } from "../sim/types";
import type { FrontPage, RuleId } from "../sim/types";
import { useState } from "react";
import { METRIC_META } from "./labels";
import { play } from "./audio";

export function RuleDraft({ sim, onChoose, onPeek }: { sim: Sim; onChoose: (id: RuleId) => void; onPeek: () => void }) {
  const next = sim.era + 1;
  const keep = sim.activeRule;
  const locked = sim.lockedRules();
  return (
    <div className="modal-wrap">
      <div className="draft">
        <div className="draft-kicker">
          DAY {next} OF {sim.totalEras}
        </div>
        <h1>Choose one rule</h1>
        {sim.era === 0 ? (
          <p className="draft-intro">
            You are the temporary mayor. You cannot control a single citizen. You can only set <b>one rule</b> for the city at a time — then watch
            how people, businesses and culture adapt. There is no correct answer.
          </p>
        ) : (
          <p className="draft-intro">Yesterday's rule ends when you choose a new one. The culture it left behind does not.</p>
        )}
        <div className="cards">
          {sim.offered.map((id) => {
            const r = ruleById(id);
            const fresh = sim.newlyUnlocked.includes(id);
            return (
              <button key={id} className="card" onMouseEnter={() => play("click")} onClick={() => onChoose(id)}>
                <div className="card-num">
                  RULE {String(r.num).padStart(2, "0")}
                  {fresh && <span className="badge">NEW</span>}
                </div>
                <div className="card-title">{r.title}</div>
                <div className="card-flavor">{r.flavor}</div>
                <div className="card-tags">
                  {r.pressures.map((p) => (
                    <span key={p}>{p}</span>
                  ))}
                </div>
              </button>
            );
          })}
          {keep && (
            <button className="card keep" onClick={() => onChoose(keep)}>
              <div className="card-num">KEEP CURRENT RULE</div>
              <div className="card-title">{ruleById(keep).title}</div>
              <div className="card-flavor">Let it run another day and see whether its culture deepens — or cracks.</div>
            </button>
          )}
        </div>
        <div className="draft-foot">
          {locked.length > 0 ? (
            <div className="locked">
              <b>🔒 {locked.length} undiscovered rules.</b> They reveal themselves in {locked.map((r) => r.unlock!.hint).slice(0, 3).join(", ")}
              {locked.length > 3 ? "…" : "."}
            </div>
          ) : (
            <div className="locked">All {RULES.length} rules discovered.</div>
          )}
          <button className="ghost" onClick={onPeek}>
            Look at the city first
          </button>
        </div>
      </div>
    </div>
  );
}

export function Newspaper({ paper, onClose, cta }: { paper: FrontPage; onClose: () => void; cta: string }) {
  return (
    <div className="modal-wrap">
      <article className="paper">
        <div className="paper-top">
          <span>DAY {String(paper.era).padStart(2, "0")}</span>
          <span>{paper.weather}</span>
          <span>PRICE: ONE RULE</span>
        </div>
        <div className="masthead">{paper.outlet}</div>
        <div className="paper-rule-line">THE MAYOR'S RULE: {paper.ruleTitle.toUpperCase()}</div>
        <h1 className="headline">“{paper.headline}”</h1>
        {paper.subhead && <div className="subhead">{paper.subhead}</div>}
        <div className="paper-body">
          <div className="paper-main">
            {paper.body.map((p, i) => (
              <p key={i} className={i === 0 ? "lede" : ""}>
                {p}
              </p>
            ))}
            {paper.quote && (
              <blockquote>
                {paper.quote.text}
                <cite>— {paper.quote.by}</cite>
              </blockquote>
            )}
          </div>
          <div className="paper-side">
            {paper.stories.map((s, i) => (
              <div className="side-story" key={i}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
            {paper.unlocked.length > 0 && (
              <div className="side-story unlock">
                <h3>A NEW RULE BECOMES THINKABLE</h3>
                <p>{paper.unlocked.map((u) => `“${u}”`).join(", ")} can now be proposed.</p>
              </div>
            )}
          </div>
        </div>
        <div className="paper-metrics">
          {paper.metrics.map((m) => (
            <div key={m.key}>
              <span>{METRIC_META[m.key].label}</span>
              <b>{m.value}</b>
              <em className={m.delta > 0 ? "up" : m.delta < 0 ? "down" : ""}>{m.delta > 0 ? `+${m.delta}` : m.delta < 0 ? `−${-m.delta}` : "±0"}</em>
            </div>
          ))}
        </div>
        <button className="cta paper-cta" onClick={onClose}>
          {cta}
        </button>
      </article>
    </div>
  );
}

export function SocietyReport({ sim, onRestart, onExplore }: { sim: Sim; onRestart: () => void; onExplore: () => void }) {
  const r = buildReport(sim);
  const start = sim.snapshots[0].metrics;
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = [
      "CITY OF ONE RULE — my city became:",
      r.traits.join(" · "),
      `Population ${r.population.toLocaleString()} | ` + METRIC_KEYS.map((k) => `${METRIC_META[k].label} ${Math.round(r.metrics[k])}`).join(", "),
      "Rules: " + r.timeline.map((t) => `D${t.era} ${t.title}`).join(" → "),
      "Developments: " + r.developments.slice(0, 5).join("; "),
    ].join("\n");
    void navigator.clipboard?.writeText(text).then(() => setCopied(true));
  };
  return (
    <div className="modal-wrap report-wrap">
      <div className="report">
        <div className="report-kicker">CITY OF ONE RULE · END OF TERM</div>
        <h1>Your city has become…</h1>
        <div className="report-grid">
          <div className="report-stats">
            <div className="pop">
              <span>Population</span>
              <b>{r.population.toLocaleString()}</b>
            </div>
            {METRIC_KEYS.map((k) => {
              const v = Math.round(r.metrics[k]);
              const d = v - Math.round(start[k]);
              return (
                <div className="report-metric" key={k}>
                  <span>
                    {METRIC_META[k].icon} {METRIC_META[k].label}
                  </span>
                  <div className="metric-bar">
                    <div style={{ width: `${v}%`, background: METRIC_META[k].color }} />
                  </div>
                  <b>{v}</b>
                  <em className={d > 0 ? "up" : d < 0 ? "down" : ""}>{d > 0 ? `+${d}` : d < 0 ? `−${-d}` : "±0"}</em>
                </div>
              );
            })}
          </div>
          <div>
            <h3>Dominant cultural traits</h3>
            <ul className="traits">
              {r.traits.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h3>Major developments</h3>
            <ul className="devs">
              {r.developments.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
        <h3>The rules you chose</h3>
        <ol className="timeline">
          {r.timeline.map((t) => (
            <li key={t.era}>
              <span className="tl-day">Day {t.era}</span>
              <span className="tl-title">{t.title}</span>
              <span className="tl-metrics">
                {METRIC_KEYS.map((k) => (
                  <i key={k} title={METRIC_META[k].label} style={{ height: `${Math.max(4, t.metrics[k] * 0.28)}px`, background: METRIC_META[k].color }} />
                ))}
              </span>
            </li>
          ))}
        </ol>
        <p className="reflection">This is the society your rules produced.</p>
        <p className="question">What did you become from what you beheld?</p>
        <div className="report-actions">
          <button className="cta" onClick={onRestart}>
            GOVERN A NEW CITY
          </button>
          <button className="ghost" onClick={copy}>
            {copied ? "Copied ✓" : "Copy summary"}
          </button>
          <button className="ghost" onClick={onExplore}>
            Keep exploring this city
          </button>
        </div>
      </div>
    </div>
  );
}
