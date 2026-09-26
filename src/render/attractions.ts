import type { Prop } from "../sim/types";
import { shipRoutePoints } from "../sim/world";
import { iso, line, poly, shade } from "./draw";
import type { Pt } from "./draw";
import { arcPath, directionAt, pointAt, roundedLoop } from "./path";
import type { ArcPath } from "./path";

/** Pushes a night-time light glow for the renderer's additive lighting pass. */
export type Glow = (x: number, y: number, r: number, color: string) => void;

type V2 = [number, number];

/**
 * An oriented box in tile space (forward vector `f`, so it can face any direction, unlike
 * `box()` which is axis-aligned). Only the faces turned toward the viewer are filled, then
 * the top, which is all an isometric view ever shows.
 */
function prism(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  f: V2,
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  z0: number,
  h: number,
  color: string,
  top?: string,
) {
  const s: V2 = [-f[1], f[0]];
  const at = (u: number, v: number): V2 => [cx + f[0] * u + s[0] * v, cy + f[1] * u + s[1] * v];
  const base = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
  const mx = (base[0][0] + base[2][0]) / 2;
  const my = (base[0][1] + base[2][1]) / 2;
  for (let k = 0; k < 4; k++) {
    const a = base[k];
    const b = base[(k + 1) % 4];
    const nx = (a[0] + b[0]) / 2 - mx;
    const ny = (a[1] + b[1]) / 2 - my;
    if (nx + ny <= 0) continue; // faces away from the camera
    const lit = nx - ny > 0 ? -0.25 : -0.05;
    poly(ctx, [iso(a[0], a[1], z0), iso(b[0], b[1], z0), iso(b[0], b[1], z0 + h), iso(a[0], a[1], z0 + h)], shade(color, lit));
  }
  poly(
    ctx,
    base.map((p) => iso(p[0], p[1], z0 + h)),
    top ?? shade(color, 0.12),
  );
}

// ---------------------------------------------------------------- boats

export type BoatKind = "sail" | "ferry" | "cargo";

const HULLS: Record<BoatKind, { len: number; beam: number; hull: string; deck: string }> = {
  sail: { len: 0.9, beam: 0.34, hull: "#f4f1ea", deck: "#b98a5a" },
  ferry: { len: 1.5, beam: 0.52, hull: "#f4f6f8", deck: "#d9dde2" },
  cargo: { len: 2.1, beam: 0.62, hull: "#b5362f", deck: "#6b7280" },
};

/**
 * One boat, in tile space at (x, y), facing along `f`. Moving boats trail a wake. Used both
 * for the ships sailing the harbor lane and the yachts moored at the Marina.
 */
