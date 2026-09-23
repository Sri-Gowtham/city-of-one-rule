import { Rng, clamp, clamp01 } from "./rng";
import { BEHAVIORS, CULTURE_KEYS } from "./types";
import type {
  Behavior,
  Building,
  BuildingKind,
  Business,
  Citizen,
  CultureKey,
  DistrictId,
  Effect,
  EmergentNote,
  EraSnapshot,
  FrontPage,
  GameEvent,
  HiddenKey,
  MetricKey,
  Params,
  Place,
  RuleId,
  World,
} from "./types";
import { COMBOS, RULES, paramsFor, ruleById } from "./rules";
import {
  DISTRICT_NAMES,
  addTree,
  findPath,
  findPlantSpot,
  generateWorld,
  idx,
  placeInPark,
  placeOnLot,
} from "./world";
import { PROP_CAP, generateCitizens, rentFor } from "./citizens";
import { generateBusinesses, makeBusiness } from "./businesses";
import { buildFrontPage } from "./news";

export const TICK = 1 / 6;
export const HOURS_PER_SECOND = 0.33;
export const DAY_START = 6;
export const DAY_END = 24;

export type Phase = "choosing" | "running" | "newspaper" | "report";

export const ICON: Record<Behavior, string> = {
  help: "❤️",
  chat: "💬",
  argue: "⚡",
  gossip: "🗣️",
  reward: "⭐",
  barter: "🔁",
  teach: "📚",
  plant: "🌱",
  litter: "🗑️",
  recycle: "♻️",
  crime: "🚨",
  protest: "✊",
  volunteer: "🤝",
  shop: "🛍️",
  scroll: "📱",
  vote: "🗳️",
  avoid: "🙈",
  repair: "🔧",
  delegate: "📨",
  learn: "🎓",
  cleanup: "🧹",
};

const POSITIVE: ReadonlySet<Behavior> = new Set<Behavior>([
  "help",
  "chat",
  "reward",
  "teach",
  "plant",
  "recycle",
  "volunteer",
  "cleanup",
  "barter",
  "vote",
  "learn",
  "repair",
]);
const CONTAGIOUS: ReadonlySet<Behavior> = new Set<Behavior>([
  "help",
  "reward",
  "teach",
  "plant",
  "volunteer",
  "crime",
  "litter",
  "protest",
  "cleanup",
  "barter",
  "argue",
  "gossip",
  "scroll",
  "avoid",
]);
const NOTABLE: ReadonlySet<Behavior> = new Set<Behavior>([
  "help",
  "reward",
  "teach",
  "plant",
  "volunteer",
  "crime",
  "litter",
  "protest",
  "cleanup",
  "barter",
]);

const CULTURE_OF: Partial<Record<Behavior, [CultureKey, 1 | -1]>> = {
  help: ["generosity", 1],
  volunteer: ["community", 1],
  chat: ["community", 1],
  plant: ["environment", 1],
  litter: ["environment", -1],
  recycle: ["environment", 1],
  cleanup: ["environment", 1],
  gossip: ["honesty", -1],
  argue: ["community", -1],
  teach: ["learning", 1],
  reward: ["reputation", 1],
  barter: ["reputation", 1],
  crime: ["community", -1],
  scroll: ["localism", -1],
  vote: ["participation", 1],
  protest: ["participation", 1],
};

const SEEN: Partial<Record<Behavior, string>> = {
  help: "help a stranger",
  reward: "reward a neighbor",
  teach: "teach someone a skill",
  plant: "plant a tree",
  volunteer: "volunteer at the community center",
  crime: "steal from someone",
  litter: "drop litter in the street",
  protest: "join a protest",
  cleanup: "pick up litter",
  barter: "trade favors",
};

const DID: Partial<Record<Behavior, string>> = {
  help: "helped a stranger",
  reward: "rewarded a neighbor",
  teach: "taught someone a skill",
  plant: "planted a tree",
  volunteer: "volunteered",
  crime: "stole from someone",
  litter: "dropped litter",
  protest: "joined a protest",
  cleanup: "picked up litter",
  barter: "traded favors",
};

const HELP_WAYS = [
  "carry their groceries",
  "find their way",
  "fix a flat tire",
  "with a heavy box",
  "pick up dropped papers",
  "cross a busy street",
  "jump-start a car",
  "find a lost dog",
];
const BALLOT_TOPICS = [
  "Should the fountain run at night?",
  "Paint the bus shelters green?",
  "Close Main Street to cars on Sundays?",
  "Move the market to the waterfront?",
  "Add benches to the university quad?",
  "Extend library hours?",
  "Plant flowers on the ring road?",
  "Rename the central park?",
];
const TRENDS = ["TinyHabits", "CityOfOneRule", "NoFilterFriday", "MayorWatch", "StreetFood", "ThrowbackDay"];
const ORG_NAMES = [
  "Old Town Helpers",
  "The Tuesday Circle",
  "Riverside Tenants Union",
  "Green Streets Collective",
  "Neighbors' Kitchen",
  "The Skill Share",
  "Harbor Walkers",
  "Night Owl Patrol",
];
const NEW_LOCALS: [BuildingKind, string][] = [
  ["cafe", "The Neighborly Bean"],
  ["shop", "Common Goods"],
  ["workshop", "Makers' Corner"],
  ["cafe", "Porch Light Café"],
  ["shop", "Second Chapter Books"],
  ["workshop", "The Tool Library"],
  ["shop", "Harvest Pantry"],
  ["cafe", "Little Lantern Tea"],
];
const STARTUPS = ["Sproutly", "Kindred Labs", "Loop & Co", "Brightside AI", "CivicStack", "Ferment Labs"];

const NEUTRAL_METRICS: Record<MetricKey, number> = {
  happiness: 60,
  trust: 60,
  economy: 60,
  equality: 60,
  safety: 60,
  environment: 60,
};

export class Sim {
  readonly seed: number;
  readonly rng: Rng;
  readonly world: World;
  readonly citizens: Citizen[];
  readonly businesses: Business[];
  readonly totalEras: number;
  readonly ambient: boolean;

  era = 0;
  hour = DAY_START;
  absHour = 0;
  phase: Phase = "choosing";
  activeRule: RuleId | null = null;
  params: Params = paramsFor(null);
  history: { era: number; ruleId: RuleId }[] = [];
  culture: Record<CultureKey, number>;
  metrics: Record<MetricKey, number> = { ...NEUTRAL_METRICS };
  eraStartMetrics: Record<MetricKey, number> = { ...NEUTRAL_METRICS };
  hidden: Record<HiddenKey, number> = {
    polarization: 30,
    privacy: 60,
    innovation: 45,
    community: 50,
    stress: 35,
    stability: 55,
    crimePressure: 30,
    sensationalism: 30,
  };
  unlocked: Set<RuleId>;
  newlyUnlocked: RuleId[] = [];
  offered: RuleId[] = [];

  counts: Record<string, number> = {};
  prevCounts: Record<string, number> | null = null;
  baseCounts: Record<string, number> = {};
  eraActors: Partial<Record<Behavior, number[]>> = {};
  rewardsReceived = new Map<number, number>();
  districtPlanted: Partial<Record<DistrictId, number>> = {};
  roll: Record<string, number> = {};

  events: GameEvent[] = [];
  eraEvents: GameEvent[] = [];
  effects: Effect[] = [];
  flags = new Set<string>();
  eraFlags: string[] = [];
  emergentNotes: EmergentNote[] = [];
  combosDone = new Set<string>();
  bizNews: string[] = [];
  closures: string[] = [];
  openings: string[] = [];
  papers: FrontPage[] = [];
  snapshots: EraSnapshot[] = [];
  dev = { orgs: 0, businessesCreated: 0, treesPlanted: 0, closed: 0, labels: [] as string[] };
  watchId: number | null = null;
  samples: { era: number; hour: number; m: Record<MetricKey, number> }[] = [];

  private base = { econ: [] as number[], crime: [] as number[], argue: [] as number[], pollution: [] as number[], trees: 0, litter: 0 };
  private nextTick = DAY_START;
  private calibrating = false;
  private dayPrepared = false;
  private calDay = 0;
  private econToday = 0;
  private lastEcon = 60;
  private moodStart = new Map<number, number>();
  grievances = new Map<number, number>();
  private protestActive = false;
  private marks: Record<string, number> = {};
  private eventSeq = 0;
  private lastGossipSubject: number | null = null;
  private shopOwnerHelper: number | null = null;
  private listeners = new Set<() => void>();

  constructor(seed: number, totalEras: number, ambient = false) {
    this.seed = seed;
    this.rng = new Rng(seed);
    this.totalEras = totalEras;
    this.ambient = ambient;
    this.world = generateWorld(this.rng);
    this.citizens = generateCitizens(this.rng, this.world);
    this.businesses = generateBusinesses(this.rng, this.world);
    this.culture = {} as Record<CultureKey, number>;
    for (const k of CULTURE_KEYS) this.culture[k] = 44 + this.rng.range(0, 8);
    this.unlocked = new Set(RULES.filter((r) => !r.unlock).map((r) => r.id));
    this.calibrate();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }

  // ---------- lifecycle ----------

