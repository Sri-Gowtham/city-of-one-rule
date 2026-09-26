import type { World } from "../sim/types";
import { S, idx } from "../sim/world";
import { box } from "./buildings";
import { hash, iso, line, poly } from "./draw";

const PARKED_COLORS = ["#8a5a9a", "#3d6fb6", "#c9a33a", "#6b7280", "#3fa06a", "#8a3f3a", "#4a4f58"];

/**
 * Static street furniture that doesn't need simulation state: parked cars along road curbs
 * and bus-stop shelters at a few regular intervals. Purely decorative, seeded by tile
 * position so it's stable frame to frame — no new World fields, nothing simulated moves here
 * (the actual moving traffic is drawn separately by the renderer).
 */
export function drawStreetLife(
  ctx: CanvasRenderingContext2D,
  world: World,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  night: boolean,
) {
  const tileAt = (tx: number, ty: number) => (tx >= 0 && ty >= 0 && tx < S && ty < S ? world.tiles[idx(tx, ty)] : "water");

  for (let y = Math.max(0, y0); y <= Math.min(S - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(S - 1, x1); x++) {
      if (world.tiles[idx(x, y)] !== "road") continue;
      const alongX = tileAt(x - 1, y) === "road" && tileAt(x + 1, y) === "road";
      const alongY = tileAt(x, y - 1) === "road" && tileAt(x, y + 1) === "road";
      if (alongX === alongY) continue; // skip intersections and dead ends — nowhere to curb-park

      const curbSide = alongX ? (tileAt(x, y - 1) !== "road" ? -1 : tileAt(x, y + 1) !== "road" ? 1 : 0) : 0;
      const curbSideV = alongY ? (tileAt(x - 1, y) !== "road" ? -1 : tileAt(x + 1, y) !== "road" ? 1 : 0) : 0;

      const n = hash(x, y, 71);
      if (n < 0.55) {
        if (alongX && curbSide !== 0) {
          const color = PARKED_COLORS[Math.floor(hash(x, y, 72) * PARKED_COLORS.length)];
          const cy = y + 0.5 + curbSide * 0.32;
          box(ctx, x + 0.12, cy - 0.14, 0.62, 0.28, 0, 6, color);
          if (night) {
            const p = iso(x + 0.74, cy, 5);
            ctx.fillStyle = "#fff4c8";
            ctx.fillRect(p[0] - 0.8, p[1] - 0.8, 1.6, 1.6);
          }
        } else if (alongY && curbSideV !== 0) {
          const color = PARKED_COLORS[Math.floor(hash(x, y, 73) * PARKED_COLORS.length)];
          const cx = x + 0.5 + curbSideV * 0.32;
          box(ctx, cx - 0.14, y + 0.12, 0.28, 0.62, 0, 6, color);
        }
      }

      // A bus-stop shelter every so often, on a curb tile that didn't already get a parked car.
      if (n >= 0.55 && n < 0.6 && (curbSide !== 0 || curbSideV !== 0)) {
        const side = curbSide || curbSideV;
        const horizontal = alongX;
        const bx = horizontal ? x + 0.5 : x + 0.5 + side * 0.3;
        const by = horizontal ? y + 0.5 + side * 0.3 : y + 0.5;
        drawBusStop(ctx, bx, by, horizontal, night);
      }
    }
  }
}

function drawBusStop(ctx: CanvasRenderingContext2D, cx: number, cy: number, horizontal: boolean, night: boolean) {
  const a = horizontal ? iso(cx - 0.32, cy) : iso(cx, cy - 0.32);
  const b = horizontal ? iso(cx + 0.32, cy) : iso(cx, cy + 0.32);
  line(ctx, a, [a[0], a[1] - 16], "#7a7f87", 1.6);
  line(ctx, b, [b[0], b[1] - 16], "#7a7f87", 1.6);
  poly(
    ctx,
    [[a[0] - 3, a[1] - 16], [b[0] + 3, b[1] - 16], [b[0] + 3, b[1] - 20], [a[0] - 3, a[1] - 20]],
    night ? "#e8dda0" : "#d9dde2",
    "rgba(0,0,0,0.25)",
    0.6,
  );
  line(ctx, [a[0], a[1] - 8], [b[0], b[1] - 8], "#8a5a35", 2.2);
  line(ctx, [a[0], a[1] - 8], [a[0], a[1]], "#333", 1);
  line(ctx, [b[0], b[1] - 8], [b[0], b[1]], "#333", 1);
  if (night) {
    const g = ctx.createRadialGradient((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 17, 0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 17, 20);
    g.addColorStop(0, "rgba(255,225,160,0.4)");
    g.addColorStop(1, "rgba(255,225,160,0)");
    ctx.fillStyle = g;
    ctx.fillRect((a[0] + b[0]) / 2 - 20, (a[1] + b[1]) / 2 - 37, 40, 40);
  }
}
