import { clamp01 } from "./rng";
import type { Rng } from "./rng";
import { BEHAVIORS } from "./types";
import type { Behavior, BuildingKind, Citizen, DistrictId, OccGroup, Traits, World } from "./types";

interface Occ {
  work: BuildingKind[] | null;
  group: OccGroup;
  wage: number;
  stipend: number;
  homes: DistrictId[];
  bias: Partial<Traits>;
}

const OCC: Record<string, Occ> = {
  Teacher: { work: ["school"], group: "education", wage: 3, stipend: 0, homes: ["residential", "oldtown"], bias: { generosity: 0.2, attachment: 0.2 } },
  "Shop Owner": { work: ["shop"], group: "commerce", wage: 3.4, stipend: 0, homes: ["oldtown", "residential"], bias: { ambition: 0.25, risk: 0.2 } },
  Student: { work: ["university"], group: "student", wage: 0, stipend: 12, homes: ["university"], bias: { curiosity: 0.3, influence: 0.15 } },
  "Factory Worker": { work: ["factory"], group: "industry", wage: 2.5, stipend: 0, homes: ["industrial", "oldtown"], bias: { productivity: 0.25, attachment: 0.15 } },
  Journalist: { work: ["media"], group: "office", wage: 3.5, stipend: 0, homes: ["downtown", "residential"], bias: { curiosity: 0.3, influence: 0.3 } },
  Researcher: { work: ["lab"], group: "education", wage: 4, stipend: 0, homes: ["university", "residential"], bias: { curiosity: 0.3 } },
  Barista: { work: ["cafe"], group: "commerce", wage: 2, stipend: 0, homes: ["oldtown", "university"], bias: { generosity: 0.1 } },
  "Office Clerk": { work: ["office"], group: "office", wage: 3, stipend: 0, homes: ["residential", "suburbs"], bias: { productivity: 0.1 } },
  "Software Engineer": { work: ["techco"], group: "office", wage: 5.5, stipend: 0, homes: ["suburbs", "downtown"], bias: { curiosity: 0.2, privacy: 0.25 } },
  "Civil Servant": { work: ["cityhall"], group: "civic", wage: 3.4, stipend: 0, homes: ["residential", "suburbs"], bias: { trust: 0.1 } },
  "Warehouse Worker": { work: ["warehouse"], group: "industry", wage: 2.2, stipend: 0, homes: ["industrial"], bias: { productivity: 0.15 } },
  Librarian: { work: ["library"], group: "education", wage: 2.8, stipend: 0, homes: ["university", "oldtown"], bias: { curiosity: 0.2, privacy: 0.1 } },
  Chef: { work: ["restaurant"], group: "commerce", wage: 2.6, stipend: 0, homes: ["oldtown"], bias: { ambition: 0.1 } },
  Banker: { work: ["bank"], group: "office", wage: 7, stipend: 0, homes: ["suburbs"], bias: { ambition: 0.3, risk: 0.1, generosity: -0.15 } },
  Cashier: { work: ["grocery", "mall"], group: "commerce", wage: 2, stipend: 0, homes: ["residential", "industrial"], bias: {} },
  Artist: { work: null, group: "creative", wage: 0, stipend: 8, homes: ["oldtown"], bias: { curiosity: 0.25, influence: 0.2 } },
  "Plant Operator": { work: ["power"], group: "industry", wage: 3.2, stipend: 0, homes: ["industrial", "residential"], bias: { productivity: 0.2 } },
  "Community Organizer": { work: ["community"], group: "civic", wage: 2.4, stipend: 0, homes: ["oldtown"], bias: { attachment: 0.3, generosity: 0.3, influence: 0.2 } },
  Professor: { work: ["university"], group: "education", wage: 5, stipend: 0, homes: ["university", "suburbs"], bias: { curiosity: 0.3 } },
  Retiree: { work: null, group: "none", wage: 0, stipend: 11, homes: ["suburbs", "oldtown"], bias: { attachment: 0.25 } },
  Unemployed: { work: null, group: "none", wage: 0, stipend: 6, homes: ["industrial", "residential"], bias: { risk: 0.15, trust: -0.15 } },
  "Cinema Manager": { work: ["cinema"], group: "commerce", wage: 3, stipend: 0, homes: ["downtown", "residential"], bias: {} },
};

