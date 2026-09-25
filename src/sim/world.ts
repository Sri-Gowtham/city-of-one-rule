import type { Rng } from "./rng";
import type { Building, BuildingKind, DistrictId, TileKind, World } from "./types";

export const BLOCKS = 7;
export const LAST_ROAD = 1 + BLOCKS * 6;
export const MAIN = LAST_ROAD + 4;
export const ISLAND_X0 = MAIN + 3;
export const ISLAND_X1 = ISLAND_X0 + 7;
export const ISLAND_Y0 = 7;
export const ISLAND_Y1 = MAIN - 9;
export const BRIDGE_Y = ROADS_Y();
export const S = ISLAND_X1 + 4;

function ROADS_Y() {
  return 1 + Math.floor(BLOCKS / 2) * 6;
}
export const ROADS = Array.from({ length: BLOCKS + 1 }, (_, i) => 1 + i * 6);
const ORIGINS = Array.from({ length: BLOCKS }, (_, i) => 2 + i * 6);
const DIRS: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

type BlockKind = DistrictId | "civic";

const LAYOUT: BlockKind[][] = [
  ["suburbs", "suburbs", "suburbs", "residential", "university", "university", "university"],
  ["suburbs", "suburbs", "residential", "residential", "residential", "university", "university"],
  ["suburbs", "residential", "downtown", "downtown", "downtown", "residential", "university"],
  ["residential", "residential", "downtown", "civic", "downtown", "residential", "residential"],
  ["oldtown", "oldtown", "downtown", "park", "downtown", "industrial", "industrial"],
  ["oldtown", "oldtown", "oldtown", "park", "industrial", "industrial", "industrial"],
  ["oldtown", "oldtown", "park", "park", "industrial", "industrial", "industrial"],
];

const FILLER: Record<DistrictId, LotSpec[]> = {
  downtown: [
    { t: "big", kind: "office" },
    { t: "big", kind: "apartment" },
    { t: "quad", kinds: ["shop", "cafe", "restaurant", "shop"] },
    { t: "big", kind: "office" },
  ],
  residential: [
    { t: "big", kind: "apartment" },
    { t: "quad", kinds: ["house", "house", "house", "house"] },
    { t: "quad", kinds: ["house", "shop", "house", "house"] },
  ],
  suburbs: [{ t: "pair" }, { t: "pair" }, { t: "quad", kinds: ["house", "house", "house", "house"] }],
  university: [{ t: "big", kind: "apartment" }, { t: "quad", kinds: ["cafe", "house", "house", "shop"] }, { t: "pocket" }],
  oldtown: [
    { t: "quad", kinds: ["cafe", "shop", "restaurant", "shop"] },
    { t: "quad", kinds: ["house", "house", "house", "house"] },
    { t: "big", kind: "apartment" },
  ],
  industrial: [{ t: "big", kind: "warehouse" }, { t: "yard" }, { t: "big", kind: "apartment" }, { t: "big", kind: "factory" }],
  park: [],
  coast: [],
};

export const DISTRICT_NAMES: Record<DistrictId, string> = {
  downtown: "Downtown",
  residential: "Residential",
  industrial: "Industrial",
  oldtown: "Old Town",
  university: "University District",
  suburbs: "Suburbs",
  park: "Central Park",
  coast: "Harborview",
};

type LotSpec =
  | { t: "big"; kind: BuildingKind; name?: string }
  | { t: "quad"; kinds: (BuildingKind | null)[] }
  | { t: "pair" }
  | { t: "empty" }
  | { t: "pocket" }
  | { t: "yard"; market?: boolean };

const H4: (BuildingKind | null)[] = ["house", "house", "house", "house"];
const rep = <T>(n: number, v: T): T[] => Array.from({ length: n }, () => v);

