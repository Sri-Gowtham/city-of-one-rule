/**
 * Headless invariant checks for the simulation and world-generation code.
 *
 * This isn't a unit-test suite in the classic sense (no framework, no mocks) — it plays
 * the actual simulation for many in-game days, the same way the dev probes in scratchpad
 * always have, but committed to the repo and runnable with one command:
 *
 *   npm run check
 *
 * Each check prints PASS/FAIL and the whole script exits non-zero if anything failed, so it
 * can be wired into CI later without any extra setup.
 */
import { Sim } from "../src/sim/engine.ts";
import { COMBOS, RULES, ruleById } from "../src/sim/rules.ts";
import type { RuleId, RuleTheme } from "../src/sim/types.ts";
import { metroLoopPoints, metroBranchPoints } from "../src/sim/world.ts";
import { dayWeather } from "../src/render/weather.ts";

let failures = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(name: string) {
  console.log(`\n${name}`);
}

// ---------- Rule catalog ----------
section("Rule catalog");
check("exactly 40 rules", RULES.length === 40, `got ${RULES.length}`);
check("all rule ids unique", new Set(RULES.map((r) => r.id)).size === RULES.length);
check("all rule numbers unique", new Set(RULES.map((r) => r.num)).size === RULES.length);
const THEMES: RuleTheme[] = ["work", "money", "social", "environment", "mobility", "civic", "culture", "wellbeing"];
check("every rule has a valid theme", RULES.every((r) => THEMES.includes(r.theme)));
check("every rule has flavor text and pressures", RULES.every((r) => r.flavor.length > 0 && r.pressures.length > 0));
const startRules = RULES.filter((r) => !r.unlock);
check("at least 10 rules available from day one", startRules.length >= 10, `got ${startRules.length}`);

// ---------- Deck offering: no immediate repeats, themes mixed ----------
section("Rule deck offering (40 days, seed 11)");
{
  const sim = new Sim(11, Infinity);
  const seen = new Set<RuleId>();
  let overlapPrev = 0;
  let prev: RuleId[] = [];
  let badOfferSize = 0;
  let duplicateWithinOffer = 0;
  for (let d = 0; d < 40; d++) {
    const offer = sim.offered;
    if (offer.length < 3 || offer.length > 4) badOfferSize++;
    if (new Set(offer).size !== offer.length) duplicateWithinOffer++;
    if (offer.some((id) => prev.includes(id))) overlapPrev++;
    offer.forEach((id) => seen.add(id));
    prev = offer;
    sim.startEra(offer[d % offer.length]);
    while (sim.phase === "running") sim.update(1);
    sim.continueAfterPaper();
  }
  check("offer size always 3-4", badOfferSize === 0, `${badOfferSize} bad-sized offers`);
  check("no duplicate rule within a single offer", duplicateWithinOffer === 0);
  check("no offer fully overlaps the previous one", overlapPrev === 0, `${overlapPrev}/40 overlapped`);
  check("most of the catalog gets offered over 40 days", seen.size >= 30, `only ${seen.size} distinct rules offered`);
}

// ---------- Simulation stability over a long run ----------
section("Simulation stability (Endless, 45 days, seed 42)");
{
  const sim = new Sim(42, Infinity);
  let sawNaN = false;
  let sawOutOfRange = false;
  for (let d = 0; d < 45 && !sawNaN; d++) {
    sim.startEra(sim.offered[0]);
    while (sim.phase === "running") sim.update(1);
    for (const key of ["happiness", "trust", "economy", "equality", "safety", "environment"] as const) {
      const v = sim.metrics[key];
      if (!Number.isFinite(v)) sawNaN = true;
      if (v < -1 || v > 101) sawOutOfRange = true;
    }
    for (const c of sim.citizens) {
      if (!Number.isFinite(c.mood) || !Number.isFinite(c.wealth) || !Number.isFinite(c.stress)) sawNaN = true;
    }
    sim.continueAfterPaper();
  }
  check("no NaN/Infinity in metrics or citizen state", !sawNaN);
  check("metrics stay within [0,100] (small overshoot tolerated)", !sawOutOfRange);
  check("population stayed positive", sim.citizens.length > 0);
  const pop = sim.daySamples[sim.daySamples.length - 1]?.population ?? 0;
  check("city grew over 45 days", pop > 4000, `ended at ${pop}`);
}

// ---------- Determinism ----------
section("Determinism (same seed -> same outcome)");
{
  const plan: RuleId[] = ["basic-income", "learn-skill", "hour-outside", "plant-tree"];
  const run = () => {
    const sim = new Sim(777, 8);
    for (let d = 0; d < 8; d++) {
      sim.startEra(sim.unlocked.has(plan[d % plan.length]) ? plan[d % plan.length] : sim.offered[0]);
      while (sim.phase === "running") sim.update(1);
      sim.continueAfterPaper();
    }
    return Math.round(sim.metrics.happiness * 100) + Math.round(sim.metrics.economy * 100);
  };
  const a = run();
  const b = run();
  check("identical seed + choices reproduce identical metrics", a === b, `${a} vs ${b}`);
}

// ---------- Deterministic daily weather ----------
section("Weather determinism");
{
  const a = dayWeather(555, 12);
  const b = dayWeather(555, 12);
  check("same seed+day always gives the same weather", a === b);
  const counts: Record<string, number> = {};
  for (let era = 0; era < 400; era++) counts[dayWeather(555, era)] = (counts[dayWeather(555, era)] ?? 0) + 1;
  check("all four weather types appear over 400 days", Object.keys(counts).length === 4, JSON.stringify(counts));
}

// ---------- Metro Loop geometry ----------
section("Metro Loop geometry");
{
  const ring = metroLoopPoints();
  check("ring is closed", ring[0].x === ring[ring.length - 1].x && ring[0].y === ring[ring.length - 1].y);
  check("ring has no NaN points", ring.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
  // Harborview + Harbor Bridge exist from day one, so the branch does too.
  const sim = new Sim(3, 10);
  check("bridge exists from day one", sim.world.flags.has("bridge"));
  const branch = metroBranchPoints(sim.world);
  check("branch exists from day one (Harborview)", branch.length > 0);
  check("branch has no NaN points", branch.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
  check("airport is not built from day one", !sim.world.flags.has("airport"));
  sim.world.flags.add("airport");
  const branchWithAirport = metroBranchPoints(sim.world);
  check("branch extends once the airport exists", branchWithAirport.length > branch.length);
}

// ---------- Rule combos reference real rules ----------
section("Rule combos");
{
  const ids = new Set(RULES.map((r) => r.id));
  check("every combo's two rules exist in the catalog", COMBOS.every((c) => c.rules.every((id) => ids.has(id))));
  check("every unlockable rule resolves via ruleById", RULES.filter((r) => r.unlock?.key).every((r) => !!ruleById(r.id)));
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