const PEOPLE: [string, string, Partial<Traits>?][] = [
  ["Maya", "Teacher", { attachment: 0.92, generosity: 0.88 }],
  ["Arjun", "Shop Owner", { ambition: 0.88, risk: 0.8 }],
  ["Lina", "Student", { curiosity: 0.92, influence: 0.88 }],
  ["Daniel", "Factory Worker", { productivity: 0.88, attachment: 0.82 }],
  ["Noor", "Journalist", { curiosity: 0.9, influence: 0.92 }],
  ["Priya", "Researcher"],
  ["Tomás", "Barista"],
  ["Sofia", "Office Clerk"],
  ["Kenji", "Software Engineer"],
  ["Amara", "Civil Servant"],
  ["Leo", "Warehouse Worker"],
  ["Yuki", "Librarian"],
  ["Carlos", "Chef"],
  ["Ines", "Banker"],
  ["Ravi", "Cashier"],
  ["Zara", "Artist"],
  ["Marcus", "Plant Operator"],
  ["Elena", "Shop Owner"],
  ["Hassan", "Factory Worker"],
  ["Grace", "Community Organizer"],
  ["Felix", "Student"],
  ["Ana", "Professor"],
  ["Omar", "Warehouse Worker"],
  ["Chloe", "Barista"],
  ["Ivan", "Factory Worker"],
  ["Wei", "Office Clerk"],
  ["Fatima", "Teacher"],
  ["Nathan", "Software Engineer"],
  ["Ruth", "Retiree"],
  ["Diego", "Chef"],
  ["Aisha", "Cashier"],
  ["Mateo", "Student"],
  ["Hana", "Researcher"],
  ["Kwame", "Journalist"],
  ["Olga", "Retiree"],
  ["Sami", "Unemployed"],
  ["Beatriz", "Banker"],
  ["Jonah", "Cinema Manager"],
  ["Mei", "Office Clerk"],
  ["Tariq", "Factory Worker"],
  ["Lucia", "Shop Owner"],
  ["Pavel", "Warehouse Worker"],
  ["Nia", "Student"],
  ["Oscar", "Civil Servant"],
  ["Leila", "Artist"],
  ["Finn", "Unemployed"],
  ["Rosa", "Retiree"],
  ["Idris", "Plant Operator"],
];

const SKIN = ["#f1c9a5", "#e0ac7e", "#c68c5c", "#a86b43", "#8a5534", "#5f3a22", "#f5d7bf"];
const HAIR = ["#2b1d14", "#4a3020", "#7a5230", "#1c1c1c", "#b88a4a", "#d9d2c5", "#8a2f1f"];
const SHIRT: Record<OccGroup, string[]> = {
  education: ["#3d6fb6", "#5a8dd6"],
  commerce: ["#e07b39", "#e6a23c"],
  industry: ["#8a5a3a", "#6b6f78"],
  office: ["#4b5563", "#2f3e56"],
  civic: ["#7c4dab", "#9b6bd0"],
  student: ["#3fa06a", "#62bf8a"],
  creative: ["#d9487b", "#c75ad1"],
  none: ["#d9d4c7", "#a3a8b2"],
};

const CAPACITY: Partial<Record<BuildingKind, number>> = { house: 2, apartment: 6 };
const RENT: Partial<Record<DistrictId, number>> = { suburbs: 9, downtown: 8, residential: 6, university: 4, oldtown: 5, industrial: 3 };

export function rentFor(district: DistrictId) {
  return RENT[district] ?? 5;
}

export function baseBehavior(t: Traits): Record<Behavior, number> {
  const b = {} as Record<Behavior, number>;
  for (const k of BEHAVIORS) b[k] = 0.1;
  b.help = 0.12 + 0.35 * t.generosity;
  b.chat = 0.5;
  b.argue = 0.06 + 0.18 * (1 - t.trust) * (0.5 + t.risk);
  b.gossip = 0.08 + 0.22 * t.influence * (1 - t.trust * 0.6);
  b.reward = 0.3 + 0.3 * t.generosity;
  b.barter = 0.3 + 0.3 * t.ambition;
  b.teach = 0.06 + 0.25 * t.curiosity;
  b.plant = 0.03 + 0.12 * t.envConcern;
  b.litter = 0.04 + 0.28 * (1 - t.envConcern);
  b.recycle = 0.1 + 0.4 * t.envConcern;
  b.crime = 0.004 + 0.03 * t.risk * (1 - t.trust);
  b.protest = 0.05 + 0.2 * t.risk;
  b.volunteer = 0.05 + 0.3 * t.attachment * t.generosity;
  b.scroll = 0.25 + 0.4 * (1 - t.attachment);
  b.vote = 0.5 + 0.4 * t.curiosity;
  b.avoid = 0.05 + 0.3 * t.privacy;
  return b;
}