const QUEUES: Record<DistrictId, LotSpec[]> = {
  downtown: [
    { t: "big", kind: "office", name: "Meridian Tower" },
    { t: "big", kind: "bank", name: "Crestline Bank" },
    { t: "big", kind: "media", name: "CITYWIRE" },
    { t: "big", kind: "techco", name: "ByteForge" },
    { t: "big", kind: "cinema", name: "Starlight Cinema" },
    { t: "big", kind: "grocery", name: "City Mart" },
    { t: "big", kind: "office", name: "Harbor Offices" },
    { t: "big", kind: "apartment", name: "Skyline Residences" },
    { t: "quad", kinds: ["shop", "cafe", "restaurant", "shop"] },
    { t: "big", kind: "office", name: "Civic Tower" },
    { t: "big", kind: "office", name: "Summit Plaza" },
    { t: "big", kind: "techco", name: "Nimbus Systems" },
    { t: "big", kind: "cinema", name: "Grand Odeon" },
    { t: "big", kind: "apartment" },
    { t: "empty" },
  ],
  residential: [
    { t: "big", kind: "school", name: "Riverside School" },
    { t: "big", kind: "school", name: "Hillcrest Academy" },
    { t: "big", kind: "firestation", name: "Riverside Fire Station" },
    { t: "big", kind: "community", name: "Eastside Commons" },
    { t: "big", kind: "grocery", name: "Maple Grocer" },
    ...rep<LotSpec>(5, { t: "big", kind: "apartment" }),
    ...rep<LotSpec>(6, { t: "quad", kinds: H4 }),
    { t: "quad", kinds: ["shop", "house", "cafe", "house"] },
    { t: "empty" },
    { t: "empty" },
  ],
  suburbs: [
    ...rep<LotSpec>(8, { t: "pair" }),
    { t: "big", kind: "mall", name: "Northgate Mall" },
    { t: "quad", kinds: H4 },
    { t: "quad", kinds: H4 },
    { t: "empty" },
  ],
  university: [
    { t: "big", kind: "university", name: "Aldermoor University" },
    { t: "big", kind: "library", name: "Grand Library" },
    { t: "big", kind: "lab", name: "Helix Labs" },
    { t: "big", kind: "lab", name: "Institute of Tomorrow" },
    ...rep<LotSpec>(4, { t: "big", kind: "apartment" }),
    { t: "quad", kinds: ["cafe", "shop", "house", "house"] },
    { t: "pocket" },
    { t: "empty" },
    { t: "empty" },
  ],
  oldtown: [
    { t: "big", kind: "community", name: "Old Town Community Center" },
    ...rep<LotSpec>(3, { t: "quad", kinds: ["cafe", "shop", "restaurant", "shop"] }),
    ...rep<LotSpec>(2, { t: "quad", kinds: ["house", "shop", "house", "house"] }),
    ...rep<LotSpec>(3, { t: "quad", kinds: H4 }),
    ...rep<LotSpec>(3, { t: "big", kind: "apartment" }),
    { t: "yard", market: true },
    { t: "pocket" },
    { t: "empty" },
    { t: "empty" },
  ],
  industrial: [
    { t: "big", kind: "factory", name: "Ironworks" },
    { t: "big", kind: "factory", name: "Delta Plastics" },
    { t: "big", kind: "factory", name: "Northline Textiles" },
    { t: "big", kind: "warehouse", name: "Harbor Logistics" },
    ...rep<LotSpec>(4, { t: "big", kind: "warehouse" }),
    { t: "big", kind: "power", name: "Riverside Power" },
    { t: "big", kind: "factory", name: "Harborline Foods" },
    ...rep<LotSpec>(3, { t: "big", kind: "apartment" }),
    { t: "quad", kinds: H4 },
    { t: "quad", kinds: H4 },
    ...rep<LotSpec>(3, { t: "yard" }),
    ...rep<LotSpec>(3, { t: "empty" }),
  ],
  park: [],
  coast: [],
};

const FLOORS: Record<BuildingKind, [number, number]> = {
  house: [1, 1],
  apartment: [4, 6],
  shop: [1, 2],
  mall: [2, 2],
  cafe: [2, 2],
  restaurant: [2, 2],
  grocery: [1, 1],
  office: [7, 11],
  bank: [3, 3],
  media: [5, 6],
  techco: [4, 6],
  cinema: [2, 2],
  factory: [2, 2],
  warehouse: [2, 2],
  power: [2, 2],
  school: [2, 2],
  university: [3, 3],
  library: [2, 2],
  lab: [3, 3],
  community: [2, 2],
  cityhall: [3, 3],
  kiosk: [1, 1],
  boutique: [2, 2],
  repair: [1, 1],
  workshop: [1, 1],
  police: [2, 3],
  firestation: [1, 2],
  hospital: [3, 5],
  terminal: [2, 2],
};

const WALLS: Partial<Record<BuildingKind, string[]>> = {
  house: ["#f2d6b3", "#ecc6c0", "#cfe0ea", "#f3e3a2", "#d6e6c6", "#e9d8ef"],
  apartment: ["#e6d2b5", "#d4bea0", "#d9c7da", "#c9d6c4", "#e8cdb4"],
  shop: ["#f0b46a", "#8fc1b5", "#e98a78", "#a9b8e8", "#f1d36b"],
  cafe: ["#b98460"],
  restaurant: ["#a8484b"],
  office: ["#88aecf", "#9cb9cf", "#7d9fbe"],
};