export function drawBoat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  f: V2,
  kind: BoatKind,
  night: number,
  moving: boolean,
  time: number,
  tint = 0,
) {
  const H = HULLS[kind];
  const L = H.len;
  const B = H.beam;
  const s: V2 = [-f[1], f[0]];
  const P = (u: number, v: number, z: number): Pt => iso(x + f[0] * u + s[0] * v, y + f[1] * u + s[1] * v, z);
  const bob = Math.sin(time * 1.6 + x * 3 + y) * (moving ? 0.6 : 1.1);

  // Wake: foam at the stern and two lines spreading behind.
  if (moving) {
    for (const side of [-1, 1]) {
      ctx.strokeStyle = "rgba(240,248,255,0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const a = P(-L / 2, (side * B) / 2, 0);
      const b = P(-L / 2 - 1.6, side * (B / 2 + 0.55), 0);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
    const foam = P(-L / 2 - 0.25, 0, 0);
    ctx.fillStyle = "rgba(240,248,255,0.4)";
    ctx.beginPath();
    ctx.ellipse(foam[0], foam[1], 6 + L * 3, 3 + L, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Darker water under the hull.
  const c = P(0, 0, 0);
  ctx.fillStyle = "rgba(10,30,50,0.25)";
  ctx.beginPath();
  ctx.ellipse(c[0] + 2, c[1] + 2, 10 + L * 11, 5 + L * 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const outline: V2[] = [
    [L / 2, 0],
    [L * 0.22, B / 2],
    [-L / 2, B * 0.42],
    [-L / 2, -B * 0.42],
    [L * 0.22, -B / 2],
  ];
  const deckZ = (kind === "cargo" ? 7 : kind === "ferry" ? 6 : 4) + bob;
  // Hull sides: each edge from the waterline up to the deck, back faces skipped.
  for (let k = 0; k < outline.length; k++) {
    const a = outline[k];
    const b = outline[(k + 1) % outline.length];
    const wa = [x + f[0] * a[0] + s[0] * a[1], y + f[1] * a[0] + s[1] * a[1]];
    const wb = [x + f[0] * b[0] + s[0] * b[1], y + f[1] * b[0] + s[1] * b[1]];
    const nx = (wa[0] + wb[0]) / 2 - x;
    const ny = (wa[1] + wb[1]) / 2 - y;
    if (nx + ny <= 0) continue;
    poly(ctx, [P(a[0], a[1], bob), P(b[0], b[1], bob), P(b[0], b[1], deckZ), P(a[0], a[1], deckZ)], shade(H.hull, nx - ny > 0 ? -0.28 : -0.08));
    if (kind === "ferry") line(ctx, P(a[0], a[1], bob + 2.5), P(b[0], b[1], bob + 2.5), "#3d6fb6", 1.6);
  }
  poly(
    ctx,
    outline.map((p) => P(p[0], p[1], deckZ)),
    H.deck,
    "rgba(0,0,0,0.25)",
    0.6,
  );

  const lights: Pt[] = [];
  if (kind === "sail") {
    const sails = ["#ffffff", "#ffe8e0", "#e6f1ff", "#fff6d8"];
    const mastBase = P(0.08, 0, deckZ);
    const mastTop: Pt = [mastBase[0], mastBase[1] - 30];
    line(ctx, mastBase, mastTop, "#5b4636", 1.4);
    const boom = P(-0.42, 0, deckZ + 3);
    poly(ctx, [mastTop, [mastBase[0], mastBase[1] - 3], boom], sails[tint % sails.length], "rgba(0,0,0,0.2)", 0.6);
    const bow = P(L / 2 - 0.02, 0, deckZ);
    poly(ctx, [[mastTop[0], mastTop[1] + 4], [mastBase[0], mastBase[1] - 4], bow], shade(sails[tint % sails.length], -0.06), "rgba(0,0,0,0.15)", 0.6);
    lights.push(mastTop);
  } else if (kind === "ferry") {
    prism(ctx, x, y, f, -0.45, 0.35, -B * 0.32, B * 0.32, deckZ, 9, "#ffffff", "#e8ecf1");
    prism(ctx, x, y, f, -0.25, 0.15, -B * 0.24, B * 0.24, deckZ + 9, 6, "#f4f6f8", "#d9dde2");
    prism(ctx, x, y, f, -0.42, -0.3, -0.07, 0.07, deckZ + 9, 12, "#3d6fb6", "#d8433b");
    for (let k = 0; k < 5; k++) {
      const w = P(-0.4 + k * 0.17, B * 0.33, deckZ + 5);
      ctx.fillStyle = night > 0.15 ? "#ffe39a" : "#6f8fb0";
      ctx.fillRect(w[0] - 1.5, w[1] - 1.5, 3, 2.5);
      if (night > 0.15) lights.push(w);
    }
  } else {
    const cols = ["#3d6fb6", "#e0a82e", "#3fa06a", "#d8433b", "#8a5a9a"];
    for (let k = 0; k < 4; k++) {
      const u0 = -0.25 + k * 0.28;
      prism(ctx, x, y, f, u0, u0 + 0.24, -B * 0.38, 0, deckZ, 7, cols[(k + tint) % cols.length]);
      prism(ctx, x, y, f, u0, u0 + 0.24, 0, B * 0.38, deckZ, 7, cols[(k + tint + 2) % cols.length]);
    }
    prism(ctx, x, y, f, -0.98, -0.62, -B * 0.4, B * 0.4, deckZ, 16, "#f4f6f8", "#d9dde2");
    prism(ctx, x, y, f, -0.9, -0.76, -0.09, 0.09, deckZ + 16, 9, "#2b3440", "#d8433b");
    const br = P(-0.62, 0, deckZ + 12);
    ctx.fillStyle = night > 0.15 ? "#ffe39a" : "#2b3440";
    ctx.fillRect(br[0] - 5, br[1] - 2, 10, 2.5);
    if (night > 0.15) lights.push(br);
  }
  if (night > 0.15) {
    const port = P(L * 0.2, B / 2, deckZ);
    const star = P(L * 0.2, -B / 2, deckZ);
    ctx.fillStyle = "#ff5a4a";
    ctx.fillRect(port[0] - 1, port[1] - 1, 2, 2);
    ctx.fillStyle = "#4dff88";
    ctx.fillRect(star[0] - 1, star[1] - 1, 2, 2);
  }
  return lights;
}

let shipPath: ArcPath | null = null;

const FLEET: { kind: BoatKind; tint: number }[] = [
  { kind: "ferry", tint: 0 },
  { kind: "sail", tint: 1 },
  { kind: "cargo", tint: 0 },
  { kind: "sail", tint: 3 },
];

/** Ships sailing the harbor lane, evenly spaced, drawn after the rest of the scene. */
export function drawShips(ctx: CanvasRenderingContext2D, time: number, speed: number, night: number, glow: Glow) {
  shipPath ??= arcPath(shipRoutePoints().map((p) => [p.x, p.y] as V2));
  const path = shipPath;
  const f = Math.max(0.6, Math.min(3, speed || 0.6));
  const v = time * 0.9 * f;
  FLEET.forEach((ship, k) => {
    const d = v + (k * path.total) / FLEET.length;
    const [x, y] = pointAt(path, d);
    // Blend the heading a little ahead so ships ease round corners instead of snapping.
    const d0 = directionAt(path, d);
    const d1 = directionAt(path, d + 1.2);
    const fx = d0[0] + d1[0];
    const fy = d0[1] + d1[1];
    const len = Math.hypot(fx, fy) || 1;
    const lights = drawBoat(ctx, x, y, [fx / len, fy / len], ship.kind, night, true, time, ship.tint);
    for (const l of lights) glow(l[0], l[1], 10, "255,225,160");
  });
}

// ---------------------------------------------------------------- theme park rides

const CABINS = ["#e0463a", "#3d6fb6", "#f2c14e", "#3fa06a", "#8a5a9a", "#e07b39"];

export function drawFerrisWheel(ctx: CanvasRenderingContext2D, p: Prop, time: number, night: number, glow: Glow) {
  const g = iso(p.x + 0.5, p.y + 0.5, 0);
  const R = 50;
  const hub: Pt = [g[0], g[1] - 72];
  const rx = R * 0.84;
  // Boarding platform.
  ctx.fillStyle = "#d9d2c3";
  ctx.beginPath();
  ctx.ellipse(g[0], g[1], 34, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b9ae98";
  ctx.fillRect(g[0] - 10, g[1] - 8, 20, 8);

  const legs = (dx: number, dy: number, color: string) => {
    line(ctx, [g[0] - 30 + dx, g[1] + dy], [hub[0] + dx * 0.2, hub[1] + dy * 0.2], color, 4);
    line(ctx, [g[0] + 30 + dx, g[1] + dy], [hub[0] + dx * 0.2, hub[1] + dy * 0.2], color, 4);
    line(ctx, [g[0] - 16 + dx, g[1] - 36 + dy], [g[0] + 16 + dx, g[1] - 36 + dy], color, 2);
  };
  legs(6, -6, "#8f96a0");

  const spin = time * 0.22;
  // Rim: a thick outer ring and a thinner inner ring joined by the spokes.
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#e9edf2";
  ctx.beginPath();
  ctx.ellipse(hub[0], hub[1], rx, R, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#c2c9d2";
  ctx.beginPath();
  ctx.ellipse(hub[0], hub[1], rx * 0.86, R * 0.86, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = 0; k < 16; k++) {
    const a = spin + (k / 16) * Math.PI * 2;
    line(ctx, hub, [hub[0] + Math.cos(a) * rx, hub[1] + Math.sin(a) * R], "rgba(200,206,214,0.8)", 1);
  }
  if (night > 0.1) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      ctx.fillStyle = CABINS[k % CABINS.length];
      ctx.fillRect(hub[0] + Math.cos(a) * rx - 1, hub[1] + Math.sin(a) * R - 1, 2, 2);
    }
    glow(hub[0], hub[1], 80, "255,190,220");
  }
  // Gondolas always hang straight down from where they're pinned to the rim.
  for (let k = 0; k < 12; k++) {
    const a = spin + (k / 12) * Math.PI * 2;
    const ax = hub[0] + Math.cos(a) * rx;
    const ay = hub[1] + Math.sin(a) * R;
    line(ctx, [ax, ay], [ax, ay + 4], "#5b6168", 1);
    ctx.fillStyle = CABINS[k % CABINS.length];
    ctx.beginPath();
    ctx.roundRect(ax - 5, ay + 4, 10, 9, 2.5);
    ctx.fill();
    ctx.fillStyle = shade(CABINS[k % CABINS.length], -0.35);
    ctx.fillRect(ax - 5, ay + 4, 10, 2);
    ctx.fillStyle = night > 0.15 ? "#ffe39a" : "rgba(220,235,250,0.85)";
    ctx.fillRect(ax - 3, ay + 7, 6, 3);
  }
  ctx.fillStyle = "#5b6168";
  ctx.beginPath();
  ctx.arc(hub[0], hub[1], 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8433b";
  ctx.beginPath();
  ctx.arc(hub[0], hub[1], 3.5, 0, Math.PI * 2);
  ctx.fill();
  legs(0, 0, "#a9b0ba");
}

const CAROUSEL_ROOF: [string, string][] = [
  ["#d8433b", "#fff4e0"],
  ["#3d6fb6", "#ffe066"],
];

export function drawCarousel(ctx: CanvasRenderingContext2D, p: Prop, time: number, night: number, glow: Glow) {
  const g = iso(p.x + 0.5, p.y + 0.5, 0);
  const R = 30;
  const [c1, c2] = CAROUSEL_ROOF[p.variant % CAROUSEL_ROOF.length];
  // Round platform drum.
  ctx.fillStyle = "#b9ae98";
  ctx.beginPath();
  ctx.ellipse(g[0], g[1], R, R * 0.5, 0, 0, Math.PI);
  ctx.lineTo(g[0] - R, g[1] - 7);
  ctx.ellipse(g[0], g[1] - 7, R, R * 0.5, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#efe7d6";
  ctx.beginPath();
  ctx.ellipse(g[0], g[1] - 7, R, R * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const top = g[1] - 7;
  const rimY = g[1] - 40;
  line(ctx, [g[0], top], [g[0], rimY], "#c9a33a", 4);

  // Horses on brass poles, going round; draw the far side first.
  const spin = time * 0.7;
  const horses = Array.from({ length: 8 }, (_, k) => spin + (k / 8) * Math.PI * 2).sort((a, b) => Math.sin(a) - Math.sin(b));
  const HORSE = ["#ffffff", "#8a5a35", "#2b2b33", "#e8d6b0"];
  horses.forEach((a, k) => {
    const hx = g[0] + Math.cos(a) * R * 0.72;
    const baseY = top + Math.sin(a) * R * 0.36;
    const hy = baseY - 13 - Math.sin(time * 3 + k) * 3;
    line(ctx, [hx, baseY], [hx, rimY + Math.sin(a) * R * 0.3], "#d9b44a", 1.4);
    const dir = -Math.sin(a) >= 0 ? 1 : -1;
    ctx.fillStyle = HORSE[k % HORSE.length];
    ctx.beginPath();
    ctx.ellipse(hx, hy, 6, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    poly(ctx, [[hx + dir * 4, hy - 1], [hx + dir * 8, hy - 7], [hx + dir * 10, hy - 5], [hx + dir * 6, hy + 1]], HORSE[k % HORSE.length]);
    line(ctx, [hx - 4, hy + 2], [hx - 4, hy + 6], "#555", 1);
    line(ctx, [hx + 4, hy + 2], [hx + 4, hy + 6], "#555", 1);
  });

  // Scalloped valance and a striped conical roof.
  const RR = R + 5;
  const apex: Pt = [g[0], rimY - 26];
  for (let k = 0; k < 16; k++) {
    const a0 = (k / 16) * Math.PI * 2;
    const a1 = ((k + 1) / 16) * Math.PI * 2;
    poly(
      ctx,
      [apex, [g[0] + Math.cos(a0) * RR, rimY + Math.sin(a0) * RR * 0.5], [g[0] + Math.cos(a1) * RR, rimY + Math.sin(a1) * RR * 0.5]],
      k % 2 ? c1 : c2,
    );
  }
  for (let k = 0; k < 16; k++) {
    const a = ((k + 0.5) / 16) * Math.PI * 2;
    if (Math.sin(a) < -0.1) continue;
    ctx.fillStyle = k % 2 ? c2 : c1;
    ctx.beginPath();
    ctx.arc(g[0] + Math.cos(a) * RR, rimY + Math.sin(a) * RR * 0.5 + 2, 3.5, 0, Math.PI);
    ctx.fill();
  }
  line(ctx, apex, [apex[0], apex[1] - 12], "#5b6168", 1.4);
  poly(ctx, [[apex[0], apex[1] - 12], [apex[0] + 9, apex[1] - 9], [apex[0], apex[1] - 6]], c1);
  if (night > 0.1) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      ctx.fillStyle = "#fff2b0";
      ctx.fillRect(g[0] + Math.cos(a) * RR - 1, rimY + Math.sin(a) * RR * 0.5 - 1, 2, 2);
    }
    glow(g[0], rimY, 55, "255,220,150");
  }
}

// The coaster circuit in tile offsets from the prop's anchor, with heights in pixels:
// station, lift hill, big drop, a sweeping turn and a camel-back return.
const COASTER: [number, number, number][] = [
  [0.2, 0.4, 6],
  [1.2, 0.2, 8],
  [2.0, 0.15, 30],
  [2.8, 0.2, 62],
  [3.5, 0.5, 58],
  [3.9, 1.2, 20],
  [3.7, 2.2, 10],
  [3.0, 2.8, 16],
  [2.2, 2.9, 38],
  [1.4, 2.8, 22],
  [0.6, 2.4, 12],
  [0.1, 1.5, 8],
];

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

const coasterCache = new Map<string, { track: [number, number, number][]; screen: ArcPath }>();

function coasterTrack(p: Prop) {
  const key = `${p.x},${p.y}`;
  let c = coasterCache.get(key);
  if (!c) {
    const n = COASTER.length;
    const track: [number, number, number][] = [];
    for (let k = 0; k < n; k++) {
      const [a, b, cc, d] = [COASTER[(k - 1 + n) % n], COASTER[k], COASTER[(k + 1) % n], COASTER[(k + 2) % n]];
      for (let s = 0; s < 8; s++) {
        const t = s / 8;
        track.push([catmull(a[0], b[0], cc[0], d[0], t), catmull(a[1], b[1], cc[1], d[1], t), catmull(a[2], b[2], cc[2], d[2], t)]);
      }
    }
    track.push(track[0]);
    const screen = arcPath(track.map(([u, v, z]) => iso(p.x + u, p.y + v, z) as V2));
    c = { track, screen };
    coasterCache.set(key, c);
  }
  return c;
}

export function drawCoaster(ctx: CanvasRenderingContext2D, p: Prop, time: number) {
  const { track, screen } = coasterTrack(p);
  const accent = p.variant % 2 ? "#2fb3a6" : "#e0463a";
  // Station hut.
  prism(ctx, p.x + 0.7, p.y + 0.35, [1, 0], -0.5, 0.5, -0.25, 0.25, 0, 10, "#e9e4d8", accent);
  // Support trestles from the ground up to the rail.
  for (let k = 0; k < track.length - 1; k += 3) {
    const [u, v, z] = track[k];
    if (z < 9) continue;
    const top = iso(p.x + u, p.y + v, z);
    const bot = iso(p.x + u, p.y + v, 0);
    line(ctx, bot, top, "#8a8f98", 1.6);
    line(ctx, [bot[0] - 3, bot[1]], [top[0], top[1] + 6], "rgba(138,143,152,0.6)", 1);
  }
  // Rails: a dark tube with a coloured spine.
  const trace = () => {
    ctx.beginPath();
    screen.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  };
  ctx.lineJoin = "round";
  trace();
  ctx.strokeStyle = "#2e3440";
  ctx.lineWidth = 6;
  ctx.stroke();
  trace();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.lineJoin = "miter";

  // A four-car train running the circuit.
  const d0 = time * 55;
  for (let k = 0; k < 4; k++) {
    const d = d0 - k * 11;
    const [x, y] = pointAt(screen, d);
    const [dx, dy] = directionAt(screen, d);
    ctx.save();
    ctx.translate(x, y - 3);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = k === 0 ? "#f2c14e" : accent;
    ctx.beginPath();
    ctx.roundRect(-5, -3.5, 10, 7, 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#3b2f25";
    ctx.beginPath();
    ctx.arc(x, y - 8, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

const TENT: [string, string][] = [
  ["#d8433b", "#fff4e0"],
  ["#3d6fb6", "#ffe066"],
  ["#2f9e6f", "#fff4e0"],
  ["#8a5a9a", "#ffd6e8"],
];

export function drawTent(ctx: CanvasRenderingContext2D, p: Prop, night: number, glow: Glow) {
  const g = iso(p.x + 0.5, p.y + 0.5, 0);
  const [c1, c2] = TENT[p.variant % TENT.length];
  const R = 24;
  const wall = 14;
  const N = 14;
  ctx.fillStyle = "rgba(15,25,20,0.25)";
  ctx.beginPath();
  ctx.ellipse(g[0] + 5, g[1] + 2, R + 4, (R + 4) * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Striped drum wall — only the front half is ever visible.
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI;
    const a1 = ((k + 1) / N) * Math.PI;
    const b0: Pt = [g[0] + Math.cos(a0) * R, g[1] + Math.sin(a0) * R * 0.5];
    const b1: Pt = [g[0] + Math.cos(a1) * R, g[1] + Math.sin(a1) * R * 0.5];
    const col = k % 2 ? c1 : c2;
    poly(ctx, [b0, b1, [b1[0], b1[1] - wall], [b0[0], b0[1] - wall]], shade(col, Math.cos((a0 + a1) / 2) > 0 ? -0.18 : 0));
  }
  // Entrance flap.
  const door = g[1] + R * 0.5;
  poly(ctx, [[g[0] - 6, door], [g[0] + 6, door], [g[0], door - wall - 2]], "#3b2f25");
  // Striped cone roof.
  const rim = g[1] - wall;
  const apex: Pt = [g[0], rim - 30];
  for (let k = 0; k < N * 2; k++) {
    const a0 = (k / (N * 2)) * Math.PI * 2;
    const a1 = ((k + 1) / (N * 2)) * Math.PI * 2;
    poly(
      ctx,
      [apex, [g[0] + Math.cos(a0) * (R + 3), rim + Math.sin(a0) * (R + 3) * 0.5], [g[0] + Math.cos(a1) * (R + 3), rim + Math.sin(a1) * (R + 3) * 0.5]],
      k % 2 ? c1 : c2,
    );
  }
  const sh = ctx.createLinearGradient(g[0] - R, 0, g[0] + R, 0);
  sh.addColorStop(0, "rgba(255,255,255,0.12)");
  sh.addColorStop(1, "rgba(0,0,0,0.22)");
  poly(ctx, [apex, [g[0] - R - 3, rim], [g[0] + R + 3, rim]], sh);
  line(ctx, apex, [apex[0], apex[1] - 12], "#5b6168", 1.3);
  poly(ctx, [[apex[0], apex[1] - 12], [apex[0] + 9, apex[1] - 9], [apex[0], apex[1] - 6]], c1);
  if (night > 0.1) glow(g[0], rim, 40, "255,210,140");
}

const trainCache = new Map<string, ArcPath>();

/** A kiddie train on a small oval of track, with a little steam engine and three carriages. */
export function drawMiniTrain(ctx: CanvasRenderingContext2D, p: Prop, time: number, night: number) {
  const key = `${p.x},${p.y}`;
  let path = trainCache.get(key);
  if (!path) {
    path = arcPath(
      roundedLoop(
        [
          [p.x + 0.3, p.y + 0.3],
          [p.x + 3.7, p.y + 0.3],
          [p.x + 3.7, p.y + 3.4],
          [p.x + 0.3, p.y + 3.4],
        ],
        0.9,
        6,
      ),
    );
    trainCache.set(key, path);
  }
  const loop = path;
  const offset = (d: number, o: number): Pt => {
    const [x, y] = pointAt(loop, d);
    const [dx, dy] = directionAt(loop, d);
    return iso(x - dy * o, y + dx * o, 0);
  };
  // Ballast, sleepers and two rails.
  ctx.lineJoin = "round";
  ctx.beginPath();
  loop.pts.forEach(([x, y], i) => {
    const q = iso(x, y, 0);
    if (i) ctx.lineTo(q[0], q[1]);
    else ctx.moveTo(q[0], q[1]);
  });
  ctx.strokeStyle = "#a08a6e";
  ctx.lineWidth = 9;
  ctx.stroke();
  for (let d = 0; d < loop.total; d += 0.3) line(ctx, offset(d, -0.14), offset(d, 0.14), "#6b4a2f", 1.6);
  for (const o of [-0.09, 0.09]) {
    ctx.beginPath();
    for (let d = 0; d <= loop.total + 0.01; d += 0.15) {
      const q = offset(d, o);
      if (d) ctx.lineTo(q[0], q[1]);
      else ctx.moveTo(q[0], q[1]);
    }
    ctx.strokeStyle = "#c9ced4";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.lineJoin = "miter";

  const head = time * 0.9;
  const cars = ["#d8433b", "#f2c14e", "#3d6fb6", "#3fa06a"];
  const bodies: { d: number; x: number; y: number; f: V2; k: number }[] = [];
  for (let k = 0; k < 4; k++) {
    const d = head - k * 0.52;
    const [x, y] = pointAt(loop, d);
    bodies.push({ d, x, y, f: directionAt(loop, d), k });
  }
  bodies.sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const b of bodies) {
    if (b.k === 0) {
      prism(ctx, b.x, b.y, b.f, -0.22, 0.22, -0.13, 0.13, 1, 7, "#2b3440", "#3a4250");
      prism(ctx, b.x, b.y, b.f, -0.22, -0.02, -0.13, 0.13, 8, 5, cars[0], shade(cars[0], 0.2));
      prism(ctx, b.x, b.y, b.f, 0.1, 0.18, -0.04, 0.04, 8, 7, "#2b3440");
      const stack = iso(b.x + b.f[0] * 0.14, b.y + b.f[1] * 0.14, 16);
      const puff = (((time * 1.5) % 1) + 1) % 1;
      ctx.fillStyle = `rgba(245,245,245,${0.6 * (1 - puff)})`;
      ctx.beginPath();
      ctx.arc(stack[0] - puff * 6, stack[1] - puff * 10, 2 + puff * 4, 0, Math.PI * 2);
      ctx.fill();
      if (night > 0.15) {
        const lamp = iso(b.x + b.f[0] * 0.23, b.y + b.f[1] * 0.23, 6);
        ctx.fillStyle = "#fff4c8";
        ctx.fillRect(lamp[0] - 1.2, lamp[1] - 1.2, 2.4, 2.4);
      }
    } else {
      prism(ctx, b.x, b.y, b.f, -0.21, 0.21, -0.13, 0.13, 1, 5, cars[b.k], shade(cars[b.k], 0.15));
      const seat = iso(b.x, b.y, 9);
      ctx.fillStyle = "#e8b98a";
      ctx.beginPath();
      ctx.arc(seat[0], seat[1], 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A yacht moored at the Marina — gently bobbing, bow pointing out to sea. */
export function drawMooredBoat(ctx: CanvasRenderingContext2D, p: Prop, time: number, night: number) {
  drawBoat(ctx, p.x + 0.5, p.y + 0.5, [0, 1], "sail", night, false, time, p.variant);
}