export const PROP_CAP: Record<Behavior, number> = {
  help: 0.95,
  chat: 0.95,
  argue: 0.7,
  gossip: 0.7,
  reward: 0.95,
  barter: 0.95,
  teach: 0.8,
  plant: 0.6,
  litter: 0.6,
  recycle: 0.95,
  crime: 0.12,
  protest: 0.6,
  volunteer: 0.8,
  shop: 0.9,
  scroll: 0.95,
  vote: 0.95,
  avoid: 0.8,
  repair: 0.9,
  delegate: 0.9,
  learn: 0.9,
  cleanup: 0.9,
};

export function generateCitizens(rng: Rng, world: World): Citizen[] {
  const homes = world.buildings.filter((b) => CAPACITY[b.kind]);
  const occupancy = new Map<number, number>();
  const employees = new Map<number, number>();

  return PEOPLE.map(([name, occupation, overrides], id) => {
    const occ = OCC[occupation];
    const t: Traits = {
      trust: rng.range(0.4, 0.75),
      ambition: rng.range(0.2, 0.75),
      generosity: rng.range(0.2, 0.75),
      risk: rng.range(0.15, 0.7),
      influence: rng.range(0.15, 0.7),
      productivity: rng.range(0.35, 0.8),
      envConcern: rng.range(0.15, 0.75),
      privacy: rng.range(0.15, 0.75),
      attachment: rng.range(0.2, 0.75),
      curiosity: rng.range(0.2, 0.75),
    };
    for (const [k, v] of Object.entries(occ.bias) as [keyof Traits, number][]) t[k] = clamp01(t[k] + v);
    if (overrides) Object.assign(t, overrides);

    const homeCandidates = homes.filter(
      (h) => occ.homes.includes(h.district) && (occupancy.get(h.id) ?? 0) < (CAPACITY[h.kind] ?? 0),
    );
    const anyFree = homes.filter((h) => (occupancy.get(h.id) ?? 0) < (CAPACITY[h.kind] ?? 0));
    const home = rng.pick(homeCandidates.length ? homeCandidates : anyFree);
    occupancy.set(home.id, (occupancy.get(home.id) ?? 0) + 1);

    let workId: number | null = null;
    if (occ.work) {
      const options = world.buildings.filter((b) => occ.work!.includes(b.kind));
      options.sort((a, b) => (employees.get(a.id) ?? 0) - (employees.get(b.id) ?? 0));
      const least = employees.get(options[0]?.id ?? -1) ?? 0;
      const pool = options.filter((o) => (employees.get(o.id) ?? 0) === least);
      if (pool.length) {
        const w = rng.pick(pool);
        workId = w.id;
        employees.set(w.id, (employees.get(w.id) ?? 0) + 1);
      }
    }

    const base = baseBehavior(t);
    return {
      id,
      name,
      occupation,
      group: occ.group,
      homeId: home.id,
      workId,
      wage: occ.wage,
      stipend: occ.stipend,
      workStart: rng.range(7.8, 9.3),
      bedtime: rng.range(21.3, 23.3),
      traits: t,
      base,
      prop: { ...base },
      mood: rng.range(52, 68),
      stress: rng.range(0.2, 0.45),
      wealth: occ.wage * 16 + occ.stipend * 3 + rng.range(8, 28),
      favors: 5,
      reputation: rng.range(35, 55) + t.influence * 20,
      skills: rng.int(1, 4),
      fatigue: 0,
      x: home.door.x + 0.5,
      y: home.door.y + 0.5,
      ox: rng.range(-0.28, 0.28),
      oy: rng.range(-0.28, 0.28),
      path: [],
      dest: null,
      loc: { kind: "building", id: home.id },
      inside: home.id,
      activity: "home",
      activityUntil: 0,
      protestUntil: 0,
      lastInteract: -10,
      lastSeen: {},
      bubble: null,
      day: { helped: 0, planted: false, learned: false, rewarded: false, lunch: false, outside: 0, delegatedTo: null, taskHour: 15 },
      log: [],
      skin: rng.pick(SKIN),
      hair: rng.pick(HAIR),
      shirt: rng.pick(SHIRT[occ.group]),
      walkPhase: rng.range(0, 6),
      lastBiz: null,
    } satisfies Citizen;
  });
}
