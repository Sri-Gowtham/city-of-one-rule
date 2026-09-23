import { useState } from "react";
import type { Sim } from "../sim/engine";
import type { FrontPage } from "../sim/types";
import { DISTRICT_NAMES } from "../sim/world";
import { describeActivity, moodFace } from "./labels";

export function PeoplePanel({ sim, onSelect }: { sim: Sim; onSelect: (id: number) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "mood" | "rep">("mood");
  const list = sim.citizens
    .filter((c) => (c.name + c.occupation).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "mood" ? b.mood - a.mood : b.reputation - a.reputation));
  return (
    <section className="sheet">
      <div className="sheet-head">
        <h2>People</h2>
        <input placeholder="Search citizens…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="seg">
          {(["mood", "rep", "name"] as const).map((s) => (
            <button key={s} className={sort === s ? "on" : ""} onClick={() => setSort(s)}>
              {s === "rep" ? "Reputation" : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="people-grid">
        {list.map((c) => (
          <button key={c.id} className="person" onClick={() => onSelect(c.id)}>
            <div className="person-top">
              <span className="person-dot" style={{ background: c.shirt }} />
              <b>{c.name}</b>
              <span className="face">{moodFace(c.mood)}</span>
            </div>
            <div className="person-sub">
              {c.occupation} · {DISTRICT_NAMES[sim.world.buildings[c.homeId].district]}
            </div>
            <div className="person-now">{describeActivity(sim, c)}</div>
            {c.log.length > 0 && <div className="person-last">“{c.log[c.log.length - 1].text}”</div>}
          </button>
        ))}
      </div>
    </section>
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return <svg className="spark" />;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 80},${22 - (v / max) * 20}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 80 24">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function BusinessesPanel({ sim, onSelect }: { sim: Sim; onSelect: (buildingId: number) => void }) {
  const list = [...sim.businesses].sort((a, b) => Number(b.open) - Number(a.open) || b.demand - a.demand);
  return (
    <section className="sheet">
      <div className="sheet-head">
        <h2>Businesses</h2>
        <span className="muted">
          {sim.businesses.filter((b) => b.open).length} open · {sim.dev.businessesCreated} founded during your term · {sim.dev.closed} closed
        </span>
      </div>
      <table className="biz-table">
        <thead>
          <tr>
            <th>Business</th>
            <th>Type</th>
            <th>District</th>
            <th>Demand</th>
            <th>Revenue</th>
            <th>Reputation</th>
            <th>Staff mood</th>
            <th>Adaptations</th>
          </tr>
        </thead>
        <tbody>
          {list.map((b) => {
            const bld = sim.world.buildings[b.buildingId];
            return (
              <tr key={b.id} className={b.open ? "" : "closed"} onClick={() => onSelect(b.buildingId)}>
                <td>
                  <b>{b.name}</b>
                  {b.chain && <span className="tag">chain</span>}
                  {b.founded > 0 && <span className="tag new">new · day {b.founded}</span>}
                  {!b.open && <span className="tag closed">closed</span>}
                </td>
                <td>{b.type}</td>
                <td>{DISTRICT_NAMES[bld.district]}</td>
                <td>
                  <div className="bar">
                    <div style={{ width: `${Math.min(100, b.demand / 2)}%` }} />
                  </div>
                  <span className="num">{b.demand}</span>
                </td>
                <td className="rev">
                  <Spark values={b.history.map((h) => h.revenue)} />
                  <span className="num">{Math.round(b.revenue)}</span>
                </td>
                <td className="num">{Math.round(b.reputation)}</td>
                <td className="num">{Math.round(b.satisfaction)}</td>
                <td>
                  {b.strategies.map((s) => (
                    <span className="chip" key={s}>
                      {s}
                    </span>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function NewsPanel({ sim, onOpen }: { sim: Sim; onOpen: (p: FrontPage) => void }) {
  return (
    <section className="sheet">
      <div className="sheet-head">
        <h2>The Archive</h2>
        <span className="muted">Every front page from your term</span>
      </div>
      {sim.papers.length === 0 && <p className="muted">No editions yet. The first paper comes out at the end of Day 1.</p>}
      <div className="archive">
        {[...sim.papers].reverse().map((p) => (
          <button key={p.era} className="archive-item" onClick={() => onOpen(p)}>
            <div className="archive-meta">
              {p.outlet} · DAY {String(p.era).padStart(2, "0")}
            </div>
            <div className="archive-head">{p.headline}</div>
            <div className="archive-rule">Rule: {p.ruleTitle}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
