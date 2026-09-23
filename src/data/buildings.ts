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
  gridX: number;
  gridY: number;
}

const asset = (file: string) => `/assets/buildings/${file}`;

export const buildings: BuildingDef[] = [
  { id: "city-hall", name: "City Hall", sprite: asset("01_City_Hall.png"), district: "downtown", gridX: 4, gridY: 2 },
  { id: "hospital", name: "Hospital", sprite: asset("02_Hospital.png"), district: "residential", gridX: 1, gridY: 1 },
  { id: "police-station", name: "Police Station", sprite: asset("03_Police_Station.png"), district: "downtown", gridX: 5, gridY: 1 },
  { id: "school", name: "School", sprite: asset("04_School.png"), district: "residential", gridX: 1, gridY: 2 },
  { id: "library", name: "Library", sprite: asset("05_Library.png"), district: "university", gridX: 6, gridY: 2 },
  { id: "fire-station", name: "Fire Station", sprite: asset("06_Fire_Station.png"), district: "downtown", gridX: 5, gridY: 3 },
  { id: "court", name: "Court", sprite: asset("07_Court_Justice.png"), district: "downtown", gridX: 4, gridY: 0 },
  { id: "community-center", name: "Community Center", sprite: asset("08_Community_Center.png"), district: "old-town", gridX: 2, gridY: 3 },
  { id: "office-building", name: "Office Building", sprite: asset("09_Office_Building.png"), district: "downtown", gridX: 6, gridY: 0 },
  { id: "city-mart", name: "City Mart", sprite: asset("10_Local_Shop_City_Mart.png"), district: "old-town", gridX: 2, gridY: 2 },
  { id: "cafe", name: "Cafe", sprite: asset("11_Cafe.png"), district: "old-town", gridX: 3, gridY: 3 },
  { id: "restaurant", name: "Restaurant", sprite: asset("12_Restaurant.png"), district: "old-town", gridX: 3, gridY: 4 },
];
