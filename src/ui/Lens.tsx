import type { Sim } from "../sim/engine";
import type { Pick } from "../render/renderer";
import { DISTRICT_NAMES } from "../sim/world";
import { CULTURE_KEYS } from "../sim/types";
import { CULTURE_LABEL, clock, cultureWord, describeActivity, moodFace } from "./labels";
import { total } from "../sim/evolution";

const TREND_LABEL: Record<string, string> = {
  help: "Helping strangers",
  chat: "Street conversations",
  argue: "Arguments",
  gossip: "Gossip",
  crime: "Thefts",
  litter: "Littering",
  plant: "Tree planting",
  volunteer: "Volunteering",
  scroll: "Screen time",
  shopVisits: "Shopping",
  teach: "Teaching each other",
  avoid: "Avoiding questions",
  barter: "Bartering",
  reward: "Rewarding others",
  vote: "Voting",
  parkVisits: "Park visits",
  communityVisits: "Community center visits",
  recycle: "Recycling",
  protest: "Protesting",
};

export function EventFeed({ sim, onSelect }: { sim: Sim; onSelect: (id: number) => void }) {
  const items = sim.events
    .filter((e) => e.era === sim.era && (e.importance >= 2 || (sim.watchId !== null && e.citizenId === sim.watchId) || e.kind === "help"))
    .slice(-7)
    .reverse();
  if (!items.length) return null;
  return (
    <div className="feed">
      <div className="panel-title">LIVE FROM THE CITY</div>
      {items.map((e) => (
        <button
          key={e.id}
          className={`feed-item imp${e.importance} ${e.kind}`}
          onClick={() => e.citizenId !== undefined && onSelect(e.citizenId)}
          disabled={e.citizenId === undefined}
        >
          <span className="feed-time">{clock(e.hour)}</span>
          <span className="feed-text">{e.text}</span>
        </button>
      ))}
    </div>
  );
}

interface LensProps {
  sim: Sim;
  selected: Pick;
  follow: boolean;
  setFollow: (f: boolean) => void;
  onSelect: (p: Pick) => void;
}

