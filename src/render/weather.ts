import { hash, iso, line } from "./draw";
import type { World } from "../sim/types";
import { S, idx } from "../sim/world";

export type Weather = "clear" | "cloudy" | "rainy" | "foggy";

/** Deterministic per-day weather roll: same seed + day always gives the same weather. */
export function dayWeather(seed: number, era: number): Weather {
  const r = hash(seed, era, 101);
  if (r < 0.45) return "clear";
  if (r < 0.75) return "cloudy";
  if (r < 0.9) return "rainy";
  return "foggy";
}

interface Cloud {
  x0: number;
  y0: number;
  s0: number;
  speed: number;
}

const CLOUDS: Cloud[] = Array.from({ length: 5 }, (_, i) => ({
  x0: hash(i, 1),
  y0: 0.06 + hash(i, 2) * 0.28,
  s0: 0.6 + hash(i, 3) * 0.7,
  speed: 0.006 + hash(i, 4) * 0.01,
}));

function cloudBlob(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, alpha: number) {
  const lobes: [number, number, number][] = [
    [0, 0, 1],
    [0.7, -0.15, 0.75],
    [-0.7, -0.1, 0.7],
    [0.25, 0.12, 0.8],
    [-0.35, 0.14, 0.7],
  ];
  for (const [dx, dy, r] of lobes) {
    const g = ctx.createRadialGradient(cx + dx * 60 * s, cy + dy * 60 * s, 0, cx + dx * 60 * s, cy + dy * 60 * s, 44 * s * r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx + dx * 60 * s, cy + dy * 60 * s, 44 * s * r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Screen-space drifting clouds. Draw right after the sky, before the camera transform. */
export function drawClouds(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, weather: Weather) {
  const alpha = weather === "rainy" ? 0.5 : 0.32;
  for (const c of CLOUDS) {
    const t = (c.x0 + time * c.speed) % 1.3;
    const cx = w * (t - 0.15);
    const cy = h * c.y0;
    cloudBlob(ctx, cx, cy, c.s0, alpha);
  }
}

interface Drop {
  bx: number;
  by: number;
  speed: number;
  len: number;
}

const RAIN: Drop[] = Array.from({ length: 140 }, (_, i) => ({
  bx: hash(i, 11),
  by: hash(i, 12),
  speed: 900 + hash(i, 13) * 500,
  len: 10 + hash(i, 14) * 10,
}));

/** Screen-space falling rain streaks. Foreground pass, draw in device-pixel space near the end. */
export function drawRain(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  ctx.strokeStyle = "rgba(200,215,235,0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const d of RAIN) {
    const y = ((d.by * h + time * d.speed) % (h + 40)) - 20;
    const x = (d.bx * w + y * 0.12) % w;
    ctx.moveTo(x, y);
    ctx.lineTo(x - d.len * 0.35, y + d.len);
  }
  ctx.stroke();
}

/** Screen-space fog: thin haze overall, thickening toward the edges. */
export function drawFog(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "rgba(235,240,245,0.16)";
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.max(w, h) * 0.72;
  const g = ctx.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
  g.addColorStop(0, "rgba(235,240,245,0)");
  g.addColorStop(1, "rgba(225,232,240,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

const WATER_KINDS = new Set(["water", "pond"]);
const PUDDLE_KINDS = new Set(["road", "plaza", "walk", "path"]);

/** Animated shimmer on water tiles — camera space. Only visible tiles in [x0,x1]x[y0,y1] are drawn. */
export function drawWaterShimmer(
  ctx: CanvasRenderingContext2D,
  world: World,
  time: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  ctx.lineWidth = 1.1;
  for (let y = Math.max(0, y0); y <= Math.min(S - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(S - 1, x1); x++) {
      if (!WATER_KINDS.has(world.tiles[idx(x, y)])) continue;
      const n = hash(x, y);
      for (let k = 0; k < 3; k++) {
        const phase = time * 0.8 + n * 6 + k * 2.1;
        const wobble = Math.sin(phase) * 0.15;
        const yy = y + 0.2 + k * 0.3 + wobble * 0.08;
        const a = iso(x + 0.08, yy);
        const b = iso(x + 0.92, yy + wobble * 0.06);
        const alpha = 0.14 + 0.1 * (0.5 + 0.5 * Math.sin(phase * 1.7));
        line(ctx, a, b, `rgba(235,248,255,${alpha})`, 1.1);
      }
    }
  }
}

/** Rain puddle glints on paved tiles — camera space, only while it's raining. */
export function drawPuddles(
  ctx: CanvasRenderingContext2D,
  world: World,
  time: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  for (let y = Math.max(0, y0); y <= Math.min(S - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(S - 1, x1); x++) {
      const i = idx(x, y);
      if (!PUDDLE_KINDS.has(world.tiles[i])) continue;
      const n = hash(x, y, 7);
      if (n > 0.32) continue;
      const cx = x + 0.3 + hash(x, y, 8) * 0.4;
      const cy = y + 0.3 + hash(y, x, 9) * 0.4;
      const p = iso(cx, cy);
      const rw = 6 + hash(x, y, 10) * 5;
      ctx.beginPath();
      ctx.ellipse(p[0], p[1], rw, rw * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(30,40,55,0.22)";
      ctx.fill();
      const shimmer = 0.35 + 0.3 * Math.sin(time * 2 + n * 10);
      ctx.beginPath();
      ctx.ellipse(p[0] - rw * 0.2, p[1] - rw * 0.08, rw * 0.4, rw * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,235,250,${shimmer})`;
      ctx.fill();
    }
  }
}