const BASE_COLORS: Record<BuildingKind, [string, string, string]> = {
  house: ["#f2d6b3", "#b5533c", "#6b4b3a"],
  apartment: ["#e6d2b5", "#8b8f98", "#5a6b7c"],
  shop: ["#f0b46a", "#6f5a4a", "#d8433b"],
  mall: ["#e5dccb", "#8f8a82", "#e0703b"],
  cafe: ["#b98460", "#5a3c2e", "#f2e3c6"],
  restaurant: ["#a8484b", "#4a2e2e", "#f2d18b"],
  grocery: ["#e8e2d2", "#6e7c63", "#3f9a55"],
  office: ["#88aecf", "#56687c", "#dfeaf3"],
  bank: ["#ddd4c2", "#a79e8d", "#c9a33a"],
  media: ["#c9d1da", "#51606f", "#e04b3c"],
  techco: ["#7fc7c4", "#3f5f66", "#e9fbff"],
  cinema: ["#6d4f8f", "#3c2d52", "#f5c84b"],
  factory: ["#a65a45", "#5d4a44", "#d9d0c4"],
  warehouse: ["#8ea0b3", "#5f6f80", "#e0b64a"],
  power: ["#c7ccd1", "#7a838c", "#e0c040"],
  school: ["#c46a4f", "#4f5c6e", "#f3eee2"],
  university: ["#b65e4a", "#3f5b4f", "#eadcc0"],
  library: ["#e3cfa3", "#6a7f8f", "#3e6b53"],
  lab: ["#eef1f3", "#7d8b96", "#4aa3d9"],
  community: ["#c7835a", "#5b4a3f", "#3e8e6a"],
  police: ["#c7ccd1", "#1f3a63", "#d9b44a"],
  firestation: ["#a65a45", "#3a2a24", "#f2c14e"],
  hospital: ["#eef1f3", "#7d8b96", "#e0463a"],
  terminal: ["#dfe8ee", "#7d8b96", "#3d6fb6"],
  cityhall: ["#efe4cc", "#3d8d86", "#d9b44a"],
  kiosk: ["#f2c46b", "#d8433b", "#ffffff"],
  boutique: ["#2f2f38", "#1d1d24", "#d9b44a"],
  repair: ["#6f8a5a", "#3f4a37", "#f2d06b"],
  workshop: ["#b08b62", "#5a4632", "#e8d4ae"],
};

const BLOCKED: ReadonlySet<TileKind> = new Set<TileKind>(["water", "pond"]);

export const idx = (x: number, y: number) => y * S + x;
export const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < S && y < S;

export function isWalkable(w: World, x: number, y: number): boolean {
  if (!inBounds(x, y)) return false;
  const i = idx(x, y);
  return w.occupied[i] === -1 && !BLOCKED.has(w.tiles[i]);
}

