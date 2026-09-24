import type { Sim } from "./engine";
import { ruleById } from "./rules";
import { CULTURE_KEYS } from "./types";
import { population } from "./evolution";
import type { CultureKey, MetricKey } from "./types";

const HIGH: Record<CultureKey, string> = {
  honesty: "Radically honest",
  generosity: "Generous",
  community: "Community-oriented",
  environment: "Environmentally conscious",
  reputation: "Reputation-driven",
  leisure: "Leisure-first",
  learning: "Lifelong learners",
  equality: "Egalitarian",
  participation: "Participatory",
  localism: "Locally rooted",
};

const LOW: Record<CultureKey, string> = {
  honesty: "Guarded",
  generosity: "Self-reliant",
  community: "Individualistic",
  environment: "Careless with its surroundings",
  reputation: "Indifferent to status",
  leisure: "Work-driven",
  learning: "Set in its ways",
  equality: "Stratified",
  participation: "Disengaged",
  localism: "Globally wired",
};

export interface SocietyReport {
  population: number;
  metrics: Record<MetricKey, number>;
  traits: string[];
  developments: string[];
  timeline: { era: number; title: string; metrics: Record<MetricKey, number> }[];
}

export function buildReport(sim: Sim): SocietyReport {
  const traits = CULTURE_KEYS.map((k) => ({ k, v: sim.culture[k] }))
    .filter((t) => t.v >= 57 || t.v <= 36)
    .sort((a, b) => Math.abs(b.v - 50) - Math.abs(a.v - 50))
    .slice(0, 3)
    .map((t) => (t.v >= 57 ? HIGH[t.k] : LOW[t.k]));
  if (!traits.length) traits.push("Balanced — no single value dominates");

  const litterNow = sim.snapshots.slice(1).map((s) => s.counts.litter ?? 0);
  const litterBase = sim.baseCounts.litter ?? 0;
  const avgLitter = litterNow.length ? litterNow.reduce((s, v) => s + v, 0) / litterNow.length : litterBase;
  const wastePct = litterBase > 0 ? Math.round((1 - avgLitter / litterBase) * 100) : 0;

  const d = sim.dev;
  const developments: string[] = [];
  if (d.orgs) developments.push(`${d.orgs} new community organization${d.orgs > 1 ? "s" : ""}`);
  if (d.businessesCreated) developments.push(`${d.businessesCreated} local business${d.businessesCreated > 1 ? "es" : ""} created`);
  if (d.closed) developments.push(`${d.closed} business${d.closed > 1 ? "es" : ""} closed`);
  if (d.treesPlanted) developments.push(`${d.treesPlanted} trees planted`);
  if (Math.abs(wastePct) >= 5) developments.push(wastePct > 0 ? `${wastePct}% reduction in waste` : `${-wastePct}% more waste`);
  for (const l of d.labels) developments.push(l);
  if (!developments.length) developments.push("The city changed quietly, without landmark events");

  const m = sim.metrics;
  const pop = population(sim);
  const startPop = sim.daySamples[0]?.population ?? pop;
  if (Math.abs(pop - startPop) > startPop * 0.03) developments.unshift(`Population ${pop > startPop ? "grew" : "fell"} from ${startPop.toLocaleString()} to ${pop.toLocaleString()}`);
  const upgraded = sim.world.buildings.filter((b) => b.level >= 4).length;
  if (upgraded) developments.push(`${upgraded} buildings redeveloped to high-value levels`);

  return {
    population: pop,
    metrics: { ...m },
    traits,
    developments,
    timeline: sim.history.map((h) => ({
      era: h.era,
      title: ruleById(h.ruleId).title,
      metrics: sim.snapshots.find((s) => s.era === h.era)?.metrics ?? m,
    })),
  };
}
