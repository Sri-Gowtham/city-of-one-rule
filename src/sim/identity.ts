import type { Sim } from "./engine";
import { citySample } from "./evolution";

export interface Identity {
  summary: string;
  dimensions: { name: string; value: number }[];
}

const ADJ: Record<string, string> = {
  Innovation: "innovative",
  Community: "community-minded",
  Individualism: "individualistic",
  Environmentalism: "green",
  Tradition: "rooted in tradition",
  Ambition: "ambitious",
  Trust: "trusting",
  Equality: "egalitarian",
  Creativity: "creative",
  Consumerism: "consumerist",
};

export function cityIdentity(sim: Sim): Identity {
  const C = sim.culture;
  const M = sim.metrics;
  const H = sim.hidden;
  const s = citySample(sim);
  const first = sim.daySamples[0] ?? s;
  const shopRatio = (sim.cnt("shopVisits") + 3) / ((sim.baseCounts.shopVisits ?? 0) + 3);
  const dims = [
    { name: "Innovation", value: (C.learning + H.innovation + s.education * 100) / 3 },
    { name: "Community", value: (C.community + C.generosity + C.participation) / 3 },
    { name: "Individualism", value: 100 - (C.community + C.generosity) / 2 + (H.privacy - 50) / 3 },
    { name: "Environmentalism", value: (C.environment + M.environment) / 2 },
    { name: "Tradition", value: (C.localism + C.honesty) / 2 - (C.learning - 50) / 4 },
    { name: "Ambition", value: (M.economy + s.landValue + C.reputation) / 3 },
    { name: "Trust", value: M.trust },
    { name: "Equality", value: (M.equality + C.equality) / 2 },
    { name: "Creativity", value: (C.leisure + C.learning + C.reputation) / 3 },
    { name: "Consumerism", value: 45 + Math.log(shopRatio) * 40 + (sim.params.ads ? 5 : -5) },
  ].map((d) => ({ ...d, value: Math.max(0, Math.min(100, d.value)) }));

  const top = [...dims].sort((a, b) => b.value - a.value).filter((d) => d.value >= 56).slice(0, 2);
  const traits = top.length ? top.map((d) => ADJ[d.name]).join(" and ") : "still searching for its character";
  const clauses: string[] = [];
  if (s.income > 36 && M.equality < 52) clauses.push("wealthy but deeply unequal");
  else if (s.income > 36) clauses.push("prosperous");
  else if (s.unemployment > 0.14) clauses.push("struggling for work");
  if (s.population > first.population * 1.08) clauses.push("growing fast");
  else if (s.population < first.population * 0.96) clauses.push("losing residents");
  if (s.education > 0.68) clauses.push("highly educated");
  if (M.environment < 45) clauses.push("under a haze of pollution");

  const cap = traits.charAt(0).toUpperCase() + traits.slice(1);
  return { summary: clauses.length ? `${cap}; ${clauses.join(", ")}.` : `${cap}.`, dimensions: dims };
}