export function generateWorld(rng: Rng): World {
  const tiles: TileKind[] = new Array(S * S).fill("grass");
  const district: DistrictId[] = new Array(S * S).fill("suburbs");
  const occupied: number[] = new Array(S * S).fill(-1);
  const world: World = {
    size: S,
    tiles,
    district,
    occupied,
    buildings: [],
    trees: [],
    treeAt: new Set(),
    litter: [],
    props: [],
    lots: [],
    outdoorSpots: [],
    plazaSpot: { x: 16, y: 18 },
    groundVersion: 1,
    flags: new Set(),
  };
  const set = (x: number, y: number, t: TileKind) => {
    if (inBounds(x, y)) tiles[idx(x, y)] = t;
  };

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const island = x >= ISLAND_X0 - 1 && x <= ISLAND_X1 + 1 && y >= ISLAND_Y0 - 1 && y <= ISLAND_Y1 + 1;
      if (island) {
        const edge = x === ISLAND_X0 - 1 || x === ISLAND_X1 + 1 || y === ISLAND_Y0 - 1 || y === ISLAND_Y1 + 1;
        set(x, y, edge ? "sand" : "grass");
        district[idx(x, y)] = "coast";
      } else if (x >= MAIN - 2 || y >= MAIN - 2) set(x, y, "water");
      else if (x === MAIN - 3 || y === MAIN - 3) set(x, y, "sand");
    }
  }
  for (const r of ROADS) {
    for (let k = 1; k <= LAST_ROAD; k++) {
      set(r, k, "road");
      set(k, r, "road");
    }
  }

  const queues: Record<DistrictId, LotSpec[]> = {} as Record<DistrictId, LotSpec[]>;
  for (const d of Object.keys(QUEUES) as DistrictId[]) queues[d] = rng.shuffle([...QUEUES[d]]);

  let parks = 0;
  for (let by = 0; by < BLOCKS; by++) {
    for (let bx = 0; bx < BLOCKS; bx++) {
      const kind = LAYOUT[by][bx];
      const x0 = ORIGINS[bx];
      const y0 = ORIGINS[by];
      const d: DistrictId = kind === "civic" ? "downtown" : kind;
      for (let ly = -1; ly <= 5; ly++)
        for (let lx = -1; lx <= 5; lx++) if (inBounds(x0 + lx, y0 + ly)) district[idx(x0 + lx, y0 + ly)] = d;

      if (kind === "civic") {
        buildCivic(world, rng, x0, y0);
        continue;
      }
      if (kind === "park") {
        buildPark(world, rng, x0, y0, parks++ % 2 === 0);
        continue;
      }
      const gap: TileKind = d === "downtown" || d === "oldtown" || d === "industrial" ? "walk" : "garden";
      for (let ly = 0; ly < 5; ly++)
        for (let lx = 0; lx < 5; lx++) if (lx === 2 || ly === 2) set(x0 + lx, y0 + ly, gap);

      const corners = [
        [0, 0],
        [3, 0],
        [0, 3],
        [3, 3],
      ];
      for (const [lx, ly] of corners) {
        const spec = queues[d].shift() ?? (rng.chance(0.12) ? { t: "empty" as const } : rng.pick(FILLER[d]));
        fillLot(world, rng, spec, x0 + lx, y0 + ly, d);
      }
    }
  }

  for (let x = 0; x < MAIN - 3; x++) {
    if (tiles[idx(x, 0)] === "grass" && rng.chance(0.4)) addTree(world, rng, x, 0, -999, false);
    if (tiles[idx(0, x)] === "grass" && rng.chance(0.4)) addTree(world, rng, 0, x, -999, false);
  }
  for (let k = 2; k < MAIN - 3; k++) {
    if (k % 5 === 0) {
      addTree(world, rng, k, MAIN - 3, -999, false);
      addTree(world, rng, MAIN - 3, k, -999, false);
    } else if (k % 5 === 2) {
      world.props.push({ kind: "bench", x: k, y: MAIN - 3, variant: 0 });
      world.props.push({ kind: "bench", x: MAIN - 3, y: k, variant: 1 });
    }
  }
  world.props.push({ kind: "crane", x: MAIN - 7, y: MAIN - 3, variant: 0 });
  world.props.push({ kind: "crane", x: MAIN - 12, y: MAIN - 3, variant: 0 });
  world.props.push({ kind: "crane", x: MAIN - 3, y: MAIN - 7, variant: 1 });
  for (let y = ISLAND_Y0; y <= ISLAND_Y1; y++)
    for (let x = ISLAND_X0; x <= ISLAND_X1; x++) if (rng.chance(0.28)) addTree(world, rng, x, y, -999, false);

  for (const rx of ROADS) for (const ry of ROADS) world.props.push({ kind: "streetlight", x: rx, y: ry, variant: 0 });

  const billboardSpots: { x: number; y: number }[] = [];
  for (let i = 0; i < S * S; i++) {
    const dd = district[i];
    if (tiles[i] === "walk" && (dd === "downtown" || dd === "oldtown") && occupied[i] === -1) {
      billboardSpots.push({ x: i % S, y: Math.floor(i / S) });
    }
  }
  rng.shuffle(billboardSpots);
  for (const s of billboardSpots.slice(0, 9)) world.props.push({ kind: "billboard", x: s.x, y: s.y, variant: rng.int(0, 4) });

  // District-appropriate street furniture: hydrants near dense/industrial blocks,
  // bike racks near university/old-town/residential, bins wherever people gather.
  const walkSpots: { x: number; y: number; d: DistrictId }[] = [];
  for (let i = 0; i < S * S; i++) {
    if ((tiles[i] === "walk" || tiles[i] === "path" || tiles[i] === "garden") && occupied[i] === -1) {
      walkSpots.push({ x: i % S, y: Math.floor(i / S), d: district[i] });
    }
  }
  rng.shuffle(walkSpots);
  let hydrants = 0;
  let racks = 0;
  let bins = 0;
  for (const s of walkSpots) {
    const dense = s.d === "downtown" || s.d === "industrial" || s.d === "oldtown";
    if (dense && hydrants < 10 && rng.chance(0.05)) {
      world.props.push({ kind: "hydrant", x: s.x, y: s.y, variant: 0 });
      hydrants++;
    } else if ((s.d === "university" || s.d === "oldtown" || s.d === "residential") && racks < 8 && rng.chance(0.06)) {
      world.props.push({ kind: "bikerack", x: s.x, y: s.y, variant: 0 });
      racks++;
    } else if (bins < 16 && rng.chance(0.04)) {
      world.props.push({ kind: "bin", x: s.x, y: s.y, variant: rng.int(0, 1) });
      bins++;
    }
  }

  for (const b of world.buildings) b.door = findDoor(world, b);

  for (let i = 0; i < S * S; i++) {
    const t = tiles[i];
    if ((t === "park" || t === "plaza" || t === "sand" || t === "path") && occupied[i] === -1 && district[i] !== "coast") {
      world.outdoorSpots.push({ x: i % S, y: Math.floor(i / S) });
    }
  }
  return world;
}

function buildCivic(world: World, rng: Rng, x0: number, y0: number) {
  for (let ly = 0; ly < 5; ly++) for (let lx = 0; lx < 5; lx++) world.tiles[idx(x0 + lx, y0 + ly)] = "plaza";
  addBuilding(world, rng, "cityhall", x0 + 1, y0, 3, 3, "downtown", "City Hall");
  addBuilding(world, rng, "police", x0, y0 + 3, 1, 2, "downtown", "Central Police Station");
  addBuilding(world, rng, "hospital", x0 + 4, y0 + 3, 1, 2, "downtown", "City General Hospital");
  world.props.push({ kind: "fountain", x: x0 + 2, y: y0 + 4, variant: 0 });
  world.plazaSpot = { x: x0 + 2, y: y0 + 3 };
  addTree(world, rng, x0, y0, -999, false);
  addTree(world, rng, x0 + 4, y0, -999, false);
}

