import type { Sim } from "./engine";
import { citySample, total } from "./evolution";
import type { DistrictState } from "./types";
import { DISTRICT_NAMES, addBuilding, bridgeTiles, buildIsland, claimBigLot, findBigLot, findDoor, idx } from "./world";

export type ProjectId = "mall" | "bridge" | "bridge-widening";

export interface ProjectState {
  id: ProjectId;
  status: "building" | "done";
  daysLeft: number;
  totalDays: number;
  startedEra: number;
  buildingId: number | null;
}

export const PROJECT_NAMES: Record<ProjectId, string> = {
  mall: "Galleria One shopping mall",
  bridge: "Harbor Bridge",
  "bridge-widening": "Harbor Bridge widening",
};

function story(sim: Sim, title: string, text: string) {
  sim.cityStories.push({ title, text });
  const p = sim.world.plazaSpot;
  sim.pushEvent(`🏗️ ${text}`, "project", 3, p.x, p.y);
}

function start(sim: Sim, id: ProjectId, days: number, buildingId: number | null) {
  sim.projects.push({ id, status: "building", daysLeft: days, totalDays: days, startedEra: sim.era, buildingId });
}

export function bridgeCapacity(sim: Sim) {
  return sim.projects.some((p) => p.id === "bridge-widening" && p.status === "done") ? 900 : 420;
}

export function updateProjects(sim: Sim) {
  const s = citySample(sim);
  const first = sim.daySamples[0] ?? s;
  const has = (id: ProjectId) => sim.projects.find((p) => p.id === id);

  // Feasibility: developments appear when the city creates the conditions for them
  if (!has("mall") && sim.era >= 4 && s.income > 29 && sim.culture.localism < 58 && sim.metrics.economy > 50) {
    const lot = findBigLot(sim.world, ["downtown", "suburbs", "residential"]);
    if (lot) {
      claimBigLot(sim.world, lot.x, lot.y);
      const b = addBuilding(sim.world, sim.rng, "mall", lot.x, lot.y, 2, 2, lot.district, "Galleria One", sim.era);
      b.construction = 0.05;
      b.door = findDoor(sim.world, b);
      sim.world.groundVersion++;
      start(sim, "mall", 3, b.id);
      story(sim, "BREAKING GROUND", `Developers begin work on Galleria One, a shopping mall in ${DISTRICT_NAMES[lot.district]}, drawn by rising incomes and spending.`);
    }
  }
  const growth = s.population / Math.max(1, first.population);
  if (!has("bridge") && sim.era >= 6 && (growth > 1.02 || s.landValue > 58) && sim.metrics.economy > 48) {
    start(sim, "bridge", 4, null);
    story(sim, "A BRIDGE TO THE ISLAND", `With the city ${growth > 1.02 ? "growing" : "getting pricier"}, construction starts on Harbor Bridge to open the undeveloped East Island.`);
  }
  const cong = sim.bridgeCongestion;
  if (has("bridge")?.status === "done" && !has("bridge-widening") && cong > 1 && sim.congestionDays >= 2) {
    start(sim, "bridge-widening", 3, null);
    story(sim, "BRIDGE TO BE WIDENED", `After ${sim.congestionDays} days of jams on Harbor Bridge, crews start adding lanes.`);
  }

  // Progress
  for (const p of sim.projects) {
    if (p.status !== "building") continue;
    if (p.startedEra === sim.era) continue;
    p.daysLeft--;
    const progress = 1 - p.daysLeft / p.totalDays;
    if (p.id === "mall" && p.buildingId !== null) sim.world.buildings[p.buildingId].construction = Math.max(0.05, progress);
    if (p.id === "bridge") {
      const tiles = bridgeTiles();
      const n = Math.floor(tiles.length * progress);
      for (let k = 0; k < n; k++) sim.world.tiles[idx(tiles[k].x, tiles[k].y)] = "bridge";
      sim.world.groundVersion++;
    }
    if (p.daysLeft > 0) continue;
    p.status = "done";
    if (p.id === "mall" && p.buildingId !== null) {
      const b = sim.world.buildings[p.buildingId];
      b.construction = 1;
      const biz = sim.registerBusiness(b, "Galleria One");
      if (biz) {
        biz.chain = true;
        biz.price = 5;
        biz.reputation = 70;
      }
      story(sim, "GALLERIA ONE OPENS", "The city's first big shopping mall opens its doors. Small shopkeepers nearby are watching their footfall nervously.");
    }
    if (p.id === "bridge") {
      const built = buildIsland(sim.world, sim.rng, sim.era);
      for (const b of built) if (b.kind !== "house" && b.kind !== "apartment") sim.registerBusiness(b, "");
      const housing = built.reduce((a, b) => a + (b.kind === "house" ? 16 : b.kind === "apartment" ? b.floors * 40 : 0), 0) * sim.housingScale;
      const coast: DistrictState = {
        id: "coast",
        pop: { children: 0, students: 0, young: housing * 0.08, adults: housing * 0.06, elderly: 0 },
        housing,
        jobs: 0,
        education: 0.45,
        skill: 0.45,
        income: 28,
        landValue: 58,
        unemployment: 0.05,
        attract: 0.6,
        netMigration: 0,
        condition: 0.9,
      };
      sim.districts.push(coast);
      story(sim, "HARBOR BRIDGE OPENS", "Harbor Bridge is open. Hotels, cafés and beach homes are rising on the new Harborview waterfront.");
    }
    if (p.id === "bridge-widening") story(sim, "WIDER BRIDGE OPENS", "Harbor Bridge reopens with extra lanes; commutes to Harborview get easier.");
  }

  // Bridge traffic: Harborview residents commuting in, plus visitors heading out to the beach
  const coast = sim.districts.find((d) => d.id === "coast");
  if (coast) {
    const commuters = (coast.pop.young + coast.pop.adults) * 0.6;
    const visitors = total(sim.districts.find((d) => d.id === "downtown")!.pop) * 0.05 * (sim.metrics.environment / 60) * (sim.params.outsideHour ? 1.5 : 1);
    sim.bridgeCongestion = (commuters + visitors) / bridgeCapacity(sim);
    sim.congestionDays = sim.bridgeCongestion > 1 ? sim.congestionDays + 1 : 0;
    if (sim.bridgeCongestion > 1.05 && sim.congestionDays === 1)
      story(sim, "GRIDLOCK ON HARBOR BRIDGE", `Traffic on Harbor Bridge ran at ${Math.round(sim.bridgeCongestion * 100)}% of capacity; deliveries to Harborview arrived late.`);
  }
}
