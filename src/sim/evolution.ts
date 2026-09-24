import { clamp, clamp01 } from "./rng";
import type { Sim } from "./engine";
import type { Building, BuildingKind, Cohorts, DistrictId, DistrictState } from "./types";
import { DISTRICT_NAMES, placeOnLot } from "./world";

export const LIVING_DISTRICTS: DistrictId[] = ["downtown", "residential", "industrial", "oldtown", "university", "suburbs"];

const START_POPULATION = 4300;
const LEVEL_LAND: number[] = [0, 0, 42, 56, 70, 84];
const CIVIC: ReadonlySet<BuildingKind> = new Set<BuildingKind>(["cityhall", "police", "firestation", "hospital", "school", "university", "library"]);
const GROWS_UP: ReadonlySet<BuildingKind> = new Set<BuildingKind>(["apartment", "office", "techco", "lab", "media"]);

const JOB_WEIGHT: Partial<Record<BuildingKind, number>> = {
  office: 10,
  techco: 10,
  bank: 6,
  media: 8,
  factory: 14,
  warehouse: 8,
  power: 10,
  shop: 2,
  cafe: 2,
  restaurant: 3,
  grocery: 5,
  mall: 8,
  cinema: 4,
  school: 6,
  university: 10,
  library: 3,
  lab: 8,
  community: 2,
  cityhall: 8,
  police: 5,
  firestation: 4,
  hospital: 10,
  kiosk: 1,
  boutique: 2,
  repair: 2,
  workshop: 2,
};

const START_SHARE: Record<DistrictId, Cohorts> = {
  downtown: { children: 0.1, students: 0.1, young: 0.35, adults: 0.35, elderly: 0.1 },
  residential: { children: 0.2, students: 0.1, young: 0.2, adults: 0.35, elderly: 0.15 },
  industrial: { children: 0.15, students: 0.05, young: 0.3, adults: 0.4, elderly: 0.1 },
  oldtown: { children: 0.12, students: 0.08, young: 0.22, adults: 0.33, elderly: 0.25 },
  university: { children: 0.05, students: 0.45, young: 0.3, adults: 0.15, elderly: 0.05 },
  suburbs: { children: 0.22, students: 0.08, young: 0.15, adults: 0.35, elderly: 0.2 },
  park: { children: 0, students: 0, young: 0, adults: 0, elderly: 0 },
};

export const total = (p: Cohorts) => p.children + p.students + p.young + p.adults + p.elderly;
const workers = (p: Cohorts) => p.young + p.adults + p.students * 0.2;

function rawHousing(b: Building): number {
  if (b.closed) return 0;
  if (b.kind === "house") return 16;
  if (b.kind === "apartment") return b.floors * b.w * b.h * 10;
  return 0;
}

function rawJobs(sim: Sim, b: Building): number {
  const w = JOB_WEIGHT[b.kind];
  if (!w || b.closed) return 0;
  let jobs = w * Math.max(1, b.floors) * b.w * b.h;
  const biz = sim.businessAt(b.id);
  if (biz) {
    if (!biz.open) return 0;
    jobs *= 0.6 + 0.4 * clamp(biz.demand, 0, 160) / 100;
    if (biz.automated) jobs *= 0.7;
  }
  return jobs;
}

