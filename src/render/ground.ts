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
  bridge: "#6f747e",
  rail: "#8a8176",
  runway: "#4a4e56",
  pier: "#a9835a",
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
      // Crosswalk zebra stripes across the intersection, in the other direction.
      for (let k = 0; k < 4; k++) {
        const v = 0.2 + k * 0.2;
        line(ctx, iso(x + 0.05, y + v), iso(x + 0.2, y + v), "rgba(240,240,240,0.5)", 2);
        line(ctx, iso(x + 0.8, y + v), iso(x + 0.95, y + v), "rgba(240,240,240,0.5)", 2);
      }
    }
  } else if (t === "bridge") {
    line(ctx, iso(x, y + 0.08), iso(x + 1, y + 0.08), "#c9ccd2", 2.5);
    line(ctx, iso(x, y + 0.92), iso(x + 1, y + 0.92), "#c9ccd2", 2.5);
    ctx.setLineDash([6, 6]);
    line(ctx, iso(x + 0.1, y + 0.5), iso(x + 0.9, y + 0.5), "rgba(245,240,220,0.7)", 1.5);
    ctx.setLineDash([]);
  } else if (t === "rail") {
    for (let k = 0; k < 5; k++) {
      const u = 0.1 + k * 0.2;
      line(ctx, iso(x + u, y + 0.2), iso(x + u, y + 0.8), "#5b4636", 2);
    }
    line(ctx, iso(x, y + 0.32), iso(x + 1, y + 0.32), "#c9ccd2", 1.4);
    line(ctx, iso(x, y + 0.68), iso(x + 1, y + 0.68), "#c9ccd2", 1.4);
  } else if (t === "pier") {
    // Wooden deck boards running along the pier, with posts at the corners.
    for (let k = 1; k < 5; k++) line(ctx, iso(x, y + k * 0.2), iso(x + 1, y + k * 0.2), "rgba(70,45,25,0.35)", 0.8);
    line(ctx, iso(x, y), iso(x, y + 1), "#6b4a2f", 1.6);
    line(ctx, iso(x + 1, y), iso(x + 1, y + 1), "#6b4a2f", 1.6);
  } else if (t === "runway") {
    ctx.setLineDash([10, 8]);
    line(ctx, iso(x, y + 0.5), iso(x + 1, y + 0.5), "rgba(255,255,255,0.85)", 2);
    ctx.setLineDash([]);
    line(ctx, iso(x, y + 0.06), iso(x + 1, y + 0.06), "rgba(255,255,255,0.6)", 1);
    line(ctx, iso(x, y + 0.94), iso(x + 1, y + 0.94), "rgba(255,255,255,0.6)", 1);
  } else if (t === "water" || t === "pond") {
    for (let k = 0; k < 2; k++) {
      const u = hash(x, y, k);
      const v = hash(y, x, k + 3);
      const a = iso(x + u * 0.7, y + v);
      line(ctx, a, [a[0] + 10, a[1]], "rgba(255,255,255,0.22)", 1.2);
    }
  } else if (t === "plaza" || t === "walk") {
    poly(ctx, [iso(x + 0.5, y + 0.1), iso(x + 0.9, y + 0.5), iso(x + 0.5, y + 0.9), iso(x + 0.1, y + 0.5)], undefined, "rgba(0,0,0,0.06)");
    // Sidewalk texture: a faint 2x2 paving grid.
    line(ctx, iso(x + 0.5, y), iso(x + 0.5, y + 1), "rgba(0,0,0,0.045)", 0.5);
    line(ctx, iso(x, y + 0.5), iso(x + 1, y + 0.5), "rgba(0,0,0,0.045)", 0.5);
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
  } else if (t === "park") {
    // Small baked undergrowth trees, clustered by tile hash. Purely a ground texture,
    // separate from the simulated Tree entities drawn as sprites above the ground layer.
    const count = n > 0.72 ? 2 : n > 0.4 ? 1 : 0;
    for (let k = 0; k < count; k++) {
      const tx = x + 0.2 + hash(x, y, k, 21) * 0.6;
      const ty = y + 0.2 + hash(y, x, k, 22) * 0.6;
      const ts = 0.55 + hash(x, y, k, 23) * 0.4;
      const p = iso(tx, ty);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(p[0] + 1, p[1], 4 * ts, 1.8 * ts, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5c4028";
      ctx.fillRect(p[0] - 0.6 * ts, p[1] - 4 * ts, 1.2 * ts, 4 * ts);
      const pine = hash(x, y, k, 24) > 0.5;
      if (pine) {
        for (let j = 0; j < 3; j++) {
          const yb = p[1] - 3 * ts - j * 2.6 * ts;
          const wd = (4.4 - j * 1.1) * ts;
          ctx.fillStyle = j % 2 ? "#4f7d43" : "#3f6a38";
          ctx.beginPath();
          ctx.moveTo(p[0] - wd, yb);
          ctx.lineTo(p[0] + wd, yb);
          ctx.lineTo(p[0], yb - 4.4 * ts);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#4f7d43";
        ctx.beginPath();
        ctx.arc(p[0], p[1] - 7 * ts, 3.6 * ts, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5f9350";
        ctx.beginPath();
        ctx.arc(p[0] - 1.4 * ts, p[1] - 8.4 * ts, 2.2 * ts, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (t === "sand") {
    const nearWater = tileAt(x + 1, y) === "water" || tileAt(x, y + 1) === "water";
    if (nearWater) {
      if (tileAt(x, y + 1) === "water") line(ctx, iso(x, y + 0.9), iso(x + 1, y + 0.9), "#8a6a45", 2);
      if (tileAt(x + 1, y) === "water") line(ctx, iso(x + 0.9, y), iso(x + 0.9, y + 1), "#8a6a45", 2);
    }
  }
}
