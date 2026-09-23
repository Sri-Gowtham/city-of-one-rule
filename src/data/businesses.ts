import type { BusinessDef } from "../engine/types";

export const businesses: BusinessDef[] = [
  { id: "city-mart", name: "City Mart", type: "Grocery", tags: ["economy"] },
  { id: "city-cafe", name: "City Cafe", type: "Cafe", tags: ["community", "economy"] },
  { id: "city-restaurant", name: "City Restaurant", type: "Restaurant", tags: ["community", "economy"] },
  { id: "downtown-bank", name: "Downtown Bank", type: "Bank", tags: ["economy", "trust"] },
  { id: "riverside-factory", name: "Riverside Factory", type: "Factory", tags: ["labor", "environment"] },
  { id: "green-nursery", name: "Green Nursery", type: "Local Shop", tags: ["environment"] },
  { id: "startup-loft", name: "Startup Loft", type: "Technology Company", tags: ["innovation", "digital"] },
  { id: "town-hardware", name: "Town Hardware", type: "Local Shop", tags: ["economy", "labor"] },
];
