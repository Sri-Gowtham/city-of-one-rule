import { Sim } from "./engine";
import { Rng } from "./rng";
import { fxOf } from "./rules";

const KEY = "cor-save-v1";

function replacer(this: unknown, key: string, value: unknown): unknown {
  if (key === "listeners") return undefined;
  if (value instanceof Set) return { __set: [...value] };
  if (value instanceof Map) return { __map: [...value] };
  if (value instanceof Rng) return { __rng: (value as unknown as { s: number }).s };
  if (typeof value === "number" && !Number.isFinite(value)) return { __num: String(value) };
  return value;
}

function reviver(_key: string, value: unknown): unknown {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    if ("__set" in v) return new Set(v.__set as unknown[]);
    if ("__map" in v) return new Map(v.__map as [unknown, unknown][]);
    if ("__rng" in v) {
      const r = new Rng(1);
      (r as unknown as { s: number }).s = v.__rng as number;
      return r;
    }
    if ("__num" in v) return Number(v.__num);
  }
  return value;
}

export interface SaveInfo {
  era: number;
  endless: boolean;
  totalEras: number;
  population: number;
  savedAt: number;
}

export function saveGame(sim: Sim) {
  if (sim.ambient || (sim.phase !== "choosing" && sim.phase !== "report")) return;
  try {
    const info: SaveInfo = {
      era: sim.era,
      endless: sim.endless,
      totalEras: Number.isFinite(sim.totalEras) ? sim.totalEras : -1,
      population: sim.daySamples[sim.daySamples.length - 1]?.population ?? 0,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify({ info, sim }, replacer));
  } catch {
    /* storage full or unavailable: the game keeps running unsaved */
  }
}

export function savedInfo(): SaveInfo | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { info: SaveInfo }).info;
  } catch {
    return null;
  }
}

export function loadGame(): Sim | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { sim } = JSON.parse(raw, reviver) as { sim: Record<string, unknown> };
    const restored = Object.assign(Object.create(Sim.prototype), sim) as Sim;
    (restored as unknown as { listeners: Set<() => void> }).listeners = new Set();
    // Fields added after the first save format.
    restored.deck ??= [];
    restored.recentOffers ??= [];
    restored.fx ??= fxOf(restored.activeRule);
    return restored;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
