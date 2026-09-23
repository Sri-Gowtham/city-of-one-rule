import type { World } from "../sim/types";
import { S, idx } from "../sim/world";
import { TH, TW, hash, iso, line, poly } from "./draw";
import type { Pt } from "./draw";

const FIXED: Record<string, string> = {
  road: "#5b616d",
  walk: "#cdc4b3",
  plaza: "#ddd2bd",
  sand: "#e6d3a3",
  water: "#3d82b0",
  pond: "#4f9fc8",
  path: "#d6c297",
  lot: "#b39873",
  yard: "#a6a29a",
};

function grassColor(env: number, district: string, n: number, kind: string): string {
  let h = 72 + env * 0.33;
  let s = 30 + env * 0.25;
  let l = 40 + n * 5;
  if (district === "industrial") {
    h -= 14;
    s -= 12;
  } else if (district === "downtown") s -= 8;
  else if (district === "suburbs") s += 4;
  if (kind === "park") {
    h += 6;
    l += 1;
  } else if (kind === "garden") {
    h += 3;
    l += 4;
  }
  return `hsl(${h.toFixed(0)},${Math.max(10, s).toFixed(0)}%,${l.toFixed(0)}%)`;
}

export function renderGround(world: World, env: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = S * TW;
  canvas.height = S * TH + TH;
  const ctx = canvas.getContext("2d")!;
  ctx.translate((S * TW) / 2, 0);

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = idx(x, y);
      const t = world.tiles[i];
      const n = hash(x, y);
      const pts: Pt[] = [iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)];
      const color = FIXED[t] ?? grassColor(env, world.district[i], n, t);
      poly(ctx, pts, color, "rgba(0,0,0,0.06)", 0.6);
      decorate(ctx, world, x, y, t, n);
    }
  }

  return canvas;
}

function decorate(ctx: CanvasRenderingContext2D, world: World, x: number, y: number, t: string, n: number) {
  const tileAt = (tx: number, ty: number) => (tx >= 0 && ty >= 0 && tx < S && ty < S ? world.tiles[idx(tx, ty)] : "water");
  if (t === "road") {
    const alongX = tileAt(x - 1, y) === "road" && tileAt(x + 1, y) === "road";
    const alongY = tileAt(x, y - 1) === "road" && tileAt(x, y + 1) === "road";
    ctx.setLineDash([6, 6]);
    if (alongX && !alongY) line(ctx, iso(x + 0.1, y + 0.5), iso(x + 0.9, y + 0.5), "rgba(245,240,220,0.7)", 1.5);
    if (alongY && !alongX) line(ctx, iso(x + 0.5, y + 0.1), iso(x + 0.5, y + 0.9), "rgba(245,240,220,0.7)", 1.5);
    ctx.setLineDash([]);
    const curb = "#9aa0a8";
    if (tileAt(x, y - 1) !== "road") line(ctx, iso(x, y), iso(x + 1, y), curb, 2);
    if (tileAt(x, y + 1) !== "road") line(ctx, iso(x, y + 1), iso(x + 1, y + 1), curb, 2);
    if (tileAt(x - 1, y) !== "road") line(ctx, iso(x, y), iso(x, y + 1), curb, 2);
    if (tileAt(x + 1, y) !== "road") line(ctx, iso(x + 1, y), iso(x + 1, y + 1), curb, 2);
    if (alongX && alongY) {
      for (let k = 0; k < 4; k++) {
        const u = 0.2 + k * 0.2;
        line(ctx, iso(x + u, y + 0.05), iso(x + u, y + 0.2), "rgba(240,240,240,0.55)", 2);
        line(ctx, iso(x + u, y + 0.8), iso(x + u, y + 0.95), "rgba(240,240,240,0.55)", 2);
      }
    }
  } else if (t === "water" || t === "pond") {
    for (let k = 0; k < 2; k++) {
      const u = hash(x, y, k);
      const v = hash(y, x, k + 3);
      const a = iso(x + u * 0.7, y + v);
      line(ctx, a, [a[0] + 10, a[1]], "rgba(255,255,255,0.22)", 1.2);
    }
  } else if (t === "plaza" || t === "walk") {
    poly(ctx, [iso(x + 0.5, y + 0.1), iso(x + 0.9, y + 0.5), iso(x + 0.5, y + 0.9), iso(x + 0.1, y + 0.5)], undefined, "rgba(0,0,0,0.06)");
  } else if (t === "lot") {
    for (let k = 0; k < 6; k++) {
      const p = iso(x + hash(x, y, k), y + hash(y, x, k));
      ctx.fillStyle = "rgba(90,70,40,0.35)";
      ctx.fillRect(p[0], p[1], 2, 1.5);
    }
  } else if (t === "garden" && n > 0.35) {
    const colors = ["#f2c14e", "#e86a92", "#ffffff", "#b388eb"];
    for (let k = 0; k < 4; k++) {
      const p = iso(x + 0.15 + hash(x, y, k) * 0.7, y + 0.15 + hash(y, x, k) * 0.7);
      ctx.fillStyle = colors[(k + Math.floor(n * 10)) % colors.length];
      ctx.fillRect(p[0], p[1], 2, 2);
    }
  } else if (t === "sand") {
    const nearWater = tileAt(x + 1, y) === "water" || tileAt(x, y + 1) === "water";
    if (nearWater) {
      if (tileAt(x, y + 1) === "water") line(ctx, iso(x, y + 0.9), iso(x + 1, y + 0.9), "#8a6a45", 2);
      if (tileAt(x + 1, y) === "water") line(ctx, iso(x + 0.9, y), iso(x + 0.9, y + 1), "#8a6a45", 2);
    }
  }
}