function buildPark(world: World, rng: Rng, x0: number, y0: number, withPond: boolean) {
  for (let ly = 0; ly < 5; ly++) {
    for (let lx = 0; lx < 5; lx++) {
      const x = x0 + lx;
      const y = y0 + ly;
      const isPath = lx === 2 || ly === 2;
      world.tiles[idx(x, y)] = isPath ? "path" : "park";
      world.district[idx(x, y)] = "park";
    }
  }
  if (withPond) {
    for (const [lx, ly] of [
      [3, 0],
      [4, 0],
      [3, 1],
      [4, 1],
    ])
      world.tiles[idx(x0 + lx, y0 + ly)] = "pond";
  } else {
    world.props.push({ kind: "fountain", x: x0 + 2, y: y0 + 2, variant: 1 });
  }
  for (let ly = 0; ly < 5; ly++) {
    for (let lx = 0; lx < 5; lx++) {
      const t = world.tiles[idx(x0 + lx, y0 + ly)];
      if (t === "park" && rng.chance(0.45)) addTree(world, rng, x0 + lx, y0 + ly, -999, false);
    }
  }
  world.props.push({ kind: "bench", x: x0 + 1, y: y0 + 2, variant: 0 });
  world.props.push({ kind: "bench", x: x0 + 2, y: y0 + 3, variant: 1 });
}

function fillLot(world: World, rng: Rng, spec: LotSpec, x: number, y: number, d: DistrictId) {
  const set = (tx: number, ty: number, t: TileKind) => (world.tiles[idx(tx, ty)] = t);
  const cells = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ];
  switch (spec.t) {
    case "big":
      addBuilding(world, rng, spec.kind, x, y, 2, 2, d, spec.name);
      break;
    case "quad":
      spec.kinds.forEach((k, i) => {
        const [cx, cy] = cells[i];
        if (k) addBuilding(world, rng, k, x + cx, y + cy, 1, 1, d);
        else {
          set(x + cx, y + cy, "garden");
          addTree(world, rng, x + cx, y + cy, -999, false);
        }
      });
      break;
    case "pair":
      for (let i = 0; i < 4; i++) {
        const [cx, cy] = cells[i];
        if (i === 0 || i === 3) addBuilding(world, rng, "house", x + cx, y + cy, 1, 1, d);
        else {
          set(x + cx, y + cy, "garden");
          if (rng.chance(0.7)) addTree(world, rng, x + cx, y + cy, -999, false);
        }
      }
      break;
    case "empty":
      for (const [cx, cy] of cells) {
        set(x + cx, y + cy, "lot");
        world.lots.push({ x: x + cx, y: y + cy, district: d, used: false });
      }
      break;
    case "pocket":
      for (const [cx, cy] of cells) {
        set(x + cx, y + cy, "park");
        if (rng.chance(0.5)) addTree(world, rng, x + cx, y + cy, -999, false);
      }
      world.props.push({ kind: "bench", x: x + 1, y: y + 1, variant: 0 });
      break;
    case "yard":
      for (const [cx, cy] of cells) set(x + cx, y + cy, "yard");
      if (spec.market) {
        world.props.push({ kind: "stall", x: x, y: y + 1, variant: 0 });
        world.props.push({ kind: "stall", x: x + 1, y: y, variant: 1 });
      }
      break;
  }
  if (d === "residential" || d === "suburbs" || d === "university") {
    for (let ly = -1; ly <= 2; ly++) {
      for (let lx = -1; lx <= 2; lx++) {
        const tx = x + lx;
        const ty = y + ly;
        if (inBounds(tx, ty) && world.tiles[idx(tx, ty)] === "garden" && world.occupied[idx(tx, ty)] === -1 && rng.chance(0.25))
          addTree(world, rng, tx, ty, -999, false);
      }
    }
  }
}

export function addBuilding(
  world: World,
  rng: Rng,
  kind: BuildingKind,
  x: number,
  y: number,
  w: number,
  h: number,
  district: DistrictId,
  name = "",
  born = 0,
): Building {
  const [f0, f1] = FLOORS[kind];
  const base = BASE_COLORS[kind];
  const walls = WALLS[kind];
  const b: Building = {
    id: world.buildings.length,
    kind,
    district,
    x,
    y,
    w,
    h,
    floors: w === 1 && (kind === "apartment" || kind === "office") ? Math.min(3, f1) : rng.int(f0, f1),
    wall: walls ? rng.pick(walls) : base[0],
    roof: kind === "house" ? rng.pick(["#b5533c", "#7a4b3a", "#4d6d8f", "#8b5a2b", "#5f7a4a"]) : base[1],
    accent: base[2],
    name,
    businessId: null,
    door: { x, y: y + h },
    shared: false,
    closed: false,
    born,
    construction: 1,
    seed: rng.int(0, 1e6),
    level: district === "downtown" ? 3 : district === "suburbs" || district === "university" ? 2 : district === "industrial" ? 1 : 2,
    condition: 0.7 + rng.range(0, 0.25),
    levelStreak: 0,
  };
  world.buildings.push(b);
  for (let ty = y; ty < y + h; ty++) {
    for (let tx = x; tx < x + w; tx++) {
      world.occupied[idx(tx, ty)] = b.id;
      const ti = idx(tx, ty);
      if (world.treeAt.has(ti)) {
        world.treeAt.delete(ti);
        world.trees = world.trees.filter((t) => !(t.x === tx && t.y === ty));
      }
    }
  }
  return b;
}

