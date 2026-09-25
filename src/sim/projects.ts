import type { Sim } from "./engine";
import { citySample, total } from "./evolution";
import type { DistrictState } from "./types";
import { DISTRICT_NAMES, addBuilding, bridgeTiles, buildAirport, buildIsland, buildShipyard, claimBigLot, expandPort, findBigLot, findDoor, idx, layRail, placeMetro } from "./world";

export type ProjectId =
  | "mall"
  | "bridge"
  | "bridge-widening"
  | "railway"
  | "metro"
  | "port"
  | "shipyard"
  | "airport"
  | "metro-2"
  | "airport-2"
  | "port-2";

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
  railway: "Metro Loop",
  metro: "City Metro Line 1",
  port: "Port expansion",
  shipyard: "Harbor Shipyard",
  airport: "Harbor International Airport",
  "metro-2": "Metro Line 2",
  "airport-2": "Airport Terminal 2",
  "port-2": "Deepwater Port Berths",
};

export interface Infra {
  rail: boolean;
  metro: boolean;
  port: boolean;
  shipyard: boolean;
  airport: boolean;
  metro2: boolean;
  port2: boolean;
  airport2: boolean;
  stations: string[];
  metroStops: string[];
}

export function infra(sim: Sim): Infra {
  const done = (id: ProjectId) => sim.projects.some((p) => p.id === id && p.status === "done");
  return {
    rail: done("railway"),
    metro: done("metro"),
    port: done("port"),
    shipyard: done("shipyard"),
    airport: done("airport"),
    metro2: done("metro-2"),
    port2: done("port-2"),
    airport2: done("airport-2"),
    stations: sim.railStations,
    metroStops: sim.metroStops,
  };
}

function story(sim: Sim, title: string, text: string, opened = false) {
  sim.cityStories.push({ title, text });
  const p = sim.world.plazaSpot;
  sim.pushEvent(`${opened ? "🎉" : "🏗️"} ${text}`, opened ? "grand-opening" : "construction", 3, p.x, p.y);
}

// Pacing: a short 10-day term needs lower thresholds and shorter builds to
// realistically see a development finish. 30-day and Endless keep the
// baseline pacing (verified to work well across day 7-30).
function pace(sim: Sim): number {
  return Number.isFinite(sim.totalEras) && sim.totalEras <= 10 ? 0.82 : 1;
}