export function initDistricts(sim: Sim) {
  const housing: Record<string, number> = {};
  const jobs: Record<string, number> = {};
  let hSum = 0;
  let jSum = 0;
  for (const b of sim.world.buildings) {
    housing[b.district] = (housing[b.district] ?? 0) + rawHousing(b);
    jobs[b.district] = (jobs[b.district] ?? 0) + rawJobs(sim, b);
    hSum += rawHousing(b);
    jSum += rawJobs(sim, b);
  }
  sim.housingScale = (START_POPULATION / 0.9) / Math.max(1, hSum);
  let workforce = 0;
  sim.districts = LIVING_DISTRICTS.map((id) => {
    const cap = (housing[id] ?? 0) * sim.housingScale;
    const n = cap * 0.9;
    const s = START_SHARE[id];
    const pop: Cohorts = { children: n * s.children, students: n * s.students, young: n * s.young, adults: n * s.adults, elderly: n * s.elderly };
    workforce += workers(pop);
    return {
      id,
      pop,
      housing: cap,
      jobs: 0,
      education: id === "university" ? 0.6 : id === "industrial" ? 0.35 : 0.45,
      skill: id === "university" ? 0.55 : id === "industrial" ? 0.35 : 0.45,
      income: 28,
      landValue: id === "downtown" ? 62 : id === "suburbs" ? 55 : id === "industrial" ? 35 : 48,
      unemployment: 0.06,
      attract: 0.5,
      netMigration: 0,
      condition: 0.8,
    } satisfies DistrictState;
  });
  sim.jobScale = (workforce * 0.94) / Math.max(1, jSum);
  for (const d of sim.districts) d.jobs = (jobs[d.id] ?? 0) * sim.jobScale;
  sim.daySamples.push(citySample(sim));
}

export function population(sim: Sim): number {
  return Math.round(sim.districts.reduce((s, d) => s + total(d.pop), 0));
}

export function citySample(sim: Sim) {
  const pop = sim.districts.reduce((s, d) => s + total(d.pop), 0) || 1;
  const w = (f: (d: DistrictState) => number) => sim.districts.reduce((s, d) => s + f(d) * total(d.pop), 0) / pop;
  return {
    era: sim.era,
    population: Math.round(pop),
    jobs: Math.round(sim.districts.reduce((s, d) => s + d.jobs, 0)),
    unemployment: w((d) => d.unemployment),
    education: w((d) => d.education),
    landValue: w((d) => d.landValue),
    income: w((d) => d.income),
  };
}

function story(sim: Sim, title: string, text: string, x: number, y: number) {
  sim.cityStories.push({ title, text });
  sim.pushEvent(`🏙️ ${text}`, "city", 3, x, y);
}