  private calibrate() {
    this.calibrating = true;
    const acc: Record<string, number> = {};
    for (let d = 0; d < 4; d++) {
      this.calDay = d;
      this.beginDay();
      while (this.hour < DAY_END - 1e-9) this.advance(TICK);
      if (d >= 1) for (const [k, v] of Object.entries(this.counts)) acc[k] = (acc[k] ?? 0) + v / 3;
    }
    this.baseCounts = acc;
    for (const b of this.businesses) {
      b.baseVisits = Math.max(1, b.visitsToday + b.barterToday);
      b.baseProduction = Math.max(0.5, b.productionToday);
      b.revenue = b.revenueToday + b.productionToday * 3;
    }
    this.base.trees = this.world.trees.length;
    this.base.litter = this.world.litter.length;
    this.calibrating = false;
    for (const c of this.citizens) c.log = [];
    this.counts = {};
    this.beginDay();
    this.dayPrepared = true;
    this.computeMetrics(Math.round(DAY_START * 6), true);
    this.eraStartMetrics = { ...this.metrics };
    this.snapshots.push(this.snapshot());
    if (this.ambient) {
      this.phase = "running";
    } else {
      this.phase = "choosing";
      this.offerRules();
    }
  }

  private beginDay() {
    const P = (this.params = paramsFor(this.activeRule));
    const newNight = !this.dayPrepared;
    this.dayPrepared = false;
    this.hour = DAY_START;
    this.nextTick = DAY_START;
    this.counts = {};
    this.eraActors = {};
    this.rewardsReceived = new Map();
    this.districtPlanted = {};
    this.eraFlags = [];
    this.emergentNotes = [];
    this.eraEvents = [];
    this.bizNews = [];
    this.closures = [];
    this.openings = [];
    this.shopOwnerHelper = null;
    this.econToday = 0;
    if (newNight) {
      this.lastEcon = this.metrics.economy;
      for (const k of Object.keys(this.roll)) this.roll[k] *= 0.37;
      const keep = P.wasteTax ? 0.35 : 0.65;
      this.world.litter = this.world.litter.filter(() => this.rng.chance(keep));
    }

    for (const c of this.citizens) {
      const home = this.world.buildings[c.homeId];
      if (P.money) {
        c.wealth += P.ubi + (newNight ? c.stipend - (P.sharedProperty ? 0 : rentFor(home.district)) - 3 : 0);
        if (c.wealth < 0) {
          c.wealth = 0;
          c.mood -= 6;
        }
      }
      for (const b of BEHAVIORS) {
        let target = c.base[b];
        const map = CULTURE_OF[b];
        if (map) {
          const v = this.culture[map[0]] / 100;
          target *= map[1] > 0 ? 0.5 + v : 1.5 - v;
        }
        c.prop[b] += (target - c.prop[b]) * 0.3;
      }
      c.day = {
        helped: 0,
        planted: false,
        learned: false,
        rewarded: false,
        lunch: false,
        outside: 0,
        delegatedTo: null,
        taskHour: this.rng.range(12.5, 19),
      };
      c.fatigue *= 0.5;
      const g = this.activeRule ? grievance(c, this.activeRule) : 0;
      this.grievances.set(c.id, g);
      if (g > 0.3) {
        c.mood = clamp(c.mood - (g - 0.3) * 18);
        if (g > 0.55) this.note(c, `Woke up resenting “${ruleById(this.activeRule!).title}.”`);
      }
      this.moodStart.set(c.id, c.mood);
      c.stress = clamp(c.stress * 0.75 + 0.05, 0.03, 0.97);
      c.inside = c.homeId;
      c.loc = { kind: "building", id: c.homeId };
      c.dest = null;
      c.path = [];
      c.activity = "home";
      c.activityUntil = 0;
      c.protestUntil = 0;
      c.bubble = null;
      c.lastBiz = null;
      c.x = home.door.x + 0.5;
      c.y = home.door.y + 0.5;
    }
    if (P.sharedProperty) {
      const mean = this.citizens.reduce((s, c) => s + c.wealth, 0) / this.citizens.length;
      for (const c of this.citizens) c.wealth += (mean - c.wealth) * 0.25;
    }
    for (const b of this.world.buildings) {
      if (b.kind === "house" || b.kind === "apartment") b.shared = P.sharedProperty || this.culture.equality >= 64;
    }
    for (const b of this.businesses) {
      b.visitsToday = 0;
      b.barterToday = 0;
      b.revenueToday = 0;
      b.productionToday = 0;
      b.womToday = 0;
    }
  }

  offerRules() {
    const pool = RULES.filter((r) => this.unlocked.has(r.id) && r.id !== this.activeRule).map((r) => r.id);
    const fresh = this.newlyUnlocked.filter((id) => pool.includes(id));
    const others = this.rng.shuffle(pool.filter((id) => !fresh.includes(id)));
    this.offered = [...fresh, ...others].slice(0, Math.min(4, 3 + fresh.length));
  }

  startEra(ruleId: RuleId | null) {
    if (this.phase !== "choosing") return;
    this.era += 1;
    this.activeRule = ruleId;
    if (ruleId) this.history.push({ era: this.era, ruleId });
    this.beginDay();
    this.eraStartMetrics = { ...this.metrics };
    const p = this.world.plazaSpot;
    this.pushEvent(
      ruleId ? `Day ${this.era}: the mayor decrees “${ruleById(ruleId).title}.”` : `Day ${this.era} begins with no new rule.`,
      "rule",
      3,
      p.x,
      p.y,
    );
    this.checkCombos();
    this.phase = "running";
    this.emit();
  }

  continueAfterPaper() {
    if (this.phase !== "newspaper") return;
    if (this.era >= this.totalEras) {
      this.phase = "report";
    } else {
      this.phase = "choosing";
      this.offerRules();
    }
    this.emit();
  }

  update(dtHours: number) {
    if (this.phase !== "running") return;
    let remaining = Math.min(dtHours, 4);
    while (remaining > 1e-9 && this.phase === "running") {
      const step = Math.min(remaining, TICK / 2);
      this.advance(step);
      remaining -= step;
    }
  }

  private advance(dt: number) {
    this.hour += dt;
    this.absHour += dt;
    const decay = Math.exp(-dt / 6);
    for (const k of Object.keys(this.roll)) this.roll[k] *= decay;
    this.moveCitizens(dt);
    while (this.nextTick <= this.hour + 1e-9) {
      const t = Math.round(this.nextTick * 6);
      this.nextTick += TICK;
      this.tick(t);
    }
    if (this.effects.length) this.effects = this.effects.filter((e) => this.absHour - e.t < 0.6);
    if (this.hour >= DAY_END - 1e-9 && !this.calibrating) {
      if (this.ambient) this.beginDay();
      else this.endEra();
    }
  }

  private endEra() {
    this.phase = "newspaper";
    this.finalizeBusinesses();
    this.updateCulture();
    this.checkUnlocks();
    this.growBusinesses();
    this.snapshots.push(this.snapshot());
    this.papers.push(buildFrontPage(this));
    this.prevCounts = { ...this.counts };
    this.emit();
  }

  private snapshot(): EraSnapshot {
    return {
      era: this.era,
      ruleId: this.activeRule,
      metrics: { ...this.metrics },
      culture: { ...this.culture },
      counts: { ...this.counts },
      flags: [...this.eraFlags],
    };
  }

  // ---------- helpers ----------

  cnt(k: string): number {
    return this.counts[k] ?? 0;
  }

  private inc(k: string, n = 1) {
    this.counts[k] = (this.counts[k] ?? 0) + n;
  }

  private bump(k: string, n = 1) {
    this.roll[k] = (this.roll[k] ?? 0) + n;
  }

  private note(c: Citizen, text: string) {
    if (this.calibrating) return;
    c.log.push({ era: this.era, hour: this.hour, text });
    if (c.log.length > 40) c.log.shift();
  }

  pushEvent(text: string, kind: string, importance: 1 | 2 | 3, x: number, y: number, citizenId?: number) {
    if (this.calibrating) return;
    const e: GameEvent = { id: ++this.eventSeq, era: this.era, hour: this.hour, text, kind, importance, x, y, citizenId };
    this.events.push(e);
    if (this.events.length > 150) this.events.shift();
    this.eraEvents.push(e);
  }

  private canAnnounce(key: string, hours: number): boolean {
    if (this.absHour - (this.marks[key] ?? -999) < hours) return false;
    this.marks[key] = this.absHour;
    return true;
  }

  private effect(x: number, y: number, kind: Effect["kind"]) {
    if (this.calibrating) return;
    this.effects.push({ x, y, kind, t: this.absHour });
    if (this.effects.length > 80) this.effects.shift();
  }

  private districtOf(x: number, y: number): DistrictId {
    return this.world.district[idx(Math.floor(x), Math.floor(y))];
  }

  businessAt(buildingId: number | null): Business | null {
    if (buildingId === null) return null;
    const b = this.world.buildings[buildingId];
    return b.businessId !== null ? this.businesses[b.businessId] : null;
  }

  lockedRules() {
    return RULES.filter((r) => !this.unlocked.has(r.id));
  }

  // ---------- movement ----------

  private moveCitizens(dt: number) {
    const speed = 10;
    for (const c of this.citizens) {
      if (!c.path.length) continue;
      let move = speed * dt;
      c.walkPhase += dt * 50;
      while (move > 0 && c.path.length) {
        const t = c.path[0];
        const dx = t.x + 0.5 - c.x;
        const dy = t.y + 0.5 - c.y;
        const d = Math.hypot(dx, dy);
        if (d <= move) {
          c.x = t.x + 0.5;
          c.y = t.y + 0.5;
          move -= d;
          c.path.shift();
        } else {
          c.x += (dx / d) * move;
          c.y += (dy / d) * move;
          move = 0;
        }
      }
      if (!c.path.length) this.arrive(c);
    }
  }

