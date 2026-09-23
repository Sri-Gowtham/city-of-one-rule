import type { Rng } from "./rng";
import type { BizType, Building, BuildingKind, Business, World } from "./types";

const TYPE: Partial<Record<BuildingKind, BizType>> = {
  shop: "Local Shop",
  mall: "Local Shop",
  cafe: "Cafe",
  restaurant: "Restaurant",
  grocery: "Grocery",
  bank: "Bank",
  media: "Media",
  techco: "Technology",
  cinema: "Entertainment",
  factory: "Factory",
  warehouse: "Logistics",
  boutique: "Boutique",
  repair: "Repair",
  kiosk: "Kiosk",
  workshop: "Workshop",
};

const PRICE: Partial<Record<BizType, number>> = {
  Cafe: 2,
  Restaurant: 4,
  Grocery: 3,
  "Local Shop": 3,
  Entertainment: 4,
  Boutique: 9,
  Repair: 3,
  Kiosk: 1.5,
  Workshop: 3,
};

const CONSUMER: ReadonlySet<BizType> = new Set<BizType>([
  "Cafe",
  "Restaurant",
  "Grocery",
  "Local Shop",
  "Entertainment",
  "Boutique",
  "Repair",
  "Kiosk",
  "Workshop",
]);

const NAMES: Partial<Record<BizType, string[]>> = {
  Factory: ["Copperline Works", "Bayside Canning", "Keystone Metals", "Orchard Bottling"],
  Technology: ["Pixel Harbor", "Quanta Labs"],
  Entertainment: ["Lantern Theater"],
  Cafe: ["Corner Café", "Bean & Bloom", "The Daily Grind", "Tea Lantern", "Moonlight Espresso", "Crumb & Cup", "Steam Street"],
  Restaurant: ["Riverside Kitchen", "Lotus Diner", "Nonna's Table", "Spice Route", "The Copper Pot"],
  "Local Shop": [
    "Page & Quill Books",
    "Hendrix Hardware",
    "Rosa's Bakery",
    "Tailor Lane",
    "Green Thumb Garden",
    "Vinyl Attic",
    "Pip's Toys",
    "Harbor Bikes",
    "Stitch & Thread",
    "Lumen Lamps",
    "The Spice Jar",
    "Paper Crane Stationery",
    "Old Anchor Antiques",
    "Fresh Fields Produce",
  ],
};

const PREFIX = ["Maple", "Harbor", "Juniper", "Sunny", "Old Mill", "Blue Door", "Willow", "Copper", "Birch", "Saffron", "Cobalt", "Ivy", "Marigold", "Northstar", "Pebble"];

const CHAINS = new Set(["City Mart", "Crestline Bank", "Starlight Cinema", "Northgate Mall"]);

export function makeBusiness(id: number, b: Building, name: string, founded: number): Business {
  const type = TYPE[b.kind]!;
  return {
    id,
    name,
    type,
    buildingId: b.id,
    chain: CHAINS.has(name),
    consumer: CONSUMER.has(type),
    price: PRICE[type] ?? 0,
    demand: 100,
    revenue: 0,
    satisfaction: 60,
    cost: 0,
    reputation: 55,
    visitsToday: 0,
    barterToday: 0,
    revenueToday: 0,
    productionToday: 0,
    womToday: 0,
    baseVisits: 1,
    baseProduction: 1,
    lowStreak: 0,
    automated: false,
    open: true,
    founded,
    strategies: [],
    history: [],
  };
}

export function generateBusinesses(rng: Rng, world: World): Business[] {
  const out: Business[] = [];
  const used = new Set<string>();
  let warehouseNamed = false;
  for (const b of world.buildings) {
    const type = TYPE[b.kind];
    if (!type) continue;
    if (b.kind === "warehouse") {
      if (warehouseNamed || !b.name) continue;
      warehouseNamed = true;
    }
    let name = b.name;
    if (!name) {
      const pool = (NAMES[type] ?? []).filter((n) => !used.has(n));
      if (pool.length) name = rng.pick(pool);
      else {
        const suffix: Partial<Record<BizType, string>> = { Cafe: "Café", Restaurant: "Kitchen", "Local Shop": "Goods", Factory: "Works", Technology: "Labs", Entertainment: "Hall" };
        let tries = 0;
        do name = `${rng.pick(PREFIX)} ${suffix[type] ?? type}`;
        while (used.has(name) && ++tries < 30);
      }
    }
    used.add(name);
    b.name = name;
    const biz = makeBusiness(out.length, b, name, 0);
    biz.reputation = rng.range(45, 65);
    b.businessId = biz.id;
    out.push(biz);
  }
  return out;
}
