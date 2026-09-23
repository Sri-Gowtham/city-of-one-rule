# City of One Rule

> Change one rule. Watch a city change itself.

A browser social simulation. You are the temporary mayor: you can't control anyone, only set **one rule** per day. Citizens, businesses and the press react; behavior spreads from person to person; repeated behavior becomes culture; culture reshapes the city. Full design spec: [GAME_SPEC.md](./GAME_SPEC.md).

Everything on screen is drawn procedurally on a canvas — no image assets.

## Run

```
npm install
npm run dev
```

## How it's built

- `src/sim/` — deterministic simulation engine (no rendering)
  - `world.ts` — isometric city grid: six districts, ~140 buildings, parks, waterfront, pathfinding
  - `citizens.ts` — 48 residents (incl. Maya, Arjun, Lina, Daniel, Noor) with hidden traits and learned behavior propensities
  - `rules.ts` — the 15 rules, their incentive changes, unlock conditions and rule combinations
  - `engine.ts` — daily schedules, encounters, behavioral contagion, culture memory, grievances/protests, businesses, emergent events, metrics
  - `news.ts` / `report.ts` — the evening front page and the end-of-term Society Report
- `src/render/` — procedural isometric renderer (ground, buildings, trees, people, cars, day/night lighting)
- `src/ui/` — React HUD: rule draft, live feed, City Lens, People / Businesses / News tabs, newspaper, report

## Controls

Drag to pan · scroll to zoom · click a person or building to observe it · Space pauses · 1/2/3 set speed.
