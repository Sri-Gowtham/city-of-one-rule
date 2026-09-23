import type { Sim } from "../sim/engine";
import type { Citizen, CultureKey, MetricKey } from "../sim/types";

export const METRIC_META: Record<MetricKey, { icon: string; label: string; color: string }> = {
  happiness: { icon: "😊", label: "Happiness", color: "#f2c14e" },
  trust: { icon: "🤝", label: "Trust", color: "#5aa9e6" },
  economy: { icon: "💰", label: "Economy", color: "#7bc67b" },
  equality: { icon: "⚖️", label: "Equality", color: "#b388eb" },
  safety: { icon: "🛡️", label: "Safety", color: "#ef8354" },
  environment: { icon: "🌳", label: "Environment", color: "#3fbf7f" },
};

export const CULTURE_LABEL: Record<CultureKey, string> = {
  honesty: "Honesty",
  generosity: "Generosity",
  community: "Community",
  environment: "Green values",
  reputation: "Reputation",
  leisure: "Leisure",
  learning: "Learning",
  equality: "Equality",
  participation: "Participation",
  localism: "Localism",
};

export function cultureWord(v: number): { word: string; level: number } {
  if (v < 36) return { word: "Weak", level: 1 };
  if (v < 48) return { word: "Modest", level: 2 };
  if (v < 58) return { word: "Growing", level: 3 };
  if (v < 70) return { word: "Strong", level: 4 };
  return { word: "Defining", level: 5 };
}

export function clock(hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour - Math.floor(hour)) * 60);
  return `${String(h).padStart(2, "0")}:${String(m - (m % 10)).padStart(2, "0")}`;
}

export function moodFace(m: number): string {
  if (m >= 75) return "😄";
  if (m >= 60) return "🙂";
  if (m >= 45) return "😐";
  if (m >= 30) return "😟";
  return "😠";
}

export function describeActivity(sim: Sim, c: Citizen): string {
  const bname = (id: number) => {
    const b = sim.world.buildings[id];
    return b.name || (b.kind === "house" || b.kind === "apartment" ? "home" : `the ${b.kind}`);
  };
  if (c.activity === "protest") return c.path.length ? "Marching to City Hall to protest" : "Protesting at City Hall";
  if (c.path.length && c.dest) {
    if (c.dest.kind === "building") {
      if (c.dest.id === c.homeId) return "Walking home";
      if (c.dest.id === c.workId) return `Commuting to ${bname(c.dest.id)}`;
      return `Walking to ${bname(c.dest.id)}`;
    }
    const purpose = c.dest.purpose;
    if (purpose === "plant") return "Heading out to plant a tree";
    if (purpose === "plaza") return "Heading to the City Hall plaza";
    return "Heading outdoors";
  }
  if (c.inside !== null) {
    if (c.inside === c.homeId) return c.activity === "home" && sim.hour >= c.bedtime ? "Asleep at home" : "At home";
    if (c.inside === c.workId) return `Working at ${bname(c.inside)}`;
    const b = sim.world.buildings[c.inside];
    if (c.activity === "learn") return `Taking a class at ${bname(b.id)}`;
    if (b.kind === "community") return "At the community center";
    return `At ${bname(b.id)}`;
  }
  if (c.loc?.kind === "tile") {
    if (c.loc.purpose === "plaza") return "Hanging out on the plaza";
    if (c.loc.purpose === "plant") return "Planting a tree";
    return "Spending time outdoors";
  }
  return "Out and about";
}