export function LensPanel({ sim, selected, follow, setFollow, onSelect }: LensProps) {
  if (selected?.type === "citizen") {
    const c = sim.citizens[selected.id];
    const home = sim.world.buildings[c.homeId];
    const work = c.workId !== null ? sim.world.buildings[c.workId] : null;
    return (
      <aside className="lens">
        <div className="lens-head">
          <div className="avatar" style={{ background: c.shirt }}>
            <span style={{ background: c.skin }} />
          </div>
          <div>
            <div className="lens-name">{c.name}</div>
            <div className="lens-sub">
              {c.occupation} · {DISTRICT_NAMES[home.district]}
            </div>
          </div>
          <button className="icon-btn" onClick={() => onSelect(null)} title="Close">
            ✕
          </button>
        </div>
        <div className="lens-now">{describeActivity(sim, c)}</div>
        <div className="lens-stats">
          <div>
            <span>Mood</span>
            <b>
              {moodFace(c.mood)} {Math.round(c.mood)}
            </b>
          </div>
          <div>
            <span>{sim.params.money ? "Savings" : "Favors"}</span>
            <b>{sim.params.money ? `§${Math.round(c.wealth)}` : Math.round(c.favors)}</b>
          </div>
          <div>
            <span>Reputation</span>
            <b>{Math.round(c.reputation)}</b>
          </div>
        </div>
        {work && <div className="lens-meta">Works at {work.name || "the " + work.kind}</div>}
        <button className={`follow ${follow ? "on" : ""}`} onClick={() => setFollow(!follow)}>
          {follow ? "◉ Following" : "○ Follow with camera"}
        </button>
        <div className="panel-title">STORY</div>
        <div className="story">
          {c.log.length === 0 && <div className="muted">Nothing notable yet. Keep watching.</div>}
          {[...c.log].reverse().slice(0, 14).map((l, i) => (
            <div className="story-item" key={i}>
              <span className="story-time">
                D{l.era} {clock(l.hour)}
              </span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  if (selected?.type === "building") {
    const b = sim.world.buildings[selected.id];
    const biz = b.businessId !== null ? sim.businesses[b.businessId] : null;
    const inside = sim.citizens.filter((c) => c.inside === b.id);
    const staff = sim.citizens.filter((c) => c.workId === b.id);
    const residents = sim.citizens.filter((c) => c.homeId === b.id);
    const title = b.name || (b.kind === "house" ? "House" : b.kind === "apartment" ? "Apartment building" : b.kind);
    return (
      <aside className="lens">
        <div className="lens-head">
          <div className="avatar bld">{b.kind === "house" || b.kind === "apartment" ? "🏠" : "🏢"}</div>
          <div>
            <div className="lens-name">{title}</div>
            <div className="lens-sub">
              {biz ? biz.type : b.kind} · {DISTRICT_NAMES[b.district]}
              {b.shared && " · shared housing"}
            </div>
          </div>
          <button className="icon-btn" onClick={() => onSelect(null)} title="Close">
            ✕
          </button>
        </div>
        <div className="lens-stats">
          <div>
            <span>Level</span>
            <b>{"★".repeat(b.level)}</b>
          </div>
          <div>
            <span>Condition</span>
            <b>{b.closed && !biz ? "Abandoned" : b.condition > 0.7 ? "Good" : b.condition > 0.45 ? "Worn" : "Poor"}</b>
          </div>
          <div>
            <span>Floors</span>
            <b>{b.floors}</b>
          </div>
        </div>
        {biz && (
          <>
            <div className={`status ${biz.open ? "open" : "closed"}`}>{biz.open ? (biz.founded > 0 ? `Opened on day ${biz.founded}` : "Open") : "Closed"}</div>
            <div className="lens-stats">
              <div>
                <span>Demand</span>
                <b>{biz.demand}</b>
              </div>
              <div>
                <span>Reputation</span>
                <b>{Math.round(biz.reputation)}</b>
              </div>
              <div>
                <span>Staff mood</span>
                <b>{Math.round(biz.satisfaction)}</b>
              </div>
            </div>
            {biz.strategies.length > 0 && (
              <div className="chips">
                {biz.strategies.map((s) => (
                  <span className="chip" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
        <PeopleList title={`INSIDE NOW (${inside.length})`} people={inside} onSelect={onSelect} />
        {staff.length > 0 && <PeopleList title="WORKS HERE" people={staff} onSelect={onSelect} />}
        {residents.length > 0 && <PeopleList title="LIVES HERE" people={residents} onSelect={onSelect} />}
      </aside>
    );
  }

  const cur = sim.counts;
  const prev = sim.prevCounts ?? sim.baseCounts;
  const trends = Object.keys(TREND_LABEL)
    .map((k) => ({ k, a: prev[k] ?? 0, b: cur[k] ?? 0 }))
    .filter((t) => t.b >= 3)
    .map((t) => ({ ...t, r: (t.b + 1) / (t.a * Math.max(0.15, (sim.hour - 6) / 18) + 1) }))
    .sort((x, y) => Math.abs(Math.log(y.r)) - Math.abs(Math.log(x.r)))
    .slice(0, 5);
  const locked = sim.lockedRules();
  return (
    <aside className="lens">
      <div className="panel-title">CITY PULSE</div>
      <p className="muted small">Click any citizen or building to observe it. The city won't tell you whether your rule is good — watch what people do.</p>
      {sim.phase === "running" && trends.length > 0 && (
        <>
          <div className="panel-title">TRENDING TODAY</div>
          {trends.map((t) => (
            <div className="trend" key={t.k}>
              <span>{TREND_LABEL[t.k]}</span>
              <b className={t.r >= 1 ? "up" : "down"}>{t.r >= 1.15 ? "▲ rising" : t.r <= 0.85 ? "▼ falling" : "● steady"}</b>
            </div>
          ))}
        </>
      )}
      <div className="panel-title">DISTRICTS</div>
      <div className="districts">
        {sim.districts.map((d) => (
          <div key={d.id} className="district-row" title={`Education ${Math.round(d.education * 100)}% · income ${Math.round(d.income)}`}>
            <span>{DISTRICT_NAMES[d.id]}</span>
            <b>{Math.round(total(d.pop)).toLocaleString()}</b>
            <em className={d.netMigration > 3 ? "up" : d.netMigration < -3 ? "down" : ""}>
              {d.netMigration > 3 ? "▲" : d.netMigration < -3 ? "▼" : "●"}
            </em>
            <i>{Math.round(d.unemployment * 100)}% jobless</i>
            <i>land {Math.round(d.landValue)}</i>
          </div>
        ))}
      </div>
      <div className="panel-title">CITY CULTURE</div>
      {CULTURE_KEYS.map((k) => {
        const w = cultureWord(sim.culture[k]);
        return (
          <div className="culture" key={k}>
            <span>{CULTURE_LABEL[k]}</span>
            <span className="dots">
              {[1, 2, 3, 4, 5].map((i) => (
                <i key={i} className={i <= w.level ? "on" : ""} />
              ))}
            </span>
            <em>{w.word}</em>
          </div>
        );
      })}
      {locked.length > 0 && (
        <p className="muted small">
          🔒 {locked.length} rule{locked.length > 1 ? "s" : ""} still undiscovered. They appear as your city's culture changes.
        </p>
      )}
    </aside>
  );
}

function PeopleList({ title, people, onSelect }: { title: string; people: Sim["citizens"]; onSelect: (p: Pick) => void }) {
  if (!people.length) return null;
  return (
    <>
      <div className="panel-title">{title}</div>
      <div className="people-mini">
        {people.map((c) => (
          <button key={c.id} onClick={() => onSelect({ type: "citizen", id: c.id })}>
            {moodFace(c.mood)} {c.name}
          </button>
        ))}
      </div>
    </>
  );
}