function buildDays(sim: Sim, base: number): number {
  return Number.isFinite(sim.totalEras) && sim.totalEras <= 10 ? Math.max(2, base - 1) : base;
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
  const k = pace(sim);

  // Feasibility: developments appear when the city creates the conditions for them
  if (!has("mall") && s.income > 29 * k && sim.culture.localism < 58 && sim.metrics.economy > 50 * k) {
    const lot = findBigLot(sim.world, ["downtown", "suburbs", "residential"]);
    if (lot) {
      claimBigLot(sim.world, lot.x, lot.y);
      const b = addBuilding(sim.world, sim.rng, "mall", lot.x, lot.y, 2, 2, lot.district, "Galleria One", sim.era);
      b.construction = 0.05;
      b.door = findDoor(sim.world, b);
      sim.world.groundVersion++;
      start(sim, "mall", buildDays(sim, 3), b.id);
      story(sim, "BREAKING GROUND", `Developers begin work on Galleria One, a shopping mall in ${DISTRICT_NAMES[lot.district]}, drawn by rising incomes and spending.`);
    }
  }
  const growth = s.population / Math.max(1, first.population);
  if (!has("bridge") && (growth > 1.02 || s.landValue > 58 * k) && sim.metrics.economy > 48 * k) {
    start(sim, "bridge", buildDays(sim, 4), null);
    story(sim, "A BRIDGE TO THE ISLAND", `With the city ${growth > 1.02 ? "growing" : "getting pricier"}, construction starts on Harbor Bridge to open the undeveloped East Island.`);
  }
  const dist = (id: string) => sim.districts.find((d) => d.id === id);
  const ind = dist("industrial");
  const down = dist("downtown");
  const production = sim.businesses.filter((b) => !b.consumer && b.open && (b.type === "Factory" || b.type === "Logistics"));
  const output = production.reduce((a, b) => a + b.demand, 0) / Math.max(1, production.length);
  if (!has("railway") && (s.population > 4700 * k || output > 110 * k) && sim.metrics.economy > 50 * k) {
    start(sim, "railway", buildDays(sim, 4), null);
    story(sim, "METRO LOOP APPROVED", `${s.population > 4700 ? "A growing commuter population" : "Busy factories needing better transit"} tips the balance: work begins on an elevated Metro Loop circling the city.`);
  }
  if (!has("metro") && s.population > 5000 * k && (down?.landValue ?? 0) > 64 * k && sim.metrics.economy > 54 * k) {
    start(sim, "metro", buildDays(sim, 5), null);
    story(sim, "METRO DIGS BEGIN", "Downtown streets are too crowded and land too valuable for more roads. Tunnelling starts on Metro Line 1.");
  }
  if (!has("port") && output > 105 * k && (ind?.unemployment ?? 1) < 0.12 / k) {
    start(sim, "port", buildDays(sim, 4), null);
    story(sim, "PORT TO EXPAND", "Factories are shipping more than the docks can handle. New berths and container yards are going in.");
  }
  if (!has("shipyard") && has("port")?.status === "done" && (ind?.skill ?? 0) > 0.42) {
    start(sim, "shipyard", buildDays(sim, 5), null);
    story(sim, "SHIPYARD PLANNED", "A skilled industrial workforce and a busier port attract a shipbuilder to the harbor.");
  }
  if (!has("airport") && has("bridge")?.status === "done" && s.population > 5200 * k && s.income > 32 * k) {
    start(sim, "airport", buildDays(sim, 6), null);
    story(sim, "AN AIRPORT FOR THE CITY", "Tourists, business travel and a prosperous population make the case: land is being reclaimed north of Harborview for an airport.");
  }
  const cong = sim.bridgeCongestion;
  if (has("bridge")?.status === "done" && !has("bridge-widening") && cong > 1 && sim.congestionDays >= 2) {
    start(sim, "bridge-widening", buildDays(sim, 3), null);
    story(sim, "BRIDGE TO BE WIDENED", `After ${sim.congestionDays} days of jams on Harbor Bridge, crews start adding lanes.`);
  }

  // Phase 2: only relevant in long/Endless games where the city keeps growing
  // well past the point the first seven developments solve. Each requires its
  // predecessor and a materially bigger city, so they can't rush in early.
  if (!has("metro-2") && has("metro")?.status === "done" && s.population > 7200 * k && sim.metrics.economy > 55 * k) {
    start(sim, "metro-2", buildDays(sim, 5), null);
    story(sim, "METRO LINE 2 APPROVED", "Line 1 alone can't keep up with a growing city. Line 2 will reach Old Town and the Suburbs.");
  }
  if (!has("port-2") && has("port")?.status === "done" && output > 120 * k && (ind?.unemployment ?? 1) < 0.1) {
    start(sim, "port-2", buildDays(sim, 4), null);
    story(sim, "DEEPWATER BERTHS PLANNED", "Even the expanded port is at capacity. New deepwater berths will let larger ships dock.");
  }
  if (!has("airport-2") && has("airport")?.status === "done" && s.population > 8500 * k && s.income > 34 * k) {
    start(sim, "airport-2", buildDays(sim, 5), null);
    story(sim, "SECOND TERMINAL BREAKS GROUND", "Harbor International outgrew itself fast. A second terminal is going up beside the first.");
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
      story(sim, "GALLERIA ONE OPENS", "The city's first big shopping mall opens its doors. Small shopkeepers nearby are watching their footfall nervously.", true);
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
      story(
        sim,
        "HARBOR BRIDGE OPENS",
        `Harbor Bridge is open. Hotels, cafés and beach homes are rising on the new Harborview waterfront.${
          sim.world.flags.has("rail") ? " The Metro Loop has already grown a branch across the water to serve it." : ""
        }`,
        true,
      );
    }
    if (p.id === "bridge-widening") story(sim, "WIDER BRIDGE OPENS", "Harbor Bridge reopens with extra lanes; commutes to Harborview get easier.", true);
    if (p.id === "railway") {
      const st = layRail(sim.world, []);
      sim.railStations = [...new Set(st.map((s) => s.d))];
      story(sim, "THE METRO LOOP OPENS", `A ring of elevated track now circles the whole city, with ${st.length} stations serving ${sim.railStations.map((d) => DISTRICT_NAMES[d as keyof typeof DISTRICT_NAMES]).join(", ")}. Trains run continuously, day and night.`, true);
    }
    if (p.id === "metro") {
      sim.metroStops = placeMetro(sim.world, sim.rng, ["downtown", "residential", "university", "oldtown"]);
      story(sim, "METRO LINE 1 OPENS", "Metro Line 1 opens beneath downtown. Land near its entrances is already changing hands at higher prices.", true);
    }
    if (p.id === "port") {
      expandPort(sim.world, sim.rng);
      story(sim, "BIGGER PORT OPENS", "The expanded port opens: more cranes, more containers, more jobs, and more trucks and smoke along the industrial waterfront.", true);
    }
    if (p.id === "shipyard") {
      buildShipyard(sim.world);
      story(sim, "FIRST HULL LAID", "Harbor Shipyard lays its first hull. Welders and engineers are in demand across the industrial district.", true);
    }
    if (p.id === "airport") {
      const t = buildAirport(sim.world, sim.rng, sim.era);
      sim.registerBusiness(t, "Harbor International");
      story(sim, "FIRST FLIGHT LANDS", "Harbor International Airport opens. Hotels in Harborview are booking up; neighbors are learning to live with the noise.", true);
    }
    if (p.id === "metro-2") {
      const added = placeMetro(sim.world, sim.rng, ["oldtown", "suburbs"]);
      sim.metroStops = [...new Set([...sim.metroStops, ...added])];
      story(sim, "METRO LINE 2 OPENS", "Metro Line 2 reaches Old Town and the Suburbs. Two more neighborhoods are a short ride from downtown.", true);
    }
    if (p.id === "port-2") {
      expandPort(sim.world, sim.rng);
      sim.world.flags.add("port-2-open");
      story(sim, "DEEPWATER BERTHS OPEN", "The new berths let bigger ships dock. Freight volume — and industrial jobs — jump again.", true);
    }
    if (p.id === "airport-2") {
      sim.world.flags.add("airport-2-open");
      story(sim, "SECOND TERMINAL OPENS", "Harbor International's second terminal opens. The airport now rivals cities twice this one's size.", true);
    }
  }

  const inf = infra(sim);
  const relief = (inf.rail ? 0.85 : 1) * (inf.metro ? 0.9 : 1);
  // Bridge traffic: Harborview residents commuting in, plus visitors heading out to the beach
  const coast = sim.districts.find((d) => d.id === "coast");
  if (coast) {
    const commuters = (coast.pop.young + coast.pop.adults) * 0.6;
    const visitors = total(sim.districts.find((d) => d.id === "downtown")!.pop) * 0.05 * (sim.metrics.environment / 60) * (sim.params.outsideHour ? 1.5 : 1);
    sim.bridgeCongestion = ((commuters + visitors * (inf.airport ? 1.6 : 1)) / bridgeCapacity(sim)) * relief;
    sim.congestionDays = sim.bridgeCongestion > 1 ? sim.congestionDays + 1 : 0;
    if (sim.bridgeCongestion > 1.05 && sim.congestionDays === 1)
      story(sim, "GRIDLOCK ON HARBOR BRIDGE", `Traffic on Harbor Bridge ran at ${Math.round(sim.bridgeCongestion * 100)}% of capacity; deliveries to Harborview arrived late.`);
  }
}
