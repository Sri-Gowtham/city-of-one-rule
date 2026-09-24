export type MetricKey = "happiness" | "trust" | "economy" | "equality" | "safety" | "environment";
export const METRIC_KEYS: readonly MetricKey[] = ["happiness", "trust", "economy", "equality", "safety", "environment"];

export type HiddenKey =
  | "polarization"
  | "privacy"
  | "innovation"
  | "community"
  | "stress"
  | "stability"
  | "crimePressure"
  | "sensationalism";
export const HIDDEN_KEYS: readonly HiddenKey[] = [
  "polarization",
  "privacy",
  "innovation",
  "community",
  "stress",
  "stability",
  "crimePressure",
  "sensationalism",
];

export type CultureKey =
  | "honesty"
  | "generosity"
  | "community"
  | "environment"
  | "reputation"
  | "leisure"
  | "learning"
  | "equality"
  | "participation"
  | "localism";
export const CULTURE_KEYS: readonly CultureKey[] = [
  "honesty",
  "generosity",
  "community",
  "environment",
  "reputation",
  "leisure",
  "learning",
  "equality",
  "participation",
  "localism",
];

export type DistrictId = "downtown" | "residential" | "industrial" | "oldtown" | "university" | "suburbs" | "park" | "coast";

export type TileKind =
  | "grass"
  | "road"
  | "water"
  | "sand"
  | "park"
  | "path"
  | "plaza"
  | "lot"
  | "walk"
  | "garden"
  | "yard"
  | "pond"
  | "bridge";

export type BuildingKind =
  | "house"
  | "apartment"
  | "shop"
  | "mall"
  | "cafe"
  | "restaurant"
  | "grocery"
  | "office"
  | "bank"
  | "media"
  | "techco"
  | "cinema"
  | "factory"
  | "warehouse"
  | "power"
  | "school"
  | "university"
  | "library"
  | "lab"
  | "community"
  | "cityhall"
  | "kiosk"
  | "boutique"
  | "repair"
  | "workshop"
  | "police"
  | "firestation"
  | "hospital";

export type AgeBand = "youth" | "adult" | "elder";
export type Accessory = "none" | "backpack" | "badge" | "helmet" | "coat" | "vest";

export type Behavior =
  | "help"
  | "chat"
  | "argue"
  | "gossip"
  | "reward"
  | "barter"
  | "teach"
  | "plant"
  | "litter"
  | "recycle"
  | "crime"
  | "protest"
  | "volunteer"
  | "shop"
  | "scroll"
  | "vote"
  | "avoid"
  | "repair"
  | "delegate"
  | "learn"
  | "cleanup";

export const BEHAVIORS: readonly Behavior[] = [
  "help",
  "chat",
  "argue",
  "gossip",
  "reward",
  "barter",
  "teach",
  "plant",
  "litter",
  "recycle",
  "crime",
  "protest",
  "volunteer",
  "shop",
  "scroll",
  "vote",
  "avoid",
  "repair",
  "delegate",
  "learn",
  "cleanup",
];

export type RuleId =
  | "no-lying"
  | "help-stranger"
  | "no-money"
  | "four-hour-day"
  | "basic-income"
  | "plant-tree"
  | "no-internet"
  | "learn-skill"
  | "no-private-property"
  | "tell-opinion"
  | "no-advertising"
  | "hour-outside"
  | "waste-tax"
  | "daily-vote"
  | "reward-citizen";

export interface Params {
  money: boolean;
  workHours: number;
  ubi: number;
  ads: boolean;
  internet: boolean;
  wasteTax: boolean;
  sharedProperty: boolean;
  voting: boolean;
  rewards: boolean;
  mandatoryHelp: boolean;
  mandatoryTree: boolean;
  outsideHour: boolean;
  skillQuota: boolean;
  noLying: boolean;
  mustAnswer: boolean;
}

export interface RuleDef {
  id: RuleId;
  num: number;
  title: string;
  flavor: string;
  pressures: string[];
  params: Partial<Params>;
  push: Partial<Record<CultureKey, number>>;
  unlock?: { key: CultureKey; min: number; hint: string };
}

export interface Traits {
  trust: number;
  ambition: number;
  generosity: number;
  risk: number;
  influence: number;
  productivity: number;
  envConcern: number;
  privacy: number;
  attachment: number;
  curiosity: number;
}

export type OccGroup = "education" | "commerce" | "industry" | "office" | "civic" | "student" | "creative" | "none";

export type Activity = "home" | "work" | "lunch" | "leisure" | "protest" | "plant" | "outside" | "learn";

export interface LogEntry {
  era: number;
  hour: number;
  text: string;
}

export type Place = { kind: "building"; id: number } | { kind: "tile"; x: number; y: number; purpose: string };

export interface DayState {
  helped: number;
  planted: boolean;
  learned: boolean;
  rewarded: boolean;
  lunch: boolean;
  outside: number;
  delegatedTo: number | null;
  taskHour: number;
}