export function evolveCity(sim: Sim) {
  const P = sim.params;
  const C = sim.culture;
  const M = sim.metrics;
  const rng = sim.rng;
  const cnt = (k: string) => sim.cnt(k);
  const base = (k: string) => sim.baseCounts[k] ?? 0;
  const learnSignal = Math.log((cnt("teach") + cnt("learn") + 3) / (base("teach") + base("learn") + 3));
  const byD = new Map(sim.districts.map((d) => [d.id, d]));
  const popBefore = population(sim);

  // Jobs & housing capacity from the physical city
  const jobs: Record<string, number> = {};
  const housing: Record<string, number> = {};
  const pollution: Record<string, number> = {};
  for (const b of sim.world.buildings) {
    jobs[b.district] = (jobs[b.district] ?? 0) + rawJobs(sim, b);
    housing[b.district] = (housing[b.district] ?? 0) + rawHousing(b);
    if (!b.closed && (b.kind === "factory" || b.kind === "power")) pollution[b.district] = (pollution[b.district] ?? 0) + 1;
  }
  let cityJobs = 0;
  let cityWorkers = 0;
  for (const d of sim.districts) {
    const knowledge = 0.8 + d.skill * 0.45 + (sim.hidden.innovation - 50) / 250;
    d.jobs = (jobs[d.id] ?? 0) * sim.jobScale * (P.workHours < 8 ? 1.1 : 1) * knowledge;
    d.housing = (housing[d.id] ?? 0) * sim.housingScale;
    cityJobs += d.jobs;
    cityWorkers += workers(d.pop);
  }
  const cityUnemp = clamp01(1 - cityJobs / Math.max(1, cityWorkers));

  // Education, skills (lagged), unemployment, income, attractiveness
  for (const d of sim.districts) {
    const schools = sim.world.buildings.filter((b) => b.district === d.id && (b.kind === "school" || b.kind === "university" || b.kind === "library")).length;
    const target = clamp(0.22 + C.learning / 260 + schools * 0.025 + learnSignal * 0.06 + (P.skillQuota ? 0.06 : 0) + (P.internet ? 0.02 : -0.02), 0.1, 0.9);
    d.education += (target - d.education) * 0.12;
    d.skill += (d.education - d.skill) * 0.07;
    d.unemployment = clamp01(cityUnemp * (1.35 - d.skill * 0.7) + (d.id === "industrial" && P.workHours < 8 ? 0.02 : 0));
    const wageBase = P.money ? 30 : 20;
    d.income = wageBase * (0.55 + d.skill) * (1 - d.unemployment) + P.ubi * 1.6 + (d.id === "downtown" ? 4 : 0);
    const rent = d.landValue / 3;
    d.attract =
      0.45 * clamp01(1 - d.unemployment * 2.5) +
      0.2 * clamp01(d.income / 45) +
      0.15 * (M.safety / 100) +
      0.12 * (M.environment / 100) -
      0.05 * (pollution[d.id] ?? 0) +
      0.13 * (M.happiness / 100) +
      0.1 * (M.trust / 100) -
      0.18 * clamp01(rent / 40);
  }
  const avgAttract = sim.districts.reduce((s, d) => s + d.attract, 0) / sim.districts.length;

  // Demographics & migration
  for (const d of sim.districts) {
    const p = d.pop;
    const births = p.young * 0.002 * (M.happiness / 60) * (d.housing > total(p) ? 1 : 0.5);
    const deaths = p.elderly * 0.004 * (1.4 - M.happiness / 100);
    const a1 = p.children * 0.012;
    const a2 = p.students * 0.02;
    const a3 = p.young * 0.008;
    const a4 = p.adults * 0.005;
    p.children += births - a1;
    p.students += a1 - a2;
    p.young += a2 - a3;
    p.adults += a3 - a4;
    p.elderly += a4 - deaths;

    const n = total(p);
    const vacancy = d.housing - n;
    const inflow = n * (0.025 * (d.attract - avgAttract) + 0.02 * (d.attract - 0.62));
    const move = inflow > 0 ? Math.min(inflow, Math.max(0, vacancy) + n * 0.003) : Math.max(inflow, -n * 0.03);
    d.netMigration = move;
    const share = move > 0 ? { young: 0.55, adults: 0.3, children: 0.1, students: 0.05 } : { young: 0.5, adults: 0.35, children: 0.1, students: 0.05 };
    p.young = Math.max(0, p.young + move * share.young);
    p.adults = Math.max(0, p.adults + move * share.adults);
    p.children = Math.max(0, p.children + move * share.children);
    p.students = Math.max(0, p.students + move * share.students);
    if (d.id === "university") p.students += n * 0.004 * (d.education - 0.4);
    if (vacancy < 0) {
      const over = -vacancy * 0.3;
      p.young = Math.max(0, p.young - over * 0.6);
      p.adults = Math.max(0, p.adults - over * 0.4);
    }
  }

  // Land value
  for (const d of sim.districts) {
    const occ = total(d.pop) / Math.max(1, d.housing);
    const target = clamp(
      50 + (occ - 0.88) * 140 + (d.income - 28) * 1.1 + (M.environment - 60) * 0.3 + (M.safety - 60) * 0.25 - (pollution[d.id] ?? 0) * 3 + (d.id === "downtown" ? 10 : 0),
      5,
      98,
    );
    d.landValue += (target - d.landValue) * 0.18;
  }

  // Buildings: condition, level up / down, abandonment
  let changes = 0;
  const conds: Record<string, number[]> = {};
  const order = rng.shuffle([...sim.world.buildings]);
  for (const b of order) {
    const d = byD.get(b.district);
    if (!d) continue;
    const biz = sim.businessAt(b.id);
    const home = b.kind === "house" || b.kind === "apartment";
    let target = 0.3 + 0.4 * clamp01(d.income / 42) + 0.25 * (d.landValue / 100);
    if (biz) target += biz.open ? (biz.demand - 100) / 500 : -0.35;
    if (home) target -= clamp01(-d.netMigration / Math.max(1, total(d.pop)) * 20) * 0.3;
    if (CIVIC.has(b.kind)) target = Math.max(target, 0.7);
    b.condition = clamp01(b.condition + (target - b.condition) * 0.1 + rng.range(-0.01, 0.01));
    (conds[b.district] ??= []).push(b.condition);

    const next = LEVEL_LAND[b.level + 1];
    if (b.level < 5 && next !== undefined && d.landValue > next && b.condition > 0.7) b.levelStreak++;
    else if (b.condition < 0.35) b.levelStreak--;
    else b.levelStreak = Math.max(0, b.levelStreak - 1);

    if (changes < 6 && b.levelStreak >= 3 && b.level < 5) {
      b.level++;
      b.levelStreak = 0;
      if (GROWS_UP.has(b.kind)) b.floors += b.kind === "office" ? 2 : 1;
      changes++;
      if (b.level === 5 && !sim.flags.has("first-landmark")) {
        sim.flags.add("first-landmark");
        story(sim, "A NEW LANDMARK", `${b.name || "A building"} in ${DISTRICT_NAMES[b.district]} has been rebuilt as the city's first top-tier development.`, b.door.x, b.door.y);
      }
    } else if (changes < 6 && b.levelStreak <= -3 && b.level > 1) {
      b.level--;
      b.levelStreak = 0;
      if (GROWS_UP.has(b.kind) && b.floors > 2) b.floors -= 1;
      changes++;
    }
    if (home && !b.closed && b.condition < 0.15 && rng.chance(0.3)) {
      b.closed = true;
      if (!sim.flags.has("first-abandoned")) {
        sim.flags.add("first-abandoned");
        story(sim, "FIRST ABANDONED BUILDING", `Residents have left a building in ${DISTRICT_NAMES[b.district]}; its windows are boarded up.`, b.door.x, b.door.y);
      }
    } else if (home && b.closed && b.condition > 0.45) {
      b.closed = false;
    }
  }
  for (const d of sim.districts) {
    const c = conds[d.id];
    if (c?.length) d.condition = c.reduce((s, v) => s + v, 0) / c.length;
  }

  // Construction where housing is tight
  for (const d of sim.districts) {
    const occ = total(d.pop) / Math.max(1, d.housing);
    if (occ > 0.95 && d.income > 22 && rng.chance(0.6)) {
      const b = placeOnLot(sim.world, rng, "apartment", "", [d.id], sim.era);
      if (b) {
        b.level = 2;
        story(sim, "NEW HOMES", `Housing is tight in ${DISTRICT_NAMES[d.id]}, so a new apartment block is going up.`, b.door.x, b.door.y);
      }
    }
  }

  // Milestones
  const pop = population(sim);
  for (const m of [5000, 7500, 10000, 15000, 20000, 30000]) {
    const key = `pop-${m}`;
    if (pop >= m && !sim.flags.has(key)) {
      sim.flags.add(key);
      const p = sim.world.plazaSpot;
      story(sim, "MILESTONE", `The city passes ${m.toLocaleString()} residents as newcomers follow jobs and space.`, p.x, p.y);
    }
  }
  const unemp = citySample(sim).unemployment;
  if (unemp > 0.14 && !sim.flags.has(`jobs-crisis-${Math.floor(sim.era / 5)}`)) {
    sim.flags.add(`jobs-crisis-${Math.floor(sim.era / 5)}`);
    const p = sim.world.plazaSpot;
    story(sim, "JOBS CRISIS", `Unemployment reaches ${Math.round(unemp * 100)}% and families start to leave.`, p.x, p.y);
  }
  const delta = pop - popBefore;
  if (Math.abs(delta) > popBefore * 0.012) {
    const top = [...sim.districts].sort((a, b) => Math.abs(b.netMigration) - Math.abs(a.netMigration))[0];
    sim.cityStories.push({
      title: delta > 0 ? "NEWCOMERS ARRIVE" : "RESIDENTS MOVE AWAY",
      text: `The population ${delta > 0 ? "grew" : "fell"} by ${Math.abs(delta).toLocaleString()} overnight, led by ${DISTRICT_NAMES[top.id]}.`,
    });
  }
  sim.daySamples.push(citySample(sim));
}