export function findDoor(world: World, b: Building): { x: number; y: number } {
  let best = { x: b.x, y: b.y + b.h };
  let bestScore = -1;
  const consider = (x: number, y: number, front: boolean) => {
    if (!isWalkable(world, x, y)) return;
    const t = world.tiles[idx(x, y)];
    const score = (t === "road" ? 3 : t === "walk" || t === "plaza" || t === "path" ? 2 : 1) + (front ? 2 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = { x, y };
    }
  };
  for (let i = 0; i < b.w; i++) {
    consider(b.x + i, b.y + b.h, true);
    consider(b.x + i, b.y - 1, false);
  }
  for (let j = 0; j < b.h; j++) {
    consider(b.x + b.w, b.y + j, true);
    consider(b.x - 1, b.y + j, false);
  }
  return best;
}

export function addTree(world: World, rng: Rng, x: number, y: number, born: number, planted: boolean): boolean {
  const i = idx(x, y);
  if (world.treeAt.has(i) || world.occupied[i] !== -1) return false;
  world.treeAt.add(i);
  world.trees.push({
    x,
    y,
    born,
    planted,
    pine: rng.chance(world.district[i] === "suburbs" || world.district[i] === "park" ? 0.35 : 0.15),
    jx: rng.range(-0.18, 0.18),
    jy: rng.range(-0.18, 0.18),
  });
  return true;
}

const PLANTABLE: ReadonlySet<TileKind> = new Set<TileKind>(["grass", "garden", "park", "lot", "yard", "walk"]);

export function findPlantSpot(world: World, rng: Rng, cx: number, cy: number): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    const r = 2 + Math.floor(attempt / 6);
    const x = cx + rng.int(-r, r);
    const y = cy + rng.int(-r, r);
    if (!inBounds(x, y)) continue;
    const i = idx(x, y);
    const t = world.tiles[i];
    if (!PLANTABLE.has(t) || world.occupied[i] !== -1 || world.treeAt.has(i)) continue;
    if (t === "lot" && world.lots.some((l) => l.x === x && l.y === y && !l.used)) continue;
    return { x, y };
  }
  return null;
}

export function findPath(world: World, sx: number, sy: number, tx: number, ty: number): { x: number; y: number }[] | null {
  if (sx === tx && sy === ty) return [];
  const N = S;
  const prev = new Int32Array(N * N).fill(-1);
  const q = new Int32Array(N * N);
  const start = idx(sx, sy);
  const goal = idx(tx, ty);
  let head = 0;
  let tail = 0;
  q[tail++] = start;
  prev[start] = start;
  while (head < tail) {
    const cur = q[head++];
    if (cur === goal) break;
    const cx = cur % N;
    const cy = (cur - cx) / N;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const ni = ny * N + nx;
      if (prev[ni] !== -1) continue;
      if (ni !== goal && !isWalkable(world, nx, ny)) continue;
      prev[ni] = cur;
      q[tail++] = ni;
    }
  }
  if (prev[goal] === -1) return null;
  const out: { x: number; y: number }[] = [];
  let cur = goal;
  while (cur !== start) {
    out.push({ x: cur % N, y: Math.floor(cur / N) });
    cur = prev[cur];
  }
  return out.reverse();
}

export function placeOnLot(
  world: World,
  rng: Rng,
  kind: BuildingKind,
  name: string,
  prefer: DistrictId[],
  era: number,
): Building | null {
  const free = world.lots.filter((l) => !l.used);
  if (!free.length) return null;
  const preferred = free.filter((l) => prefer.includes(l.district));
  const lot = rng.pick(preferred.length ? preferred : free);
  lot.used = true;
  world.tiles[idx(lot.x, lot.y)] = "walk";
  const b = addBuilding(world, rng, kind, lot.x, lot.y, 1, 1, lot.district, name, era);
  b.door = findDoor(world, b);
  world.groundVersion++;
  return b;
}

export function placeInPark(world: World, rng: Rng, kind: BuildingKind, name: string, era: number): Building | null {
  const spots = world.outdoorSpots.filter((s) => {
    const i = idx(s.x, s.y);
    return world.tiles[i] === "park" && world.occupied[i] === -1 && !world.treeAt.has(i);
  });
  if (!spots.length) return null;
  const s = rng.pick(spots);
  const b = addBuilding(world, rng, kind, s.x, s.y, 1, 1, "park", name, era);
  b.door = findDoor(world, b);
  world.outdoorSpots = world.outdoorSpots.filter((o) => !(o.x === s.x && o.y === s.y));
  world.groundVersion++;
  return b;
}

export function bridgeTiles(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let x = LAST_ROAD + 1; x < ISLAND_X0; x++) out.push({ x, y: BRIDGE_Y });
  return out;
}

