export type District =
  | "downtown"
  | "residential"
  | "industrial"
  | "old-town"
  | "university"
  | "suburbs";

export interface BuildingDef {
  id: string;
  name: string;
  sprite: string;
  district: District;
  col: number;
  row: number;
}

const asset = (file: string) => `/assets/buildings/${file}`;

export const districtLayout: Record<District, { label: string; left: number; top: number; width: number }> = {
  downtown: { label: "Downtown", left: 20, top: 20, width: 460 },
  "old-town": { label: "Old Town", left: 20, top: 300, width: 460 },
  residential: { label: "Residential", left: 520, top: 20, width: 460 },
  university: { label: "University District", left: 520, top: 300, width: 460 },
  industrial: { label: "Industrial", left: 1020, top: 20, width: 460 },
  suburbs: { label: "Suburbs", left: 1020, top: 300, width: 460 },
};

export const buildings: BuildingDef[] = [
  { id: "city-hall", name: "City Hall", sprite: asset("01_City_Hall.png"), district: "downtown", col: 0, row: 0 },
  { id: "police-station", name: "Police Station", sprite: asset("03_Police_Station.png"), district: "downtown", col: 1, row: 0 },
  { id: "court", name: "Court", sprite: asset("07_Court_Justice.png"), district: "downtown", col: 2, row: 0 },
  { id: "office-building", name: "Office Building", sprite: asset("09_Office_Building.png"), district: "downtown", col: 1, row: 1 },

  { id: "city-mart", name: "City Mart", sprite: asset("10_Local_Shop_City_Mart.png"), district: "old-town", col: 0, row: 0 },
  { id: "cafe", name: "Cafe", sprite: asset("11_Cafe.png"), district: "old-town", col: 1, row: 0 },
  { id: "restaurant", name: "Restaurant", sprite: asset("12_Restaurant.png"), district: "old-town", col: 2, row: 0 },
  { id: "community-center", name: "Community Center", sprite: asset("08_Community_Center.png"), district: "old-town", col: 1, row: 1 },

  { id: "hospital", name: "Hospital", sprite: asset("02_Hospital.png"), district: "residential", col: 0, row: 0 },
  { id: "school", name: "School", sprite: asset("04_School.png"), district: "residential", col: 1, row: 0 },
  { id: "fire-station", name: "Fire Station", sprite: asset("06_Fire_Station.png"), district: "residential", col: 2, row: 0 },

  { id: "library", name: "Library", sprite: asset("05_Library.png"), district: "university", col: 0, row: 0 },
];
