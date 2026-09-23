import { citizens } from "../data/citizens";
import { businesses } from "../data/businesses";
import type {
  BusinessState,
  CultureKey,
  CultureState,
  EraRecord,
  MetricKey,
  MetricsState,
  RuleDef,
} from "./types";

export function initialBusinessState(): BusinessState[] {
  return businesses.map((b) => ({ id: b.id, demand: 60, reputation: 60 }));
}

export const initialCulture: CultureState = {
  trust: 50,
  community: 50,
  environment: 50,
  reputation: 50,
  transparency: 50,
  equality: 50,
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

function randomVariation() {
  return Math.round((Math.random() - 0.5) * 4);
}

export function applyRule(
  rule: RuleDef,
  metrics: MetricsState,
  culture: CultureState
): { metrics: MetricsState; culture: CultureState; deltas: Partial<Record<MetricKey, number>> } {
  const deltas: Partial<Record<MetricKey, number>> = {};
  const nextMetrics: MetricsState = { ...metrics };

  (Object.keys(rule.metricEffects) as MetricKey[]).forEach((key) => {
    const base = rule.metricEffects[key] ?? 0;
    const cultureBoost = rule.tags.includes("community")
      ? culture.community * 0.02
      : rule.tags.includes("reputation")
        ? culture.reputation * 0.02
        : rule.tags.includes("trust") || rule.tags.includes("conflict")
          ? culture.trust * 0.02
          : rule.tags.includes("environment")
            ? culture.environment * 0.02
            : 0;
    const delta = Math.round(base + cultureBoost + randomVariation());
    deltas[key] = delta;
    nextMetrics[key] = clamp(nextMetrics[key] + delta);
  });

  const nextCulture: CultureState = { ...culture };
  (Object.keys(nextCulture) as CultureKey[]).forEach((key) => {
    const boost = rule.cultureEffects[key];
    if (boost) {
      nextCulture[key] = clamp(nextCulture[key] + boost);
    } else {
      nextCulture[key] = clamp(nextCulture[key] + (50 - nextCulture[key]) * 0.05);
    }
  });

  return { metrics: nextMetrics, culture: nextCulture, deltas };
}

function pickReactingCitizen(rule: RuleDef) {
  const matches = citizens.filter((c) => c.traits.some((t) => rule.tags.includes(t)));
  const pool = matches.length > 0 ? matches : citizens;
  return pool[Math.floor(Math.random() * pool.length)];
}

function biggestChange(deltas: Partial<Record<MetricKey, number>>) {
  let bestKey: MetricKey | null = null;
  let bestAbs = -1;
  (Object.keys(deltas) as MetricKey[]).forEach((key) => {
    const val = deltas[key] ?? 0;
    if (Math.abs(val) > bestAbs) {
      bestAbs = Math.abs(val);
      bestKey = key;
    }
  });
  return bestKey;
}

const headlineTemplates: Record<MetricKey, [string, string]> = {
  happiness: ["CITIZENS REPORT RISING SPIRITS ACROSS THE CITY", "MOOD DIPS AS NEW RULE UNSETTLES RESIDENTS"],
  trust: ["TRUST BETWEEN NEIGHBORS ON THE RISE", "SUSPICION GROWS AS TRUST ERODES"],
  economy: ["LOCAL BUSINESSES SEE UNEXPECTED SURGE", "ECONOMIC ACTIVITY SLOWS UNDER NEW RULE"],
  equality: ["GAP BETWEEN RICH AND POOR NARROWS", "INEQUALITY WIDENS DESPITE GOOD INTENTIONS"],
  safety: ["STREETS FEEL SAFER, RESIDENTS SAY", "SAFETY CONCERNS TICK UPWARD"],
  environment: ["GREEN SPACES EXPAND ACROSS DISTRICTS", "ENVIRONMENTAL PROGRESS STALLS"],
};

export function generateHeadline(deltas: Partial<Record<MetricKey, number>>) {
  const key = biggestChange(deltas);
  if (!key) return "THE CITY HOLDS STEADY";
  const value = deltas[key] ?? 0;
  const template = headlineTemplates[key];
  return value >= 0 ? template[0] : template[1];
}

export function generateReaction(rule: RuleDef) {
  const citizen = pickReactingCitizen(rule);
  const verbs: Record<string, string> = {
    community: "reached out to a neighbor because of",
    generosity: "gave something away, inspired by",
    trust: "spoke more openly, following",
    reputation: "started tracking how others see them under",
    economy: "changed how they do business under",
    environment: "started tending a small garden after",
    digital: "unplugged for the first time since",
    education: "began teaching a new skill because of",
    equality: "noticed things feel a little fairer under",
    labor: "reorganized their work schedule around",
    safety: "felt a shift in the neighborhood after",
    conflict: "had an uncomfortable but honest conversation because of",
    innovation: "started a small side project inspired by",
  };
  const tag = rule.tags.find((t) => verbs[t]) ?? "community";
  return `${citizen.name} (${citizen.occupation}) ${verbs[tag]} "${rule.name}".`;
}

export function applyRuleToBusinesses(rule: RuleDef, businessStates: BusinessState[]): BusinessState[] {
  return businessStates.map((state) => {
    const def = businesses.find((b) => b.id === state.id);
    if (!def) return state;
    const matches = def.tags.some((t) => rule.tags.includes(t));
    if (!matches) {
      return {
        ...state,
        demand: clamp(state.demand + (60 - state.demand) * 0.05),
        reputation: clamp(state.reputation + (60 - state.reputation) * 0.05),
      };
    }
    const economyEffect = rule.metricEffects.economy ?? 0;
    const trustEffect = rule.metricEffects.trust ?? 0;
    return {
      ...state,
      demand: clamp(state.demand + economyEffect + randomVariation()),
      reputation: clamp(state.reputation + trustEffect + randomVariation()),
    };
  });
}

export function runEra(
  era: number,
  rule: RuleDef,
  metrics: MetricsState,
  culture: CultureState,
  businessStates: BusinessState[]
): {
  metrics: MetricsState;
  culture: CultureState;
  businesses: BusinessState[];
  record: EraRecord;
} {
  const result = applyRule(rule, metrics, culture);
  const nextBusinesses = applyRuleToBusinesses(rule, businessStates);
  const headline = generateHeadline(result.deltas);
  const reaction = generateReaction(rule);
  return {
    metrics: result.metrics,
    culture: result.culture,
    businesses: nextBusinesses,
    record: {
      era,
      ruleId: rule.id,
      ruleName: rule.name,
      headline,
      reaction,
      metricDeltas: result.deltas,
    },
  };
}

export function pickRuleChoices(usedIds: string[], allRules: RuleDef[], count = 3) {
  const unused = allRules.filter((r) => !usedIds.includes(r.id));
  const pool = unused.length >= count ? unused : allRules;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
