export type MetricKey =
  | "happiness"
  | "trust"
  | "economy"
  | "equality"
  | "safety"
  | "environment";

export type CultureKey =
  | "trust"
  | "community"
  | "environment"
  | "reputation"
  | "transparency"
  | "equality";

export interface RuleDef {
  id: string;
  name: string;
  description: string;
  metricEffects: Partial<Record<MetricKey, number>>;
  cultureEffects: Partial<Record<CultureKey, number>>;
  tags: string[];
}

export interface CitizenArchetype {
  id: string;
  name: string;
  occupation: string;
  traits: string[];
}

export type CultureState = Record<CultureKey, number>;
export type MetricsState = Record<MetricKey, number>;

export interface EraRecord {
  era: number;
  ruleId: string;
  ruleName: string;
  headline: string;
  reaction: string;
  metricDeltas: Partial<Record<MetricKey, number>>;
}
