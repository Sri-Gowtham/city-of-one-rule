# City of One Rule

> Change one rule. Watch a city change itself.

A browser social simulation. You are the temporary mayor: you can't control anyone, only set **one rule** per day, drawn from a shuffled deck of 40. Citizens, businesses and the press react; behavior spreads from person to person; repeated behavior becomes culture; culture reshapes the city — which grows, evolves and builds its own infrastructure over time. Full design spec: [GAME_SPEC.md](./GAME_SPEC.md).

Everything on screen is drawn procedurally on a canvas — no image assets, no external dependencies beyond React.

## Run

```
npm install
npm run dev
```

## Verify

```
npm run build   # typecheck + production build
npm run check   # 30+ headless invariant checks: rule catalog, deck fairness,
                 # long-run stability, determinism, save/load round-trip,
                 # weather, Metro Loop geometry
```

Both run automatically on push/PR via GitHub Actions ([.github/workflows/check.yml](.github/workflows/check.yml)).

## How it's built

- `src/sim/` — deterministic simulation engine (no rendering)
  - `world.ts` — isometric city grid: 8 districts (downtown, residential, industrial, old town, university, suburbs, parks, Harborview across Harbor Bridge), a theme park, pathfinding
  - `citizens.ts` — 72 residents with hidden traits, learned behavior propensities and daily schedules
  - `evolution.ts` — nightly city evolution: migration, jobs, income, land value, building levels/condition, population turnover
  - `projects.ts` — emergent infrastructure (mall, bridge, Metro Loop, port, shipyard, airport, and their term-aware pacing/Endless-mode phase 2)
  - `rules.ts` — 40 rules across 8 themes, their incentive changes, unlock conditions and rule combinations
  - `engine.ts` — daily schedules, encounters, behavioral contagion, culture memory, grievances/protests, businesses, emergent events, metrics
  - `news.ts` / `report.ts` — the evening front page and the end-of-term Society Report
  - `save.ts` — localStorage save/load (deterministic round-trip, covered by `npm run check`)
- `src/render/` — procedural isometric renderer: buildings (condition/construction/level-up states), day/night sky with sun/moon/stars, 4-state deterministic daily weather (clear/cloudy/rainy/foggy) with clouds/rain/fog/puddles/water shimmer, an elevated Metro Loop with circulating trains, street life, map lenses (mood/safety/greenery)
- `src/ui/` — React HUD: rule draft, live feed, City Pulse lens, People / Businesses / Trends / News tabs, newspaper, Society Report, title screen (10-day / 30-day / Endless terms, continue from save)

## Controls

Drag to pan · scroll to zoom · click a person or building to observe it · Space pauses · 1/2/3 set speed.

## Known limitations

- Narrative (headlines, quotes, Society Report) is template-based, not LLM-generated — this keeps the game fully offline and deterministic, but caps text variety over a long session.
- Save/load is per-browser `localStorage` only; there's no cloud save or cross-device continuation.