export function findBigLot(world: World, prefer: DistrictId[]): { x: number; y: number; district: DistrictId } | null {
  const free = new Set(world.lots.filter((l) => !l.used).map((l) => idx(l.x, l.y)));
  const candidates = world.lots.filter(
    (l) => !l.used && free.has(idx(l.x + 1, l.y)) && free.has(idx(l.x, l.y + 1)) && free.has(idx(l.x + 1, l.y + 1)),
  );
  if (!candidates.length) return null;
  const preferred = candidates.filter((c) => prefer.includes(c.district));
  const pick = (preferred.length ? preferred : candidates)[0];
  return { x: pick.x, y: pick.y, district: pick.district };
}

export function claimBigLot(world: World, x: number, y: number) {
  for (const l of world.lots) if (l.x >= x && l.x <= x + 1 && l.y >= y && l.y <= y + 1) l.used = true;
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) world.tiles[idx(x + dx, y + dy)] = "walk";
}

export function buildIsland(world: World, rng: Rng, era: number): Building[] {
  const built: Building[] = [];
  const set = (x: number, y: number, t: TileKind) => (world.tiles[idx(x, y)] = t);
  for (const t of bridgeTiles()) set(t.x, t.y, "bridge");
  for (let y = ISLAND_Y0; y <= ISLAND_Y1; y++) {
    for (let x = ISLAND_X0; x <= ISLAND_X1; x++) {
      const i = idx(x, y);
      if (world.treeAt.has(i)) {
        world.treeAt.delete(i);
      }
      set(x, y, "garden");
    }
  }
  world.trees = world.trees.filter((t) => world.treeAt.has(idx(t.x, t.y)));
  for (let y = ISLAND_Y0; y <= ISLAND_Y1; y++) set(ISLAND_X0, y, "road");
  const rows: number[] = [];
  for (let y = ISLAND_Y0; y <= ISLAND_Y1; y += 6) {
    rows.push(y);
    for (let x = ISLAND_X0; x <= ISLAND_X1; x++) set(x, y, "road");
  }
  const hotels = ["Seaview Hotel", "Harborview Suites", "The Lighthouse Inn", "Coral Bay Hotel", "Driftwood Lodge"];
  let hi = 0;
  for (const r of rows) {
    const y0 = r + 1;
    if (y0 + 3 > ISLAND_Y1) break;
    const b1 = addBuilding(world, rng, "apartment", ISLAND_X0 + 1, y0, 2, 2, "coast", hotels[hi++ % hotels.length], era);
    b1.wall = rng.pick(["#f3e6cf", "#e9f1f4", "#f6dcc8"]);
    const kinds: BuildingKind[] = ["cafe", "restaurant", "shop", "house"];
    rng.shuffle(kinds);
    const quad = [
      [ISLAND_X0 + 4, y0],
      [ISLAND_X0 + 5, y0],
      [ISLAND_X0 + 4, y0 + 1],
      [ISLAND_X0 + 5, y0 + 1],
    ];
    quad.forEach(([x, y], k) => built.push(addBuilding(world, rng, kinds[k], x, y, 1, 1, "coast", "", era)));
    built.push(b1);
    if (y0 + 4 <= ISLAND_Y1) {
      built.push(addBuilding(world, rng, "house", ISLAND_X0 + 1, y0 + 3, 1, 1, "coast", "", era));
      built.push(addBuilding(world, rng, "house", ISLAND_X0 + 4, y0 + 3, 1, 1, "coast", "", era));
    }
    for (let y = y0; y < Math.min(r + 6, ISLAND_Y1 + 1); y++)
      for (const x of [ISLAND_X1 - 1, ISLAND_X1]) {
        set(x, y, "park");
        if (rng.chance(0.3)) addTree(world, rng, x, y, era * 24, true);
      }
    world.props.push({ kind: "bench", x: ISLAND_X1, y: y0 + 1, variant: 1 });
  }
  for (const b of built) b.door = findDoor(world, b);
  for (let i = 0; i < world.tiles.length; i++) {
    const t = world.tiles[i];
    if (world.district[i] === "coast" && (t === "park" || t === "sand") && world.occupied[i] === -1)
      world.outdoorSpots.push({ x: i % S, y: Math.floor(i / S) });
  }
  world.flags.add("bridge");
  world.groundVersion++;
  return built;
}

/** Kept for compatibility with old saves/ground rendering; no longer used to lay track. */
export const RAIL_Y = 0;

/**
 * The Metro Loop is an elevated line that circles the whole city along the
 * outer ring road, closed back on itself. It doesn't touch ground tiles —
 * it's drawn above them — so it needs no pathfinding or tile mutation.
 */
export function metroLoopPoints(): { x: number; y: number }[] {
  const a = ROADS[0];
  const b = ROADS[BLOCKS];
  return [
    { x: a, y: a },
    { x: b, y: a },
    { x: b, y: b },
    { x: a, y: b },
    { x: a, y: a },
  ];
}