  private goTo(c: Citizen, place: Place) {
    let sx: number;
    let sy: number;
    if (c.inside !== null) {
      const b = this.world.buildings[c.inside];
      sx = b.door.x;
      sy = b.door.y;
      c.x = sx + 0.5;
      c.y = sy + 0.5;
      c.inside = null;
    } else {
      sx = Math.floor(c.x);
      sy = Math.floor(c.y);
    }
    const target = place.kind === "building" ? this.world.buildings[place.id].door : place;
    c.dest = place;
    c.loc = null;
    const path = findPath(this.world, sx, sy, target.x, target.y);
    c.path = path ?? [];
    if (!c.path.length) {
      if (!path) {
        c.x = target.x + 0.5;
        c.y = target.y + 0.5;
      }
      this.arrive(c);
    }
  }

  private arrive(c: Citizen) {
    const d = c.dest;
    c.dest = null;
    if (!d) return;
    c.loc = d;
    if (d.kind === "building") {
      const b = this.world.buildings[d.id];
      c.inside = b.id;
      c.x = b.door.x + 0.5;
      c.y = b.door.y + 0.5;
      this.onEnter(c, b);
    } else {
      c.inside = null;
      if (d.purpose === "plant") {
        if (this.plant(c, d.x, d.y, true)) c.day.planted = true;
      } else if (d.purpose === "park" || d.purpose === "outside") {
        this.inc("parkVisits");
      } else if (d.purpose === "protest") {
        c.protestUntil = this.hour + 1.6;
        c.activityUntil = c.protestUntil;
      } else if (d.purpose === "plaza") {
        this.inc("plazaVisits");
      }
    }
  }

  private onEnter(c: Citizen, b: Building) {
    if (b.kind === "community") this.inc("communityVisits");
    if (b.kind === "library") this.inc("libraryVisits");
    if (c.activity === "learn" && (b.kind === "library" || b.kind === "university" || b.kind === "community")) {
      c.day.learned = true;
      c.skills += 1;
      this.act(c, "learn");
      this.note(c, `Took a class at ${b.name || "the " + b.kind}.`);
      return;
    }
    if ((c.activity === "leisure" || c.activity === "lunch") && b.businessId !== null) this.purchase(c, b);
  }

  private purchase(c: Citizen, b: Building) {
    const biz = this.businesses[b.businessId!];
    if (!biz.open || !biz.consumer) return;
    const P = this.params;
    this.inc("shopVisits");
    this.inc(biz.chain ? "chainShop" : "localShop");
    c.lastBiz = biz.id;
    biz.visitsToday++;
    if (P.money) {
      const price = biz.price * (P.ubi > 0 ? 1.1 : 1);
      if (c.wealth >= price) {
        c.wealth -= price;
        biz.revenueToday += price;
        this.bump("revenue", price);
        this.econToday += price;
        c.mood += 1.5;
        this.act(c, "shop");
        if (P.ubi > 0 && (biz.type === "Boutique" || c.traits.ambition > 0.55)) this.inc("luxury");
      } else {
        c.mood -= 1;
        biz.visitsToday--;
      }
    } else {
      biz.barterToday++;
      c.favors -= 1;
      c.mood += 1;
      this.econToday += 2.5;
      this.act(c, "barter");
    }
    if (biz.type === "Repair") this.act(c, "repair");
  }

  // ---------- tick ----------

  private tick(t: number) {
    const P = this.params;
    this.protestActive = this.citizens.some((c) => c.activity === "protest");
    if (P.voting && (t === 60 || t === 84 || t === 108)) this.ballot();
    for (const c of this.citizens) this.plan(c);
    for (const c of this.citizens) this.individual(c);
    this.encounters();
    this.cityEvents();
    this.updateMoods();
    if (this.calibrating) {
      if (this.calDay >= 1) this.base.econ[t] = (this.base.econ[t] ?? 0) + this.econToday / 3;
      this.base.crime[t] = this.roll.crime ?? 0;
      this.base.argue[t] = this.roll.argue ?? 0;
      this.base.pollution[t] = this.roll.pollution ?? 0;
    } else {
      this.computeMetrics(t, false);
      if (!this.ambient && t % 6 === 0) this.samples.push({ era: this.era, hour: this.hour, m: { ...this.metrics } });
      if (!this.ambient) this.checkEmergent();
    }
  }

  private desired(c: Citizen): Citizen["activity"] {
    const h = this.hour;
    const P = this.params;
    if (h >= c.bedtime) return "home";
    if (c.workId !== null) {
      const end = c.workStart + P.workHours * (c.group === "student" ? 0.8 : 1);
      if (h >= c.workStart - 0.6 && h < end) {
        if (P.workHours >= 6 && h >= 12 && h < 13.5 && (!c.day.lunch || (c.activity === "lunch" && h < c.activityUntil)))
          return "lunch";
        return "work";
      }
      if (h < c.workStart - 0.6) return "home";
    } else if (h < c.workStart) return "home";
    if (c.protestUntil > h) return "protest";
    const sticky = c.activity === "learn" || c.activity === "plant" || c.activity === "outside";
    if (sticky && h < c.activityUntil) return c.activity;
    if (h >= c.day.taskHour) {
      if (P.mandatoryTree && !c.day.planted) return "plant";
      if (P.skillQuota && !c.day.learned) return "learn";
      if (P.outsideHour && c.day.outside < 1) return "outside";
    }
    return "leisure";
  }

  private plan(c: Citizen) {
    const h = this.hour;
    if (c.activity === "plant" && h >= c.activityUntil && !c.day.planted) c.day.planted = true;
    if (c.activity === "learn" && h >= c.activityUntil && !c.day.learned) c.day.learned = true;
    const act = this.desired(c);
    if (act === c.activity && h < c.activityUntil) return;
    if (act === c.activity && (act === "home" || act === "work" || act === "protest")) {
      c.activityUntil = h + 1;
      return;
    }
    c.activity = act;
    const rng = this.rng;
    switch (act) {
      case "home":
        c.activityUntil = h + 1;
        this.goTo(c, { kind: "building", id: c.homeId });
        break;
      case "work":
        c.activityUntil = h + 1;
        this.goTo(c, { kind: "building", id: c.workId! });
        break;
      case "lunch":
        c.day.lunch = true;
        c.activityUntil = h + 0.8;
        this.goTo(c, this.chooseFood(c));
        break;
      case "leisure":
        c.activityUntil = h + rng.range(1, 2.4);
        this.goTo(c, this.chooseLeisure(c));
        break;
      case "plant": {
        c.activityUntil = h + 2.5;
        const home = this.world.buildings[c.homeId];
        const spot = findPlantSpot(this.world, rng, home.door.x, home.door.y) ?? findPlantSpot(this.world, rng, this.world.plazaSpot.x, this.world.plazaSpot.y + 5);
        if (!spot) {
          c.day.planted = true;
          break;
        }
        this.goTo(c, { kind: "tile", x: spot.x, y: spot.y, purpose: "plant" });
        break;
      }
      case "learn":
        c.activityUntil = h + 1.3;
        this.goTo(c, this.chooseLearn(c));
        break;
      case "outside":
        c.activityUntil = h + 1.2;
        this.goTo(c, this.parkSpot(c, "outside"));
        break;
      case "protest": {
        c.activityUntil = c.protestUntil;
        const p = this.world.plazaSpot;
        this.goTo(c, { kind: "tile", x: p.x + rng.int(-2, 2), y: p.y + rng.int(0, 1), purpose: "protest" });
        break;
      }
    }
  }

  private dist(c: Citizen, b: Building) {
    return Math.abs(b.door.x + 0.5 - c.x) + Math.abs(b.door.y + 0.5 - c.y);
  }