export interface Citizen {
  id: number;
  name: string;
  occupation: string;
  group: OccGroup;
  homeId: number;
  workId: number | null;
  wage: number;
  stipend: number;
  workStart: number;
  bedtime: number;
  traits: Traits;
  base: Record<Behavior, number>;
  prop: Record<Behavior, number>;
  mood: number;
  stress: number;
  wealth: number;
  favors: number;
  reputation: number;
  skills: number;
  fatigue: number;
  x: number;
  y: number;
  ox: number;
  oy: number;
  path: { x: number; y: number }[];
  dest: Place | null;
  loc: Place | null;
  inside: number | null;
  activity: Activity;
  activityUntil: number;
  protestUntil: number;
  lastInteract: number;
  lastSeen: Partial<Record<Behavior, { by: number; t: number }>>;
  bubble: { icon: string; t: number } | null;
  day: DayState;
  log: LogEntry[];
  skin: string;
  hair: string;
  shirt: string;
  walkPhase: number;
  lastBiz: number | null;
  ageBand: AgeBand;
  accessory: Accessory;
}

export interface Building {
  id: number;
  kind: BuildingKind;
  district: DistrictId;
  x: number;
  y: number;
  w: number;
  h: number;
  floors: number;
  wall: string;
  roof: string;
  accent: string;
  name: string;
  businessId: number | null;
  door: { x: number; y: number };
  shared: boolean;
  closed: boolean;
  born: number;
  seed: number;
  level: number;
  condition: number;
  levelStreak: number;
  construction: number;
}

export interface Tree {
  x: number;
  y: number;
  born: number;
  planted: boolean;
  pine: boolean;
  jx: number;
  jy: number;
}

export interface Prop {
  kind: "streetlight" | "billboard" | "bench" | "fountain" | "noticeboard" | "stall" | "crane" | "hydrant" | "bikerack" | "bin";
  x: number;
  y: number;
  variant: number;
}

export interface Lot {
  x: number;
  y: number;
  district: DistrictId;
  used: boolean;
}

export interface World {
  size: number;
  tiles: TileKind[];
  district: DistrictId[];
  occupied: number[];
  buildings: Building[];
  trees: Tree[];
  treeAt: Set<number>;
  litter: { x: number; y: number; jx: number; jy: number }[];
  props: Prop[];
  lots: Lot[];
  outdoorSpots: { x: number; y: number }[];
  plazaSpot: { x: number; y: number };
  groundVersion: number;
  flags: Set<string>;
}

export type BizType =
  | "Grocery"
  | "Restaurant"
  | "Cafe"
  | "Technology"
  | "Factory"
  | "Bank"
  | "Entertainment"
  | "Local Shop"
  | "Media"
  | "Logistics"
  | "Boutique"
  | "Repair"
  | "Kiosk"
  | "Workshop";

export interface Business {
  id: number;
  name: string;
  type: BizType;
  buildingId: number;
  chain: boolean;
  consumer: boolean;
  price: number;
  demand: number;
  revenue: number;
  satisfaction: number;
  cost: number;
  reputation: number;
  visitsToday: number;
  barterToday: number;
  revenueToday: number;
  productionToday: number;
  womToday: number;
  baseVisits: number;
  baseProduction: number;
  lowStreak: number;
  automated: boolean;
  open: boolean;
  founded: number;
  strategies: string[];
  history: { era: number; revenue: number; demand: number }[];
}

export interface GameEvent {
  id: number;
  era: number;
  hour: number;
  text: string;
  kind: string;
  importance: 1 | 2 | 3;
  x: number;
  y: number;
  citizenId?: number;
}

export interface Effect {
  x: number;
  y: number;
  kind: "heart" | "alert" | "leaf" | "star" | "spark";
  t: number;
}

export interface EmergentNote {
  flag: string;
  headline: string;
  body: string;
}

export interface FrontPage {
  era: number;
  outlet: string;
  headline: string;
  subhead: string;
  body: string[];
  stories: { title: string; text: string }[];
  quote: { text: string; by: string } | null;
  ruleTitle: string;
  unlocked: string[];
  weather: string;
  metrics: { key: MetricKey; value: number; delta: number }[];
}

export interface EraSnapshot {
  era: number;
  ruleId: RuleId | null;
  metrics: Record<MetricKey, number>;
  culture: Record<CultureKey, number>;
  counts: Record<string, number>;
  flags: string[];
}

export interface Cohorts {
  children: number;
  students: number;
  young: number;
  adults: number;
  elderly: number;
}

export interface DistrictState {
  id: DistrictId;
  pop: Cohorts;
  housing: number;
  jobs: number;
  education: number;
  skill: number;
  income: number;
  landValue: number;
  unemployment: number;
  attract: number;
  netMigration: number;
  condition: number;
}

export interface CityDaySample {
  era: number;
  population: number;
  jobs: number;
  unemployment: number;
  education: number;
  landValue: number;
  income: number;
}