/**
 * Once the Harbor Bridge exists the loop grows a branch out to Harborview,
 * leaving the ring at the point nearest the bridge; once the airport exists
 * that branch extends further to the terminal. Both are computed fresh from
 * world flags, so nothing needs to be stored or migrated on old saves.
 */
export function metroBranchPoints(world: World): { x: number; y: number }[] {
  if (!world.flags.has("bridge")) return [];
  const harbor = { x: ISLAND_X0 + 3, y: Math.round((ISLAND_Y0 + ISLAND_Y1) / 2) };
  const out = [{ x: ROADS[BLOCKS], y: BRIDGE_Y }, { x: ISLAND_X0, y: BRIDGE_Y }, harbor];
  if (world.flags.has("airport")) out.push({ x: ISLAND_X0 + 2, y: 6 }, { x: ISLAND_X0 + 2, y: 4 });
  return out;
}

const RING_STATION_OFFSETS = [ROADS[1], ROADS[5]];

/** Station stops around the ring, sampled one tile in from the edge for their district. */
export function metroStationSpots(world: World): { x: number; y: number; d: DistrictId }[] {
  const a = ROADS[0];
  const b = ROADS[BLOCKS];
  const out: { x: number; y: number; d: DistrictId }[] = [];
  for (const x of RING_STATION_OFFSETS) {
    out.push({ x, y: a, d: world.district[idx(x, a + 1)] });
    out.push({ x, y: b, d: world.district[idx(x, b - 1)] });
  }
  for (const y of RING_STATION_OFFSETS) {
    out.push({ x: a, y, d: world.district[idx(a + 1, y)] });
    out.push({ x: b, y, d: world.district[idx(b - 1, y)] });
  }
  if (world.flags.has("bridge")) out.push({ x: ISLAND_X0 + 3, y: Math.round((ISLAND_Y0 + ISLAND_Y1) / 2), d: "coast" });
  return out;
}

export function layRail(world: World, stations: DistrictId[]): { x: number; d: DistrictId }[] {
  const spots = metroStationSpots(world).filter((s) => s.d !== "coast");
  const out: { x: number; d: DistrictId }[] = [];
  for (const s of spots) {
    if (stations.length && !stations.includes(s.d)) continue;
    world.props.push({ kind: "platform", x: s.x, y: s.y, variant: out.length });
    out.push({ x: s.x, d: s.d });
  }
  world.flags.add("rail");
  world.groundVersion++;
  return out;
}

export function placeMetro(world: World, rng: Rng, districts: DistrictId[]): DistrictId[] {
  const done: DistrictId[] = [];
  for (const d of districts) {
    const spots: { x: number; y: number }[] = [];
    for (let i = 0; i < world.tiles.length; i++)
      if ((world.tiles[i] === "walk" || world.tiles[i] === "plaza" || world.tiles[i] === "garden") && world.district[i] === d && world.occupied[i] === -1)
        spots.push({ x: i % S, y: Math.floor(i / S) });
    if (!spots.length) continue;
    const s = rng.pick(spots);
    world.props.push({ kind: "metro", x: s.x, y: s.y, variant: done.length });
    done.push(d);
  }
  world.flags.add("metro");
  return done;
}

export function expandPort(world: World, rng: Rng) {
  let placed = 0;
  for (let i = 0; i < world.tiles.length && placed < 10; i++) {
    const x = i % S;
    const y = Math.floor(i / S);
    if (world.district[i] !== "industrial" || world.occupied[i] !== -1) continue;
    if ((world.tiles[i] === "yard" || world.tiles[i] === "lot" || world.tiles[i] === "walk") && y > MAIN - 14 && rng.chance(0.5)) {
      world.props.push({ kind: "containers", x, y, variant: rng.int(0, 3) });
      placed++;
    }
  }
  world.props.push({ kind: "crane", x: MAIN - 17, y: MAIN - 3, variant: 0 });
  world.flags.add("port");
  world.groundVersion++;
}

export function buildShipyard(world: World) {
  world.props.push({ kind: "shipyard", x: MAIN - 22, y: MAIN - 1, variant: 0 });
  world.flags.add("shipyard");
}

export function buildAirport(world: World, rng: Rng, era: number): Building {
  for (let y = 1; y <= 5; y++)
    for (let x = ISLAND_X0 - 1; x <= ISLAND_X1 + 1; x++) {
      const i = idx(x, y);
      world.district[i] = "coast";
      world.tiles[i] = y === 1 ? "sand" : y === 2 ? "runway" : y === 3 ? "road" : "plaza";
    }
  for (let y = 3; y <= ISLAND_Y0 - 1; y++) world.tiles[idx(ISLAND_X0, y)] = "road";
  const t = addBuilding(world, rng, "terminal", ISLAND_X0 + 2, 4, 3, 2, "coast", "Harbor International", era);
  t.door = findDoor(world, t);
  world.props.push({ kind: "tower", x: ISLAND_X1, y: 4, variant: 0 });
  world.flags.add("airport");
  world.groundVersion++;
  return t;
}