  private parkSpot(c: Citizen, purpose: string): Place {
    let best = this.world.outdoorSpots[0];
    let bestD = Infinity;
    for (let i = 0; i < 10; i++) {
      const s = this.rng.pick(this.world.outdoorSpots);
      const d = Math.abs(s.x - c.x) + Math.abs(s.y - c.y) + this.rng.range(0, 6);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return { kind: "tile", x: best.x, y: best.y, purpose };
  }

  private bizWeight(c: Citizen, biz: Business): number {
    if (!biz.open || !biz.consumer) return 0;
    const P = this.params;
    const C = this.culture;
    const b = this.world.buildings[biz.buildingId];
    let w = (0.3 + biz.reputation / 100) / (1 + this.dist(c, b) / 10);
    if (biz.chain) w *= P.ads ? 1.6 : 0.7;
    else w *= 1 + (C.localism - 50) / 100 + (P.ads ? 0 : 0.35);
    if (this.flags.has("reputation-marketing")) w *= 0.5 + biz.reputation / 60;
    if (biz.type === "Boutique") w *= P.ubi > 0 ? c.traits.ambition * 2.5 : 0.4;
    if (biz.type === "Kiosk") w *= P.outsideHour ? 2 : 1.2;
    if (biz.type === "Repair") w *= P.wasteTax ? 2.2 : 0.6;
    if (biz.strategies.includes("Discounts for helpers") && c.prop.help > 0.35) w *= 1.6;
    return w;
  }

  private chooseFood(c: Citizen): Place {
    const food = this.businesses.filter((b) => b.type === "Cafe" || b.type === "Restaurant" || b.type === "Grocery" || b.type === "Kiosk");
    const pick = this.rng.weighted(food.map((b) => [b, this.bizWeight(c, b) * 1.5] as const));
    return pick ? { kind: "building", id: pick.buildingId } : { kind: "building", id: c.workId ?? c.homeId };
  }

  private chooseLearn(c: Citizen): Place {
    const opts = this.world.buildings.filter((b) => b.kind === "library" || b.kind === "university" || b.kind === "community");
    const pick = this.rng.weighted(opts.map((b) => [b, 1 / (1 + this.dist(c, b) / 8)] as const));
    return { kind: "building", id: (pick ?? opts[0]).id };
  }

  private chooseLeisure(c: Citizen): Place {
    const P = this.params;
    const C = this.culture;
    const cat = this.rng.weighted<string>([
      [
        "park",
        1 +
          (P.outsideHour ? 1.4 : 0) +
          (C.leisure - 50) / 50 +
          (P.internet ? 0 : 0.6) +
          c.traits.envConcern * 0.6 +
          (this.flags.has("park-life") ? 0.6 : 0),
      ],
      ["shop", 2.3 * (P.money ? (c.wealth > 8 ? 1 : 0.3) : 0.8 + C.reputation / 150)],
      ["community", c.traits.attachment * 1.4 + Math.max(0, (C.community - 40) / 30) + (P.internet ? 0 : 0.9)],
      ["library", c.traits.curiosity * 1.1 + Math.max(0, (C.learning - 40) / 30)],
      ["home", 0.8 + c.traits.privacy * 1.2 + (P.internet ? 0.7 : 0) - (P.outsideHour ? 0.4 : 0)],
      ["plaza", 0.25 + C.participation / 120 + (P.voting ? 0.5 : 0) + (this.flags.has("town-hall") ? 0.5 : 0)],
    ]);
    switch (cat) {
      case "park":
        return this.parkSpot(c, "park");
      case "shop": {
        const pick = this.rng.weighted(this.businesses.map((b) => [b, this.bizWeight(c, b)] as const));
        if (pick) return { kind: "building", id: pick.buildingId };
        return this.parkSpot(c, "park");
      }
      case "community":
      case "library": {
        const kind = cat === "community" ? "community" : "library";
        const opts = this.world.buildings.filter((b) => b.kind === kind);
        return { kind: "building", id: this.rng.pick(opts).id };
      }
      case "plaza": {
        const p = this.world.plazaSpot;
        return { kind: "tile", x: p.x + this.rng.int(-2, 2), y: p.y + this.rng.int(0, 1), purpose: "plaza" };
      }
      default:
        return { kind: "building", id: c.homeId };
    }
  }

  // ---------- individual behavior ----------

  private individual(c: Citizen) {
    const P = this.params;
    const C = this.culture;
    const rng = this.rng;
    const h = this.hour;
    const outdoors = c.inside === null;
    const moving = c.path.length > 0;
    const bld = c.inside !== null ? this.world.buildings[c.inside] : null;

    if (c.activity === "work" && bld && c.inside === c.workId) {
      if (P.money) c.wealth += c.wage * TICK;
      else c.reputation += 0.05;
      this.inc("workHours", TICK);
      const biz = this.businessAt(bld.id);
      if (biz && !biz.consumer && biz.open) {
        let out = c.traits.productivity * TICK * (biz.automated ? 1.7 : 1);
        if (!P.internet && biz.type === "Technology") out *= 0.25;
        if (!P.internet && biz.type === "Media") out *= 0.6;
        biz.productionToday += out;
        this.bump("production", out);
        this.econToday += out * 2.2;
      }
      if (bld.kind === "factory" || bld.kind === "power") this.bump("pollution", TICK);
      if (bld.kind === "warehouse") this.bump("pollution", TICK * 0.3);
    } else if (c.activity === "leisure" || c.activity === "outside") {
      this.inc("leisureHours", TICK);
    }

    if (outdoors && !moving && c.loc?.kind === "tile") c.day.outside += TICK;

    if (outdoors && rng.chance(0.02 * c.prop.litter * (P.wasteTax ? 0.15 : 1))) {
      this.world.litter.push({ x: c.x, y: c.y, jx: rng.range(-0.3, 0.3), jy: rng.range(-0.3, 0.3) });
      if (this.world.litter.length > 220) this.world.litter.shift();
      this.act(c, "litter");
    }
    if (P.wasteTax && bld && rng.chance(0.02 * (0.3 + c.traits.envConcern))) this.act(c, "recycle");
    if (P.internet && !moving && (c.activity === "home" || c.activity === "leisure") && rng.chance(0.07 * c.prop.scroll)) {
      this.act(c, "scroll");
      c.stress += 0.008;
    }

    if (outdoors) {
      const night = h >= 20 ? 1.8 : 1;
      const p =
        0.12 *
        c.prop.crime *
        (1.4 - c.traits.trust) *
        (P.money && c.wealth < 12 ? 2 : 1) *
        (0.6 + c.stress) *
        (P.noLying ? 0.55 : 1) *
        night *
        (1.5 - C.community / 100) *
        (1 + (55 - this.metrics.equality) / 80);
      if (rng.chance(p)) this.commitCrime(c);
    }

    if (bld?.kind === "community" && rng.chance(0.1 * c.prop.volunteer * (0.5 + C.community / 100))) {
      this.act(c, "volunteer");
      c.mood += 2;
      if (rng.chance(0.3)) this.note(c, "Volunteered at the community center.");
    }

    if (outdoors && !moving && rng.chance(0.008 * c.prop.plant * (0.5 + C.environment / 100))) {
      const spot = findPlantSpot(this.world, rng, Math.floor(c.x), Math.floor(c.y));
      if (spot) this.plant(c, spot.x, spot.y, false);
    }

    if (outdoors && !moving && this.world.litter.length) {
      const pCleanup = 0.04 * c.traits.envConcern * (0.5 + C.environment / 100) * (P.wasteTax ? 2 : 1);
      if (rng.chance(pCleanup)) {
        const before = this.world.litter.length;
        this.world.litter = this.world.litter.filter((l) => (l.x - c.x) ** 2 + (l.y - c.y) ** 2 > 6);
        if (this.world.litter.length < before) {
          this.act(c, "cleanup");
          if (rng.chance(0.4)) this.note(c, "Picked up litter on my street.");
        }
      }
    }

    if (
      this.activeRule &&
      c.protestUntil <= h &&
      (this.grievances.get(c.id) ?? 0) >= 0.45 &&
      (c.mood < 60 || (this.grievances.get(c.id) ?? 0) >= 0.7) &&
      h > 9 &&
      h < 20 &&
      rng.chance(
        0.05 *
          (0.3 + c.prop.protest) *
          (0.6 + C.participation / 100) *
          (0.6 + this.hidden.polarization / 60) *
          (this.protestActive ? 5 : 1),
      )
    ) {
      c.protestUntil = h + 5;
      c.activityUntil = 0;
      this.act(c, "protest");
      this.note(c, `Went to City Hall to protest “${ruleById(this.activeRule).title}.”`);
    }
  }

  private plant(c: Citizen, x: number, y: number, mandated: boolean): boolean {
    if (!addTree(this.world, this.rng, x, y, this.absHour, true)) return false;
    if (this.calibrating) return true;
    this.dev.treesPlanted++;
    const d = this.districtOf(x, y);
    this.districtPlanted[d] = (this.districtPlanted[d] ?? 0) + 1;
    this.act(c, "plant");
    this.effect(x + 0.5, y + 0.5, "leaf");
    this.note(c, mandated ? "Planted my tree for the day, as the rule requires." : "Planted a tree — nobody asked me to.");
    return true;
  }

  private commitCrime(c: Citizen) {
    const victims = this.citizens.filter((o) => o !== c && o.inside === null && (o.x - c.x) ** 2 + (o.y - c.y) ** 2 < 9);
    const d = DISTRICT_NAMES[this.districtOf(c.x, c.y)];
    if (victims.length) {
      const v = this.rng.pick(victims);
      const amt = Math.min(v.wealth, 6);
      v.wealth -= amt;
      c.wealth += amt;
      v.mood -= 14;
      v.stress = clamp(v.stress + 0.12, 0, 1);
      v.traits.trust = clamp01(v.traits.trust - 0.08);
      this.note(v, `Was robbed in ${d}. I didn't see who did it.`);
    }
    this.note(c, "Took something that wasn't mine.");
    this.inc("crime");
    this.bump("crime", 1);
    this.act(c, "crime");
    this.effect(c.x, c.y, "alert");
    this.pushEvent(`🚨 A theft was reported in ${d}.`, "crime", 3, c.x, c.y, c.id);
  }

  // ---------- interactions ----------

  private act(c: Citizen, b: Behavior, target?: Citizen) {
    this.inc(b);
    this.bump(b, 1);
    if (!this.calibrating) (this.eraActors[b] ??= []).push(c.id);
    c.bubble = { icon: ICON[b], t: this.absHour };
    const cap = PROP_CAP[b];
    c.prop[b] = Math.min(cap, c.prop[b] + 0.02 * (cap - c.prop[b]));

    const seen = c.lastSeen[b];
    if (seen && seen.by !== c.id && this.absHour - seen.t < 5 && NOTABLE.has(b)) {
      this.inc("chains");
      if (b === "help") this.inc("helpChains");
      const src = this.citizens[seen.by];
      this.note(c, `${cap1(DID[b] ?? b)} — after seeing ${src.name} do it.`);
      if (!this.calibrating && this.canAnnounce("chain-" + b, 1.2)) {
        this.pushEvent(
          `Behavior spreading: ${c.name} ${DID[b] ?? b} after watching ${src.name} do the same.`,
          "chain",
          2,
          c.x,
          c.y,
          c.id,
        );
      }
      c.lastSeen[b] = undefined;
    }
    if (CONTAGIOUS.has(b)) this.observe(c, b, target?.id);
  }

  private observe(actor: Citizen, b: Behavior, targetId?: number) {
    const cap = PROP_CAP[b];
    const positive = POSITIVE.has(b);
    for (const o of this.citizens) {
      if (o === actor || o.id === targetId) continue;
      const visible =
        actor.inside !== null ? o.inside === actor.inside : o.inside === null && (o.x - actor.x) ** 2 + (o.y - actor.y) ** 2 < 7.8;
      if (!visible) continue;
      let s = 0.06 * (0.4 + actor.traits.influence) * (1 + actor.reputation / 150) * (0.7 + o.traits.curiosity * 0.6);
      if (!positive) s *= 1.2 - o.traits.trust;
      if (b === "crime") s *= 0.3;
      if (this.params.rewards && positive) s *= 1 + actor.reputation / 100;
      o.prop[b] = Math.min(cap, o.prop[b] + s * (cap - o.prop[b]));
      o.lastSeen[b] = { by: actor.id, t: this.absHour };
      if (b === "crime") {
        o.traits.trust = clamp01(o.traits.trust - 0.03);
        o.stress = clamp(o.stress + 0.03, 0, 1);
        actor.reputation -= 3;
      } else if (b === "help" || b === "volunteer") {
        o.traits.trust = clamp01(o.traits.trust + 0.005);
      }
      if (NOTABLE.has(b) && this.rng.chance(0.35)) this.note(o, `Saw ${actor.name} ${SEEN[b]}.`);
    }
  }

  private encounters() {
    const busy = new Set<number>();
    for (const a of this.citizens) {
      if (busy.has(a.id) || this.absHour - a.lastInteract < 0.35) continue;
      if (a.path.length && this.rng.chance(0.6)) continue;
      const cands: Citizen[] = [];
      for (const b of this.citizens) {
        if (b === a || busy.has(b.id)) continue;
        if (a.inside !== null) {
          if (b.inside === a.inside) cands.push(b);
        } else if (b.inside === null && (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < 2.9) cands.push(b);
      }
      if (!cands.length) continue;
      const social = 0.22 * (0.6 + a.traits.attachment * 0.6) * (1 - a.traits.privacy * 0.35);
      if (!this.rng.chance(social)) continue;
      const b = this.rng.pick(cands);
      const kind = this.chooseInteraction(a, b);
      if (!kind) continue;
      this.interact(a, b, kind);
      busy.add(a.id);
      busy.add(b.id);
      a.lastInteract = this.absHour;
      b.lastInteract = this.absHour;
    }
  }

  private chooseInteraction(a: Citizen, b: Citizen): Behavior | null {
    const P = this.params;
    const C = this.culture;
    const cf = (k: CultureKey) => 0.6 + C[k] / 125;
    const bld = a.inside !== null ? this.world.buildings[a.inside] : null;
    const atHome = !!bld && (bld.kind === "house" || bld.kind === "apartment");
    const atShop = !!this.businessAt(a.inside)?.consumer;
    return this.rng.weighted<Behavior>([
      [
        "help",
        a.prop.help *
          (0.5 + a.traits.generosity) *
          (P.mandatoryHelp && a.day.helped === 0 ? 7 : 1) *
          cf("generosity") *
          (atHome ? 0.3 : 1) *
          (P.rewards && a.traits.ambition > 0.55 ? 1.6 : 1),
      ],
      ["chat", a.prop.chat * 1.3 * (1 - a.traits.privacy * 0.5) * (P.internet ? 0.85 : 1.35) * cf("community")],
      [
        "argue",
        a.prop.argue *
          (0.4 + a.stress) *
          (P.noLying ? 2.2 : 1) *
          (P.mustAnswer ? 2 : 1) *
          (1 + this.hidden.polarization / 100) *
          (P.sharedProperty && atHome ? 3 : 1),
      ],
      ["gossip", a.prop.gossip * (P.noLying ? 0.12 : 1) * (P.internet ? 1.2 : 0.8)],
      [
        "reward",
        P.rewards && !a.day.rewarded ? 1.2 * (0.5 + b.reputation / 60) * (a.lastSeen.help?.by === b.id ? 3 : 1) : 0,
      ],
      ["barter", !P.money && !atShop ? 0.7 * cf("reputation") : 0],
      [
        "teach",
        a.prop.teach * (P.skillQuota ? 3.5 : 1) * (a.skills > b.skills ? 1.4 : 0.5) * cf("learning") * (b.day.learned ? 0.4 : 1),
      ],
      ["avoid", P.noLying || P.mustAnswer ? a.prop.avoid * (0.6 + a.traits.privacy) * (P.mustAnswer ? 2.2 : 1.4) : 0],
    ]);
  }

  private interact(a: Citizen, b: Citizen, kind: Behavior) {
    const P = this.params;
    const rng = this.rng;
    const watched = this.watchId === a.id || this.watchId === b.id;
    const bld = a.inside !== null ? this.world.buildings[a.inside] : null;
    switch (kind) {
      case "help": {
        const superficial = P.mandatoryHelp && a.day.helped === 0 && a.traits.generosity < 0.45;
        a.day.helped++;
        b.mood += superficial ? 2 : 6;
        b.traits.trust = clamp01(b.traits.trust + (superficial ? 0.005 : 0.02));
        a.mood += 3;
        a.reputation += 1.5;
        if (superficial) this.inc("superficialHelp");
        if (a.occupation === "Shop Owner" && a.workId !== null) this.shopOwnerHelper = a.id;
        const what = rng.pick(HELP_WAYS);
        this.note(a, superficial ? `Helped ${b.name} ${what} — mostly to meet the quota.` : `Helped ${b.name} ${what}.`);
        this.note(b, `${a.name} helped me ${what}.`);
        this.act(a, "help", b);
        this.effect(a.x, a.y, "heart");
        if (watched || rng.chance(0.15)) this.pushEvent(`${a.name} helped ${b.name} ${what}.`, "help", 1, a.x, a.y, a.id);
        break;
      }
      case "chat": {
        a.mood += 1.5;
        b.mood += 1.5;
        a.stress = clamp(a.stress - 0.01, 0, 1);
        b.stress = clamp(b.stress - 0.01, 0, 1);
        a.traits.trust = clamp01(a.traits.trust + 0.004);
        b.traits.trust = clamp01(b.traits.trust + 0.004);
        if (a.lastBiz !== null && (!P.ads || this.culture.reputation > 55)) {
          const biz = this.businesses[a.lastBiz];
          biz.womToday++;
          biz.reputation = clamp(biz.reputation + 0.6);
          this.inc("wom");
          if (watched) this.note(b, `${a.name} recommended ${biz.name}.`);
        }
        this.act(a, "chat", b);
        break;
      }
      case "argue": {
        a.mood -= 4;
        b.mood -= 4;
        a.stress = clamp(a.stress + 0.04, 0, 1);
        b.stress = clamp(b.stress + 0.04, 0, 1);
        a.traits.trust = clamp01(a.traits.trust - 0.015);
        b.traits.trust = clamp01(b.traits.trust - 0.015);
        const blunt = P.noLying || P.mustAnswer;
        const shared = P.sharedProperty && bld && (bld.kind === "house" || bld.kind === "apartment");
        if (shared) this.inc("homeArgue");
        const topic = shared ? "who gets the good room" : blunt ? "something neither of them wanted to hear" : "nothing in particular";
        this.note(a, `Argued with ${b.name} about ${topic}.`);
        this.note(b, `Argued with ${a.name} about ${topic}.`);
        this.act(a, "argue", b);
        if (watched || rng.chance(0.08)) this.pushEvent(`${a.name} and ${b.name} argued about ${topic}.`, "argue", 1, a.x, a.y, a.id);
        break;
      }
      case "gossip": {
        const others = this.citizens.filter((x) => x !== a && x !== b);
        const subject = rng.pick(others);
        subject.reputation -= 2;
        b.traits.trust = clamp01(b.traits.trust - 0.01);
        b.prop.gossip = Math.min(PROP_CAP.gossip, b.prop.gossip + 0.04);
        this.lastGossipSubject = subject.id;
        this.note(a, `Told ${b.name} a rumor about ${subject.name}.`);
        this.act(a, "gossip", b);
        break;
      }
      case "reward": {
        a.day.rewarded = true;
        b.reputation += 5;
        b.mood += 4;
        this.rewardsReceived.set(b.id, (this.rewardsReceived.get(b.id) ?? 0) + 1);
        this.note(a, `Gave ${b.name} a reward point.`);
        this.note(b, `${a.name} rewarded me. (${this.rewardsReceived.get(b.id)} today)`);
        this.act(a, "reward", b);
        this.effect(b.x, b.y, "star");
        if (watched || rng.chance(0.12)) this.pushEvent(`${a.name} rewarded ${b.name}.`, "reward", 1, a.x, a.y, a.id);
        break;
      }
      case "barter": {
        a.favors += 1;
        b.favors -= 1;
        a.mood += 1;
        b.mood += 1;
        a.reputation += 0.5;
        this.econToday += 1;
        this.note(a, `Traded a favor with ${b.name}.`);
        this.act(a, "barter", b);
        break;
      }
      case "teach": {
        b.skills += 1;
        if (!b.day.learned) b.day.learned = true;
        a.reputation += 1;
        a.mood += 2;
        b.mood += 2;
        const skill = rng.pick(["bike repair", "bread baking", "basic coding", "first aid", "sewing", "guitar chords", "budgeting", "gardening"]);
        this.note(a, `Taught ${b.name} ${skill}.`);
        this.note(b, `Learned ${skill} from ${a.name}.`);
        this.act(a, "teach", b);
        if (watched || rng.chance(0.1)) this.pushEvent(`${a.name} taught ${b.name} ${skill}.`, "teach", 1, a.x, a.y, a.id);
        break;
      }
      case "avoid": {
        a.mood -= 1;
        this.note(a, P.mustAnswer ? `Walked away before ${b.name} could ask my opinion.` : `Changed the subject when ${b.name} asked me something.`);
        this.act(a, "avoid", b);
        if (a.activity === "leisure") a.activityUntil = this.hour;
        break;
      }
      default:
        break;
    }
  }

  private ballot() {
    const topic = this.rng.pick(BALLOT_TOPICS);
    const leaders = [...this.citizens]
      .sort((x, y) => y.traits.influence + y.reputation / 100 - (x.traits.influence + x.reputation / 100))
      .slice(0, 5);
    let yes = 0;
    let voted = 0;
    let delegated = 0;
    for (const c of this.citizens) {
      if (c.day.delegatedTo !== null) {
        delegated++;
        continue;
      }
      if (c.fatigue >= 2 && c.traits.curiosity < 0.6 && this.rng.chance(0.55)) {
        const pool = leaders.filter((l) => l !== c);
        const leader = this.rng.pick(pool);
        c.day.delegatedTo = leader.id;
        this.note(c, `Too many ballots. Handed my vote to ${leader.name}.`);
        this.act(c, "delegate");
        delegated++;
        continue;
      }
      c.fatigue += 1;
      c.stress = clamp(c.stress + 0.012 * c.fatigue, 0, 1);
      voted++;
      if (this.rng.chance(0.5 + (this.culture.community - 50) / 200)) yes++;
      this.act(c, "vote");
    }
    this.inc("ballots");
    const p = this.world.plazaSpot;
    this.pushEvent(
      `Ballot: “${topic}” — ${Math.round((100 * yes) / Math.max(1, voted))}% yes${delegated ? ` · ${delegated} votes delegated` : ""}.`,
      "vote",
      2,
      p.x,
      p.y,
    );
  }

  // ---------- city-level events ----------

  private cityEvents() {
    if (this.calibrating || this.ambient) return;
    const P = this.params;
    const p = this.world.plazaSpot;

    const protesters = this.citizens.filter((c) => c.activity === "protest" && c.inside === null && !c.path.length);
    if (protesters.length >= 3 && this.canAnnounce("protest", 3)) {
      this.inc("protests");
      this.bump("protest", 2);
      const target = this.activeRule ? `“${ruleById(this.activeRule).title}”` : "the mayor";
      this.pushEvent(`✊ Protest at City Hall: ${protesters.length} residents rally against ${target}.`, "protest", 3, p.x, p.y);
    }

    if ((this.roll.gossip ?? 0) > 5 && this.lastGossipSubject !== null && this.canAnnounce("rumor", 4)) {
      const s = this.citizens[this.lastGossipSubject];
      const home = this.world.buildings[s.homeId];
      s.reputation -= 4;
      this.inc("rumors");
      this.pushEvent(`A rumor about ${s.name} is spreading through ${DISTRICT_NAMES[home.district]}.`, "rumor", 2, s.x, s.y, s.id);
    }

    if (P.internet && (this.roll.scroll ?? 0) > 20 && this.canAnnounce("viral", 8)) {
      this.inc("viral");
      this.bump("sensational", 6);
      this.pushEvent(`#${this.rng.pick(TRENDS)} is trending — half the city is watching.`, "viral", 2, p.x, p.y);
    }

    const center = this.world.buildings.find((b) => b.kind === "community");
    if (center) {
      const inside = this.citizens.filter((c) => c.inside === center.id).length;
      if (inside >= 5 && (this.roll.volunteer ?? 0) > 2.5 && this.canAnnounce("org", 14)) {
        this.dev.orgs++;
        this.inc("orgs");
        this.pushEvent(
          `Residents at the community center formed “${this.rng.pick(ORG_NAMES)}.”`,
          "org",
          3,
          center.door.x,
          center.door.y,
        );
      }
    }

    if (this.world.litter.length >= 12 && this.culture.environment >= 52 && this.canAnnounce("cleanup", 12)) {
      const byD = new Map<DistrictId, number>();
      for (const l of this.world.litter) {
        const d = this.districtOf(l.x, l.y);
        byD.set(d, (byD.get(d) ?? 0) + 1);
      }
      const [d] = [...byD.entries()].sort((a, b) => b[1] - a[1])[0];
      this.world.litter = this.world.litter.filter((l) => this.districtOf(l.x, l.y) !== d || this.rng.chance(0.25));
      this.inc("cleanups");
      this.pushEvent(`🧹 Neighbors organized a cleanup in ${DISTRICT_NAMES[d]}.`, "cleanup", 2, p.x, p.y);
    }

    if ((!P.money || this.metrics.economy < 40) && !this.world.flags.has("market") && this.hour > 11) {
      this.world.flags.add("market");
      this.pushEvent("An informal market has appeared on the City Hall plaza.", "market", 3, p.x, p.y);
    }
  }

  private trigger(flag: string, headline: string, body: string, feed: string, label: string): boolean {
    if (this.flags.has(flag)) return false;
    this.flags.add(flag);
    this.eraFlags.push(flag);
    this.emergentNotes.push({ flag, headline, body });
    this.dev.labels.push(label);
    const p = this.world.plazaSpot;
    this.pushEvent(`✦ ${feed}`, "emergent", 3, p.x, p.y);
    return true;
  }

  private newBusiness(b: Building | null, name: string): Business | null {
    if (!b) return null;
    const biz = makeBusiness(this.businesses.length, b, name, this.era);
    biz.baseVisits = 3;
    biz.baseProduction = 1;
    b.businessId = biz.id;
    b.name = name;
    this.businesses.push(biz);
    const hires = this.citizens.filter((c) => c.workId === null && c.occupation !== "Retiree").slice(0, biz.consumer ? 1 : 2);
    for (const c of hires) {
      c.workId = b.id;
      c.wage = 3.5;
      this.note(c, `Got a job at ${name}.`);
    }
    this.dev.businessesCreated++;
    this.inc("newBusinesses");
    this.openings.push(name);
    return biz;
  }

  private checkEmergent() {
    const R = this.activeRule;
    const k = (s: string) => this.cnt(s);
    const h = this.hour;

    const helpCulture = this.culture.generosity >= 55 || R === "help-stranger" || R === "reward-citizen";
    if (helpCulture && k("helpChains") >= 6 && this.shopOwnerHelper !== null && !this.flags.has("help-discount")) {
      const owner = this.citizens[this.shopOwnerHelper];
      const biz = this.businessAt(owner.workId);
      if (biz) {
        this.trigger(
          "help-discount",
          "LOCAL SHOP REWARDS KINDNESS WITH DISCOUNTS",
          `${owner.name}'s ${biz.name} now gives a discount to anyone seen helping a neighbor. Other shopkeepers are watching closely.`,
          `${biz.name} starts giving discounts to people who help others.`,
          "Shops began rewarding helpers",
        );
        biz.strategies.push("Discounts for helpers");
      }
    }

    switch (R) {
      case "no-lying":
        if (k("avoid") >= 6)
          this.trigger(
            "avoid-questions",
            "CITIZENS DISCOVER THE ART OF NOT ANSWERING",
            "With lying forbidden, residents have begun steering around questions entirely. Conversations are more honest — and noticeably shorter.",
            "Citizens are avoiding questions rather than lying.",
            "Question-avoidance became a social norm",
          );
        break;
      case "help-stranger":
        if (k("help") >= 18 && k("superficialHelp") / Math.max(1, k("help")) >= 0.25)
          this.trigger(
            "superficial-help",
            "HELPING BECOMES THE CITY'S NEW STATUS SYMBOL",
            "Acts of kindness are everywhere. However, some residents appear to be helping mainly to tick the daily box — a quick hand with a bag, then gone.",
            "Some residents are helping only to satisfy the rule.",
            "Performative helping spread",
          );
        break;
      case "no-money":
        if (k("barter") >= 20 && this.trigger(
          "favor-tokens",
          "FAVOR TOKENS BECOME THE CITY'S UNOFFICIAL CURRENCY",
          "Without money, residents began trading IOUs scribbled on cards. Whoever is trusted gets credit; whoever isn't goes without.",
          "An informal currency of favor tokens has emerged.",
          "Favor tokens replaced money",
        ))
          this.world.flags.add("tokens");
        break;
      case "four-hour-day":
        if (h >= 14 && this.trigger(
          "automation",
          "BUSINESSES TURN TO AUTOMATION AS THE WORKDAY SHRINKS",
          "Factories and offices facing half-length shifts are installing machines to keep output up. Workers enjoy long afternoons — and wonder what the machines mean for them.",
          "Businesses are automating to cope with four-hour shifts.",
          "Businesses automated",
        )) {
          for (const b of this.businesses) {
            if (!b.consumer && b.type !== "Media" && this.rng.chance(0.7)) {
              b.automated = true;
              if (!b.strategies.includes("Automated production")) b.strategies.push("Automated production");
            }
          }
        }
        break;
      case "basic-income":
        if (k("luxury") >= 6 && this.trigger(
          "status-symbols",
          "WITH INCOMES EQUAL, NEW STATUS SYMBOLS APPEAR",
          "Equal incomes haven't ended the race to stand out. A luxury boutique has opened, and residents are finding new ways to signal who they are.",
          "A luxury boutique opens as residents seek new status symbols.",
          "New status symbols emerged",
        ))
          this.newBusiness(placeOnLot(this.world, this.rng, "boutique", "Maison Lumière", ["downtown", "suburbs"], this.era), "Maison Lumière");
        break;
      case "plant-tree":
        if (k("plant") >= 25) {
          const top = Object.entries(this.districtPlanted).sort((a, b) => b[1] - a[1])[0];
          const name = top ? DISTRICT_NAMES[top[0] as DistrictId] : "Residential";
          this.trigger(
            "green-race",
            "NEIGHBORHOODS RACE TO BECOME THE CITY'S GREENEST",
            `${name} leads the planting so far, and the other districts have noticed. Residents are planting beyond what the rule requires just to keep up.`,
            `Neighborhoods are competing to be greenest — ${name} leads.`,
            "Neighborhoods competed to be greenest",
          );
        }
        break;
      case "no-internet":
        if (k("communityVisits") >= 14 && this.trigger(
          "local-network",
          "NOTICEBOARDS AND RUNNERS: THE CITY BUILDS ITS OWN NETWORK",
          "With the networks dark, residents pinned notices to boards on every plaza and sent kids running with messages. The community center has become the city's switchboard.",
          "Citizens are building their own offline communication network.",
          "An offline communication network formed",
        )) {
          this.world.flags.add("noticeboards");
          const p = this.world.plazaSpot;
          this.world.props.push({ kind: "noticeboard", x: p.x - 2, y: p.y + 1, variant: 0 });
          for (const o of this.world.outdoorSpots.filter((s) => this.world.tiles[idx(s.x, s.y)] === "path").slice(0, 2))
            this.world.props.push({ kind: "noticeboard", x: o.x, y: o.y, variant: 1 });
        }
        break;
      case "learn-skill":
        if (k("teach") >= 10)
          this.trigger(
            "peer-teaching",
            "CITIZENS BECOME EACH OTHER'S TEACHERS",
            "Classrooms couldn't keep up with the quota, so residents started teaching one another — on benches, in cafés, over fences.",
            "Citizens have started teaching one another.",
            "A peer-teaching network formed",
          );
        break;
      case "no-private-property":
        if (k("homeArgue") >= 4)
          this.trigger(
            "sharing-norms",
            "WHO GETS THE WINDOW ROOM? NEW SHARING NORMS EMERGE",
            "With nothing formally owned, households are inventing their own rules: rotas, first-come claims, and a surprising number of arguments about the good chair.",
            "Informal ownership norms are developing in shared homes.",
            "New sharing norms developed",
          );
        break;
      case "tell-opinion":
        if (k("avoid") >= 8)
          this.trigger(
            "dodging",
            "RESIDENTS DODGE CONVERSATIONS TO AVOID BEING ASKED",
            "Required to answer whenever asked, many residents now simply avoid situations where anyone might ask. Cafés are quieter; headphones are up.",
            "People are avoiding situations where they might be asked their opinion.",
            "People avoided being asked",
          );
        break;
      case "no-advertising":
        if (k("wom") >= 12) {
          const top = [...this.citizens].sort((a, b) => b.traits.influence + b.reputation / 100 - (a.traits.influence + a.reputation / 100))[0];
          this.trigger(
            "word-of-mouth",
            "WORD OF MOUTH IS THE NEW BILLBOARD",
            `With ads banned, recommendations travel person to person. ${top.name}, a ${top.occupation.toLowerCase()}, has quietly become the city's most influential taste-maker.`,
            `Word of mouth is replacing advertising; ${top.name} is the city's top influencer.`,
            "A word-of-mouth economy emerged",
          );
        }
        break;
      case "hour-outside":
        if (k("parkVisits") >= 35 && this.trigger(
          "park-economy",
          "SHOPS FOLLOW THE CROWDS INTO THE PARKS",
          "With everyone outdoors for an hour a day, a kiosk has opened in the park and cafés are eyeing the lawns.",
          "Businesses are moving toward the parks.",
          "Businesses moved into the parks",
        ))
          this.newBusiness(placeInPark(this.world, this.rng, "kiosk", "Park Kiosk", this.era), "Park Kiosk");
        break;
      case "waste-tax":
        if (k("recycle") + k("repair") >= 15 && this.trigger(
          "repair-boom",
          "REPAIR AND REUSE SHOPS BOOM",
          "Throwing things away got expensive, so fixing them got popular. A repair collective has opened its doors.",
          "A repair & reuse industry is growing.",
          "The repair & reuse industry grew",
        ))
          this.newBusiness(placeOnLot(this.world, this.rng, "repair", "Fix-It Collective", ["oldtown", "residential", "industrial"], this.era), "Fix-It Collective");
        break;
      case "daily-vote":
        if (k("delegate") >= 5)
          this.trigger(
            "delegation",
            "VOTER FATIGUE: CITIZENS HAND THEIR BALLOTS TO TRUSTED NEIGHBORS",
            "After ballot after ballot, many residents are quietly delegating their votes to a handful of well-known neighbors. Participation is up; so is the influence of a few.",
            "Overloaded voters are delegating their decisions.",
            "Vote delegation became common",
          );
        break;
      case "reward-citizen": {
        const total = k("reward");
        if (total >= 14) {
          const top3 = [...this.rewardsReceived.values()].sort((a, b) => b - a).slice(0, 3).reduce((s, v) => s + v, 0);
          if (top3 / total >= 0.3 && this.trigger(
            "popularity",
            "THE POPULARITY ECONOMY: CITIZENS OPTIMIZE FOR REWARDS",
            "A few residents are collecting most of the reward points — and everyone else has noticed what earns them. Good deeds are up. So are good deeds done where others can see.",
            "Citizens are optimizing their behavior for popularity.",
            "A popularity economy emerged",
          )) {
            for (const c of this.citizens) if (c.traits.ambition > 0.5) c.prop.help = Math.min(PROP_CAP.help, c.prop.help + 0.1);
          }
        }
        break;
      }
      default:
        break;
    }
  }

  private checkCombos() {
    const set = new Set(this.history.map((h) => h.ruleId));
    for (const combo of COMBOS) {
      if (this.combosDone.has(combo.id)) continue;
      const [r0, r1] = combo.rules;
      if (!set.has(r0) || !set.has(r1) || (this.activeRule !== r0 && this.activeRule !== r1)) continue;
      this.combosDone.add(combo.id);
      this.flags.add(combo.id);
      this.eraFlags.push(combo.id);
      this.emergentNotes.push({ flag: combo.id, headline: combo.headline, body: combo.body });
      this.dev.labels.push(combo.label);
      for (const [k, v] of Object.entries(combo.push) as [CultureKey, number][]) this.culture[k] = clamp(this.culture[k] + v);
      const p = this.world.plazaSpot;
      this.pushEvent(`✦ Rules combining: ${combo.label}.`, "combo", 3, p.x, p.y);
    }
  }

  // ---------- mood & metrics ----------

  private updateMoods() {
    const P = this.params;
    for (const c of this.citizens) {
      const bld = c.inside !== null ? this.world.buildings[c.inside] : null;
      if (c.activity === "work" && c.inside === c.workId) c.stress += 0.005 * (1.2 - c.traits.productivity * 0.4);
      else if (c.inside === null && (c.activity === "leisure" || c.activity === "outside")) c.stress -= 0.009;
      else if (bld && (bld.kind === "house" || bld.kind === "apartment")) c.stress -= 0.004;
      else c.stress -= 0.003;
      if (c.activity === "protest") c.stress += 0.004;
      c.stress = clamp(c.stress, 0.03, 0.97);
      const wealthTerm = P.money ? clamp((c.wealth - 35) / 5, -14, 6) : clamp((c.favors + (c.reputation - 50) / 8) / 2, -8, 5);
      const cityTerm = (this.metrics.safety - 60) * 0.12 + (this.metrics.environment - 60) * 0.08 + (c.traits.trust - 0.55) * 20;
      const target = 45 + (0.3 - c.stress) * 45 + wealthTerm + cityTerm;
      c.mood = clamp(c.mood + (target - c.mood) * 0.03);
      const tTarget = 0.3 + this.culture.honesty / 400 + this.culture.community / 400 + (this.metrics.safety - 50) / 500;
      c.traits.trust = clamp01(c.traits.trust + (tTarget - c.traits.trust) * 0.004);
      c.reputation = clamp(c.reputation + (50 - c.reputation) * 0.002);
    }
  }

  private computeMetrics(t: number, instant: boolean) {
    const cs = this.citizens;
    const n = cs.length;
    const P = this.params;
    const avg = (f: (c: Citizen) => number) => cs.reduce((s, c) => s + f(c), 0) / n;
    const nearest = (arr: number[]) => arr[t] ?? arr[Math.min(arr.length - 1, Math.max(0, t))] ?? 0;
    const wealth = cs.map((c) => (P.money ? c.wealth : c.wealth + c.favors * 3 + c.reputation * 0.3));
    const closed = this.businesses.filter((b) => !b.open).length;
    const dayWeight = clamp((this.hour - DAY_START) / 8, 0, 1);

    const target: Record<MetricKey, number> = {
      happiness: avg((c) => c.mood),
      trust: avg((c) => c.traits.trust) * 100,
      economy: clamp(
        (1 - dayWeight) * this.lastEcon +
          dayWeight * (60 * Math.pow((this.econToday + 25) / (nearest(this.base.econ) + 25), 0.85) - closed),
      ),
      equality: clamp(100 - gini(wealth) * 115),
      safety: clamp(
        64 -
          5 * ((this.roll.crime ?? 0) - nearest(this.base.crime)) -
          1.2 * (this.roll.protest ?? 0) -
          0.6 * ((this.roll.argue ?? 0) - nearest(this.base.argue)) -
          0.2 * (this.world.litter.length - this.base.litter),
      ),
      environment: clamp(
        60 +
          (this.world.trees.length - this.base.trees) * 0.28 -
          (this.world.litter.length - this.base.litter) * 0.45 -
          ((this.roll.pollution ?? 0) - nearest(this.base.pollution)) * 0.8 +
          (P.wasteTax ? 3 : 0),
      ),
    };
    for (const k of Object.keys(target) as MetricKey[]) {
      const v = clamp(target[k]);
      this.metrics[k] = instant ? v : this.metrics[k] + (v - this.metrics[k]) * 0.2;
    }
    const m = this.metrics;
    const r = (k: string) => this.roll[k] ?? 0;
    const tech = this.businesses.filter((b) => b.type === "Technology" && b.open).length;
    this.hidden = {
      polarization: clamp(18 + r("argue") * 1.5 + r("gossip") * 1.2 + (P.internet ? 8 : 0) + r("protest") * 3),
      privacy: clamp(70 - (P.noLying ? 18 : 0) - (P.mustAnswer ? 25 : 0) - (this.culture.honesty - 50) * 0.3 - (P.voting ? 5 : 0)),
      innovation: clamp(22 + this.culture.learning * 0.45 + tech * 4 + (P.internet ? 5 : -5)),
      community: this.culture.community,
      stress: avg((c) => c.stress) * 100,
      stability: clamp((m.trust + (100 - this.hidden.polarization) + this.culture.participation) / 3 - r("protest") * 4),
      crimePressure: clamp(25 + (60 - m.equality) * 0.5 + avg((c) => c.stress) * 30 - (this.culture.community - 50) * 0.3),
      sensationalism: clamp(15 + r("gossip") * 1.2 + r("scroll") * 0.3 + (P.ads ? 6 : 0) + r("sensational")),
    };
  }

  // ---------- end of era ----------

  private updateCulture() {
    const P = this.params;
    const r = (k: string) => Math.log((this.cnt(k) + 3) / ((this.baseCounts[k] ?? 0) + 3));
    const superficialShare = this.cnt("superficialHelp") / Math.max(1, this.cnt("help"));
    const sig: Record<CultureKey, number> = {
      honesty: -0.5 * r("gossip") + (P.noLying ? 0.5 : 0) + (P.mustAnswer ? 0.3 : 0),
      generosity: 0.7 * r("help") + 0.4 * r("volunteer") + 0.3 * r("reward") - 0.8 * superficialShare,
      community: 0.45 * r("chat") + 0.4 * r("volunteer") + 0.3 * r("communityVisits") - 0.3 * r("scroll") - 0.25 * r("argue") - 0.2 * r("crime"),
      environment: 0.5 * r("plant") + 0.3 * r("recycle") + 0.3 * r("cleanup") - 0.5 * r("litter"),
      reputation: 0.5 * r("reward") + 0.5 * r("barter") + 0.3 * r("wom"),
      leisure: 0.5 * r("leisureHours") - 0.5 * r("workHours") + 0.3 * r("parkVisits"),
      learning: 0.5 * r("teach") + 0.5 * r("learn") + 0.3 * r("libraryVisits"),
      equality: (this.metrics.equality - 60) / 30,
      participation: 0.6 * r("vote") + 0.3 * r("plazaVisits") + 0.2 * r("protests") + 0.2 * r("orgs"),
      localism: -0.4 * r("scroll") + 0.4 * r("localShop") - 0.3 * r("chainShop") + 0.2 * r("communityVisits"),
    };
    const push = this.activeRule ? ruleById(this.activeRule).push : {};
    for (const k of CULTURE_KEYS) {
      const target = clamp(50 + 30 * Math.tanh(sig[k]), 8, 92);
      let v = this.culture[k];
      v += (target - v) * 0.3;
      v += (push[k] ?? 0) * 0.7;
      v += (46 - v) * 0.04;
      this.culture[k] = clamp(v);
    }
  }

  private checkUnlocks() {
    this.newlyUnlocked = [];
    for (const r of RULES) {
      if (this.unlocked.has(r.id) || !r.unlock) continue;
      if (this.culture[r.unlock.key] >= r.unlock.min) {
        this.unlocked.add(r.id);
        this.newlyUnlocked.push(r.id);
      }
    }
  }

  private finalizeBusinesses() {
    const P = this.params;
    for (const biz of this.businesses) {
      if (!biz.open) {
        biz.history.push({ era: this.era, revenue: 0, demand: 0 });
        continue;
      }
      const staff = this.citizens.filter((c) => c.workId === biz.buildingId);
      if (staff.length) biz.satisfaction = staff.reduce((s, c) => s + c.mood, 0) / staff.length;
      const today = biz.consumer
        ? (100 * (biz.visitsToday + 2)) / (biz.baseVisits + 2)
        : (100 * biz.productionToday) / biz.baseProduction;
      biz.demand = Math.round(biz.demand * 0.45 + today * 0.55);
      biz.revenue = P.money ? biz.revenueToday + biz.productionToday * 3 : biz.barterToday * 1.5 + biz.productionToday * 1.8;
      biz.cost = 6 + (P.money ? staff.reduce((s, c) => s + c.wage * P.workHours, 0) : 0);
      biz.reputation = clamp(
        biz.reputation +
          (biz.demand - 100) / 25 +
          (biz.satisfaction - 55) / 20 +
          biz.womToday * 0.3 +
          (this.culture.reputation - 50) / 25,
      );
      biz.history.push({ era: this.era, revenue: Math.round(biz.revenue), demand: biz.demand });
      const add = (s: string) => {
        if (!biz.strategies.includes(s)) {
          biz.strategies.push(s);
          this.bizNews.push(`${biz.name}: ${s.toLowerCase()}.`);
        }
      };
      if (!P.money && biz.consumer) add("Accepts barter & favors");
      if (!P.internet && biz.type === "Technology") add("Pivoted to in-person workshops");
      if (!P.internet && biz.type === "Media") add("Went print-only");
      if (!P.ads && !biz.chain && biz.consumer && biz.demand > 110) add("Thrives on word of mouth");
      if (!P.ads && biz.chain) add("Cut ad budget for loyalty cards");
      if (P.wasteTax && biz.consumer) add("Refill & return packaging");
      if (P.ubi > 0 && biz.type === "Local Shop" && biz.demand > 110) add("Launched a premium line");

      const essential = biz.type === "Grocery" || biz.type === "Bank";
      biz.lowStreak = biz.demand < 35 && !essential && (biz.consumer || biz.baseProduction > 1.5) && this.era - biz.founded >= 2 ? biz.lowStreak + 1 : 0;
      if (biz.lowStreak >= 3 && this.closures.length < 2) {
        biz.open = false;
        this.world.buildings[biz.buildingId].closed = true;
        this.dev.closed++;
        this.closures.push(biz.name);
        const b = this.world.buildings[biz.buildingId];
        this.pushEvent(`${biz.name} has closed its doors.`, "closure", 3, b.door.x, b.door.y);
      }
    }
  }

  private growBusinesses() {
    const C = this.culture;
    if (this.metrics.economy >= 42 && (C.community >= 55 || C.localism >= 55) && this.rng.chance(0.75)) {
      const options = NEW_LOCALS.filter(([, n]) => !this.businesses.some((b) => b.name === n));
      if (options.length) {
        const [kind, name] = this.rng.pick(options);
        const b = placeOnLot(this.world, this.rng, kind, name, ["oldtown", "residential", "university"], this.era);
        if (this.newBusiness(b, name) && b) this.pushEvent(`New local business opens: ${name}.`, "opening", 3, b.door.x, b.door.y);
      }
    }
    if ((C.learning >= 60 || this.hidden.innovation >= 62) && this.rng.chance(0.6)) {
      const options = STARTUPS.filter((n) => !this.businesses.some((b) => b.name === n));
      if (options.length) {
        const name = this.rng.pick(options);
        const b = placeOnLot(this.world, this.rng, "techco", name, ["university", "downtown"], this.era);
        if (this.newBusiness(b, name) && b) this.pushEvent(`Startup ${name} launches.`, "opening", 3, b.door.x, b.door.y);
      }
    }
  }
}

export function grievance(c: Citizen, rule: RuleId): number {
  const t = c.traits;
  const rich = c.wealth > 55 ? 1 : 0;
  let g: number;
  switch (rule) {
    case "no-lying":
      g = t.privacy * 0.6 + t.risk * 0.3 - t.trust * 0.2;
      break;
    case "help-stranger":
      g = (1 - t.generosity) * 0.6 + t.privacy * 0.3;
      break;
    case "no-money":
      g = t.ambition * 0.5 + rich * 0.4;
      break;
    case "four-hour-day":
      g = t.ambition * 0.5 + (c.wage > 4 ? 0.3 : 0);
      break;
    case "basic-income":
      g = t.ambition * 0.5 * (1 - t.generosity) + (c.wage > 5 ? 0.45 : 0);
      break;
    case "plant-tree":
      g = (1 - t.envConcern) * 0.55;
      break;
    case "no-internet":
      g = (1 - t.attachment) * 0.45 + t.curiosity * 0.2 + (c.occupation === "Software Engineer" || c.occupation === "Journalist" ? 0.4 : 0);
      break;
    case "learn-skill":
      g = (1 - t.curiosity) * 0.6;
      break;
    case "no-private-property":
      g = rich * 0.5 + t.privacy * 0.3 + t.ambition * 0.25;
      break;
    case "tell-opinion":
      g = t.privacy * 0.85;
      break;
    case "no-advertising":
      g = c.group === "commerce" ? 0.45 + t.ambition * 0.2 : 0.05;
      break;
    case "hour-outside":
      g = t.privacy * 0.35 + (1 - t.attachment) * 0.3;
      break;
    case "waste-tax":
      g = (1 - t.envConcern) * 0.5 + (c.wealth < 20 ? 0.3 : 0);
      break;
    case "daily-vote":
      g = (1 - t.curiosity) * 0.45;
      break;
    case "reward-citizen":
      g = (1 - t.influence) * 0.3;
      break;
  }
  return clamp01(g);
}

function cap1(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function gini(values: number[]): number {
  const v = values.map((x) => Math.max(0, x)).sort((a, b) => a - b);
  const n = v.length;
  const sum = v.reduce((s, x) => s + x, 0);
  if (sum <= 0) return 0;
  let acc = 0;
  for (let i = 0; i < n; i++) acc += (2 * (i + 1) - n - 1) * v[i];
  return acc / (n * sum);
}
