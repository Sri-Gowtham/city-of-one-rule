import type { Sim } from "../sim/engine";
import type { Building, Citizen, Prop, Tree } from "../sim/types";
import { BLOCKS, BRIDGE_Y, DISTRICT_NAMES, ISLAND_X0, ISLAND_X1, ISLAND_Y0, ISLAND_Y1, LAST_ROAD, ROADS, S, idx } from "../sim/world";
import type { DistrictId } from "../sim/types";
import { box, buildSprite, buildingHeight, buildingHull, spriteKey } from "./buildings";
import type { Sprite } from "./buildings";
import { TH, TW, hash, iso, line, pointInPoly, poly } from "./draw";

interface BuildCtx {
  night: number;
  lit: Pt[][];
  glows: { x: number; y: number; r: number; color: string }[];
  emitters: { x: number; y: number; kind: "smoke" | "steam" }[];
}

const HOME_KINDS = new Set(["house", "apartment"]);

function litProb(hour: number, home: boolean): number {
  if (hour >= 18 && hour < 23) return home ? 0.7 : 0.35;
  if (hour >= 23) return home ? 0.3 : 0.15;
  if (hour < 7.5) return home ? 0.45 : 0.1;
  return 0;
}
import type { Pt } from "./draw";
import { renderGround } from "./ground";

export type Lens = "none" | "mood" | "safety" | "green";

export type Pick = { type: "citizen"; id: number } | { type: "building"; id: number } | null;

type VehicleKind = "car" | "bike" | "van" | "truck";

interface Car {
  axis: 0 | 1;
  line: number;
  pos: number;
  dir: 1 | -1;
  speed: number;
  color: string;
  lastTurn: number;
  kind: VehicleKind;
}

interface Particle {
  x: number;
  y: number;
  age: number;
  life: number;
  kind: "smoke" | "steam";
  vx: number;
}

const CAR_COLORS = ["#d8433b", "#3d6fb6", "#f2c14e", "#e9e9e9", "#2f3e56", "#3fa06a", "#e07b39", "#8a5a9a"];
const ADS = [
  ["SALE!", "#e63946", "#fff"],
  ["NEW PHONE", "#1d3557", "#f1faee"],
  ["FIZZ COLA", "#f4a261", "#1d1d1d"],
  ["MEGA DEALS", "#ffbe0b", "#1d1d1d"],
  ["BUY MORE", "#8338ec", "#fff"],
];

function pickVehicleKind(d: DistrictId, rand: () => number): VehicleKind {
  const r = rand();
  if (d === "university" || d === "oldtown") {
    if (r < 0.35) return "bike";
    if (r < 0.45) return "van";
    return "car";
  }
  if (d === "industrial") {
    if (r < 0.4) return "truck";
    if (r < 0.55) return "van";
    return "car";
  }
  if (d === "downtown") {
    if (r < 0.18) return "van";
    if (r < 0.24) return "bike";
    return "car";
  }
  if (r < 0.08) return "bike";
  return "car";
}

export function darkness(h: number): number {
  if (h < 6.5) return 0.55;
  if (h < 8) return (0.55 * (8 - h)) / 1.5;
  if (h < 18) return 0;
  if (h < 21) return (0.55 * (h - 18)) / 3;
  return 0.55;
}

export class CityRenderer {
  cam = { x: 0, y: 0, zoom: 0.5 };
  followId: number | null = null;
  hover: Pick = null;
  lens: Lens = "none";
  private w = 0;
  private h = 0;
  private dpr = 1;
  private fitted = false;
  private ground: HTMLCanvasElement | null = null;
  private groundKey = "";
  private cars: Car[] = [];
  private particles: Particle[] = [];
  private emitTimer = 0;
  private time = 0;
  private sprites = new Map<number, Sprite>();
  private labels: { x: number; y: number; text: string }[] | null = null;

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    if (!this.fitted && w > 0 && h > 0) {
      this.fit();
      this.fitted = true;
    }
  }

  fit() {
    const mapW = S * TW;
    const mapH = S * TH + 140;
    const z = Math.min(this.w / mapW, this.h / mapH) * 0.98;
    this.cam.zoom = Math.max(0.3, Math.min(2.4, z));
    this.cam.x = this.w / 2;
    this.cam.y = (this.h - S * TH * this.cam.zoom) / 2 + 70 * this.cam.zoom;
  }

  pan(dx: number, dy: number) {
    this.cam.x += dx;
    this.cam.y += dy;
    this.followId = null;
  }

  zoomAt(sx: number, sy: number, factor: number) {
    const z0 = this.cam.zoom;
    const z1 = Math.max(0.3, Math.min(2.6, z0 * factor));
    this.cam.x = sx - ((sx - this.cam.x) * z1) / z0;
    this.cam.y = sy - ((sy - this.cam.y) * z1) / z0;
    this.cam.zoom = z1;
  }

  toScreen(p: Pt): Pt {
    return [p[0] * this.cam.zoom + this.cam.x, p[1] * this.cam.zoom + this.cam.y];
  }

  centerOn(x: number, y: number, k = 1) {
    const [sx, sy] = this.toScreen(iso(x, y));
    this.cam.x += (this.w / 2 - sx) * k;
    this.cam.y += (this.h / 2 - sy) * k;
  }

  pick(sim: Sim, sx: number, sy: number): Pick {
    const wx = (sx - this.cam.x) / this.cam.zoom;
    const wy = (sy - this.cam.y) / this.cam.zoom;
    let best: Citizen | null = null;
    let bestD = 14 / this.cam.zoom + 4;
    for (const c of sim.citizens) {
      if (c.inside !== null) continue;
      const p = iso(c.x + c.ox * 0.5, c.y + c.oy * 0.5);
      const d = Math.hypot(p[0] - wx, p[1] - 12 - wy);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    if (best) return { type: "citizen", id: best.id };
    let hit: Building | null = null;
    for (const b of sim.world.buildings) {
      if (pointInPoly(wx, wy, buildingHull(b)) && (!hit || b.x + b.y + b.w + b.h > hit.x + hit.y + hit.w + hit.h)) hit = b;
    }
    return hit ? { type: "building", id: hit.id } : null;
  }

  draw(ctx: CanvasRenderingContext2D, sim: Sim, realDt: number, speed: number, selected: Pick) {
    this.time += realDt;
    const { w, h, dpr } = this;
    const hour = sim.hour;
    const night = darkness(hour);
    const world = sim.world;

    if (this.followId !== null) {
      const c = sim.citizens[this.followId];
      this.centerOn(c.x, c.y, Math.min(1, realDt * 4));
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#2d6f9a");
    sky.addColorStop(1, "#3b86b3");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const envBucket = Math.round(sim.metrics.environment / 8);
    const key = `${world.groundVersion}|${envBucket}`;
    if (key !== this.groundKey || !this.ground) {
      this.ground = renderGround(world, envBucket * 8);
      this.groundKey = key;
    }

    const z = this.cam.zoom;
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * this.cam.x, dpr * this.cam.y);
    ctx.drawImage(this.ground, -(S * TW) / 2, 0);

    for (const l of world.litter) {
      const p = iso(l.x + l.jx, l.y + l.jy);
      ctx.fillStyle = "#e8e2d0";
      ctx.fillRect(p[0] - 2, p[1] - 1, 4, 2.5);
      ctx.fillStyle = "#7d8a5a";
      ctx.fillRect(p[0] + 1, p[1] - 2, 2, 2);
    }

    const bc: BuildCtx = { night, lit: [], glows: [], emitters: [] };
    const working = hour > 7 && hour < 20 && sim.phase === "running";

    type D = { d: number; f: () => void };
    const list: D[] = [];
    const vx0 = -this.cam.x / z - 160;
    const vy0 = -this.cam.y / z - 220;
    const vx1 = (w - this.cam.x) / z + 160;
    const vy1 = (h - this.cam.y) / z + 120;
    const visible = (x: number, y: number) => {
      const [px, py] = iso(x, y);
      return px > vx0 && px < vx1 && py > vy0 && py < vy1;
    };
    for (const b of world.buildings) {
      if (!visible(b.x + b.w / 2, b.y + b.h / 2)) continue;
      const hl: 0 | 1 | 2 =
        selected?.type === "building" && selected.id === b.id ? 2 : this.hover?.type === "building" && this.hover.id === b.id ? 1 : 0;
      list.push({ d: b.x + b.w + b.y + b.h - 1.02, f: () => this.drawBuildingSprite(ctx, sim, b, bc, hl, working) });
    }
    for (const t of world.trees) if (visible(t.x, t.y)) list.push({ d: t.x + t.y + 1 + t.jx + t.jy, f: () => this.drawTree(ctx, t, sim) });
    for (const p of world.props) if (visible(p.x, p.y)) list.push({ d: p.x + p.y + 1.05, f: () => this.drawProp(ctx, p, sim, bc) });
    if (world.flags.has("market")) {
      const ps = world.plazaSpot;
      for (let k = 0; k < 3; k++) {
        const p: Prop = { kind: "stall", x: ps.x - 1 + k, y: ps.y + 1, variant: k };
        list.push({ d: p.x + p.y + 1.05, f: () => this.drawProp(ctx, p, sim, bc) });
      }
    }
    for (const c of sim.citizens) {
      if (c.inside !== null || !visible(c.x, c.y)) continue;
      list.push({ d: c.x + c.y + 0.02, f: () => this.drawCitizen(ctx, c, sim, selected) });
    }
    this.updateCars(sim, realDt, speed);
    for (const car of this.cars) {
      const [cx, cy] = this.carPos(car);
      list.push({ d: cx + cy, f: () => this.drawCar(ctx, car, night) });
    }
    list.sort((a, b) => a.d - b.d);
    for (const it of list) it.f();

    if (this.lens !== "none") this.drawLens(ctx, sim);
    this.updateParticles(ctx, bc, realDt, speed);
    this.drawOverlays(ctx, sim, selected);

    if (sim.metrics.environment < 50) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(120,100,60,${((50 - sim.metrics.environment) / 50) * 0.25})`;
      ctx.fillRect(0, 0, w, h);
      ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * this.cam.x, dpr * this.cam.y);
    }

    if (night > 0.01 || (hour > 17 && hour < 19.5)) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dusk = hour > 17 && hour < 20 ? Math.sin(((hour - 17) / 3) * Math.PI) : 0;
      if (dusk > 0) {
        ctx.fillStyle = `rgba(255,140,60,${dusk * 0.14})`;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = `rgba(12,20,55,${night})`;
      ctx.fillRect(0, 0, w, h);
      ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * this.cam.x, dpr * this.cam.y);
      if (night > 0.08) this.drawLights(ctx, sim, bc, night);
    }
    this.drawLabels(ctx, sim);
  }

  private drawLens(ctx: CanvasRenderingContext2D, sim: Sim) {
    const blockOf = (x: number, y: number) => {
      const bx = Math.floor((x - 1.5) / 6);
      const by = Math.floor((y - 1.5) / 6);
      return bx >= 0 && by >= 0 && bx < BLOCKS && by < BLOCKS ? by * BLOCKS + bx : -1;
    };
    const sum = new Array(BLOCKS * BLOCKS).fill(0);
    const n = new Array(BLOCKS * BLOCKS).fill(0);
    if (this.lens === "mood") {
      for (const c of sim.citizens) {
        const h = sim.world.buildings[c.homeId];
        const b = blockOf(h.x, h.y);
        if (b >= 0) {
          sum[b] += c.mood;
          n[b]++;
        }
      }
    } else if (this.lens === "safety") {
      for (const e of sim.events) {
        if ((e.kind === "crime" || e.kind === "protest") && e.era >= sim.era - 1) {
          const b = blockOf(e.x, e.y);
          if (b >= 0) sum[b] += e.kind === "crime" ? 1 : 0.5;
        }
      }
    } else {
      for (const t of sim.world.trees) {
        const b = blockOf(t.x, t.y);
        if (b >= 0) sum[b]++;
      }
    }
    for (let b = 0; b < BLOCKS * BLOCKS; b++) {
      let v: number;
      if (this.lens === "mood") {
        if (!n[b]) continue;
        v = Math.max(0, Math.min(1, (sum[b] / n[b] - 35) / 45));
      } else if (this.lens === "safety") v = Math.max(0, 1 - sum[b] / 4);
      else v = Math.min(1, sum[b] / 12);
      const hue = v * 120;
      const x0 = 2 + (b % BLOCKS) * 6 - 0.5;
      const y0 = 2 + Math.floor(b / BLOCKS) * 6 - 0.5;
      poly(ctx, [iso(x0, y0), iso(x0 + 6, y0), iso(x0 + 6, y0 + 6), iso(x0, y0 + 6)], `hsla(${hue},80%,50%,0.38)`, "rgba(255,255,255,0.25)", 1);
    }
  }

  private drawBuildingSprite(ctx: CanvasRenderingContext2D, sim: Sim, b: Building, bc: BuildCtx, hl: 0 | 1 | 2, working: boolean) {
    let sp = this.sprites.get(b.id);
    if (!sp || sp.key !== spriteKey(b)) {
      sp = buildSprite(b, 1.75);
      this.sprites.set(b.id, sp);
    }
    ctx.drawImage(sp.canvas, sp.x, sp.y, sp.w, sp.h);
    if (bc.night > 0.05 && !b.closed) {
      const p = litProb(sim.hour, HOME_KINDS.has(b.kind));
      const hb = Math.floor(sim.hour);
      sp.windows.forEach((q, i) => {
        if (hash(b.seed, i, hb) < p) bc.lit.push(q);
      });
      for (const l of sp.lamps) bc.glows.push({ x: l[0], y: l[1], r: 14, color: "255,210,140" });
      if (b.kind === "community" && sim.culture.community > 60) {
        const c = iso(b.x + b.w / 2, b.y + b.h / 2, buildingHeight(b));
        bc.glows.push({ x: c[0], y: c[1], r: 60, color: "255,190,120" });
      }
    }
    if (working && !b.closed) for (const e of sp.emitters) bc.emitters.push(e);
    if (b.born > 0 && sim.era - b.born <= 1) {
      const p = iso(b.x + b.w / 2, b.y + b.h / 2, buildingHeight(b) + 26 + Math.sin(this.time * 4) * 3);
      ctx.font = "14px 'Segoe UI Emoji', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨", p[0], p[1]);
      ctx.textBaseline = "alphabetic";
    }
    if (hl) poly(ctx, buildingHull(b), undefined, hl === 2 ? "#ffd84a" : "rgba(255,255,255,0.85)", hl === 2 ? 3 : 1.5);
  }

  private drawLabels(ctx: CanvasRenderingContext2D, sim: Sim) {
    if (!this.labels) {
      const groups = new Map<DistrictId, [number, number][]>();
      for (let by = 0; by < BLOCKS; by++) {
        for (let bx = 0; bx < BLOCKS; bx++) {
          const cx = 4.5 + bx * 6;
          const cy = 4.5 + by * 6;
          const d = sim.world.district[idx(Math.floor(cx), Math.floor(cy))];
          groups.set(d, [...(groups.get(d) ?? []), [cx, cy]]);
        }
      }
      const islandLabel = { x: (ISLAND_X0 + ISLAND_X1) / 2, y: (ISLAND_Y0 + ISLAND_Y1) / 2, text: "EAST ISLAND" };
      this.labels = [...groups.entries()].map(([d, pts]) => {
        const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        const [bx, by] = pts.sort((a, b) => Math.hypot(a[0] - mx, a[1] - my) - Math.hypot(b[0] - mx, b[1] - my))[0];
        return { x: bx, y: by, text: DISTRICT_NAMES[d].toUpperCase() };
      });
      this.labels.push(islandLabel);
    }
    const island = this.labels[this.labels.length - 1];
    island.text = sim.world.flags.has("bridge") ? "HARBORVIEW" : "EAST ISLAND · UNDEVELOPED";
    if (this.cam.zoom > 1.25) return;
    const { dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = "800 10.5px 'Inter', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const alpha = Math.min(1, (1.25 - this.cam.zoom) * 3);
    for (const l of this.labels) {
      const [sx, sy] = this.toScreen(iso(l.x, l.y, 150));
      const tw = ctx.measureText(l.text).width + 18;
      ctx.globalAlpha = alpha * 0.92;
      ctx.fillStyle = "rgba(14,19,30,0.82)";
      ctx.beginPath();
      ctx.roundRect(sx - tw / 2, sy - 10, tw, 20, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,216,74,0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#f4f1e8";
      ctx.fillText(l.text, sx, sy + 0.5);
    }
    ctx.globalAlpha = 1;
    ctx.textBaseline = "alphabetic";
  }

  private drawLights(ctx: CanvasRenderingContext2D, sim: Sim, bc: BuildCtx, night: number) {
    const k = night / 0.55;
    ctx.globalCompositeOperation = "lighter";
    for (const q of bc.lit) poly(ctx, q, `rgba(255,200,110,${0.75 * k})`);
    for (const p of sim.world.props) {
      if (p.kind !== "streetlight") continue;
      const [lx, ly] = iso(p.x + 0.15, p.y + 0.15, 30);
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 46);
      g.addColorStop(0, `rgba(255,210,140,${0.45 * k})`);
      g.addColorStop(1, "rgba(255,210,140,0)");
      ctx.fillStyle = g;
      ctx.fillRect(lx - 46, ly - 46, 92, 92);
    }
    for (const gl of bc.glows) {
      const g = ctx.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r);
      g.addColorStop(0, `rgba(${gl.color},${0.4 * k})`);
      g.addColorStop(1, `rgba(${gl.color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(gl.x - gl.r, gl.y - gl.r, gl.r * 2, gl.r * 2);
    }
    for (const car of this.cars) {
      const [cx, cy] = this.carPos(car);
      const [px, py] = iso(cx, cy, 4);
      const g = ctx.createRadialGradient(px, py, 0, px, py, 14);
      g.addColorStop(0, `rgba(255,240,200,${0.5 * k})`);
      g.addColorStop(1, "rgba(255,240,200,0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - 14, py - 14, 28, 28);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  private drawTree(ctx: CanvasRenderingContext2D, t: Tree, sim: Sim) {
    const grow = t.planted ? Math.min(1, 0.35 + (sim.absHour - t.born) / 30) : 1;
    const [px, py] = iso(t.x + 0.5 + t.jx, t.y + 0.5 + t.jy);
    const s = grow * (0.9 + ((t.x * 7 + t.y * 13) % 5) * 0.05);
    const env = sim.metrics.environment;
    const sway = Math.sin(this.time * 1.5 + t.x + t.y) * 1.2 * s;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(px + 3, py, 11 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b4a2f";
    ctx.fillRect(px - 1.5 * s, py - 12 * s, 3 * s, 12 * s);
    const hue = 85 + env * 0.4;
    const light = `hsl(${hue},${45 + env * 0.15}%,${40}%)`;
    const dark = `hsl(${hue + 8},${45 + env * 0.1}%,${29}%)`;
    if (t.pine) {
      for (let k = 0; k < 3; k++) {
        const yb = py - 8 * s - k * 8 * s;
        const wd = (13 - k * 3.5) * s;
        poly(ctx, [[px - wd + sway, yb], [px + wd + sway, yb], [px + sway, yb - 14 * s]], k % 2 ? light : dark);
      }
    } else {
      const circ = (dx: number, dy: number, r: number, c: string) => {
        ctx.beginPath();
        ctx.arc(px + dx * s + sway, py + dy * s, r * s, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
      };
      circ(-4, -18, 8, dark);
      circ(5, -19, 7.5, dark);
      circ(0, -25, 9, light);
      circ(-3, -21, 5, light);
    }
  }

  private drawCitizen(ctx: CanvasRenderingContext2D, c: Citizen, sim: Sim, selected: Pick) {
    const [px, py] = iso(c.x + c.ox * 0.5, c.y + c.oy * 0.5);
    const moving = c.path.length > 0;
    const scale = c.ageBand === "youth" ? 0.82 : c.ageBand === "elder" ? 0.92 : 1;
    const swingMul = c.ageBand === "elder" ? 0.6 : 1;
    const swing = moving ? Math.sin(c.walkPhase) * 3 * swingMul : 0;
    const bob = moving ? Math.abs(Math.cos(c.walkPhase)) * 1.2 * scale : 0;
    const isSel = selected?.type === "citizen" && selected.id === c.id;
    if (isSel) {
      ctx.beginPath();
      ctx.ellipse(px, py, 11, 5.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffd84a";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(px, py, 5.5 * scale, 2.6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    const legTop = py - 7 * scale - bob;
    line(ctx, [px - 1.6 * scale, legTop], [px - 1.6 * scale + swing, py], "#2b2b33", 2.2);
    line(ctx, [px + 1.6 * scale, legTop], [px + 1.6 * scale - swing, py], "#2b2b33", 2.2);
    if (c.accessory === "backpack") {
      ctx.fillStyle = "#5a8a4a";
      ctx.beginPath();
      ctx.roundRect(px - 3 * scale, py - 18 * scale - bob, 4 * scale, 8 * scale, 2);
      ctx.fill();
    }
    ctx.fillStyle = c.shirt;
    ctx.beginPath();
    ctx.roundRect(px - 4 * scale, py - 17 * scale - bob, 8 * scale, 11 * scale, 3);
    ctx.fill();
    if (c.accessory === "vest") {
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(px - 4 * scale, py - 17 * scale - bob, 8 * scale, 4 * scale);
    } else if (c.accessory === "coat") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py - 17 * scale - bob);
      ctx.lineTo(px, py - 6 * scale - bob);
      ctx.stroke();
    } else if (c.accessory === "badge") {
      ctx.fillStyle = "#d9b44a";
      ctx.fillRect(px - 2.5, py - 15 * scale - bob, 2, 2);
    }
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(px, py - 20.5 * scale - bob, 3.6 * scale, 0, Math.PI * 2);
    ctx.fill();
    if (c.accessory === "helmet") {
      ctx.fillStyle = "#d8433b";
      ctx.beginPath();
      ctx.arc(px, py - 22 * scale - bob, 3.9 * scale, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(px - 3.9 * scale, py - 22 * scale - bob, 7.8 * scale, 1.4);
    } else {
      ctx.fillStyle = c.hair;
      ctx.beginPath();
      ctx.arc(px, py - 21.5 * scale - bob, 3.7 * scale, Math.PI, 0);
      ctx.fill();
    }
    if (c.activity === "protest") {
      line(ctx, [px + 5, py - 12], [px + 5, py - 34], "#6b4a2f", 1.5);
      ctx.fillStyle = "#fff8e6";
      ctx.fillRect(px - 2, py - 42, 14, 9);
      ctx.fillStyle = "#d8433b";
      ctx.font = "800 8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NO!", px + 5, py - 35);
    } else if (sim.params.internet && !moving && c.prop.scroll > 0.45) {
      ctx.fillStyle = "#9fd8ff";
      ctx.fillRect(px + 3, py - 17, 3, 4.5);
    }
    if (isSel) {
      ctx.font = "700 11px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      const tw = ctx.measureText(c.name).width + 10;
      ctx.fillStyle = "rgba(20,24,34,0.85)";
      ctx.beginPath();
      ctx.roundRect(px - tw / 2, py - 44, tw, 16, 5);
      ctx.fill();
      ctx.fillStyle = "#ffd84a";
      ctx.fillText(c.name, px, py - 32);
    }
  }

  private drawProp(ctx: CanvasRenderingContext2D, p: Prop, sim: Sim, bc: BuildCtx) {
    switch (p.kind) {
      case "streetlight": {
        const base = iso(p.x + 0.15, p.y + 0.15);
        line(ctx, base, [base[0], base[1] - 30], "#3b3f47", 2);
        ctx.fillStyle = bc.night > 0.08 ? "#ffe7a8" : "#d9dde2";
        ctx.beginPath();
        ctx.arc(base[0], base[1] - 31, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "billboard": {
        const community = sim.culture.community >= 55 || sim.world.flags.has("noticeboards");
        if (!sim.params.ads && !community) break;
        const a = iso(p.x + 0.2, p.y + 0.5);
        const b = iso(p.x + 0.8, p.y + 0.5);
        line(ctx, a, [a[0], a[1] - 30], "#4b4f57", 2);
        line(ctx, b, [b[0], b[1] - 30], "#4b4f57", 2);
        const panel: Pt[] = [
          [a[0] - 4, a[1] - 26],
          [b[0] + 4, b[1] - 26],
          [b[0] + 4, b[1] - 48],
          [a[0] - 4, a[1] - 48],
        ];
        if (sim.params.ads) {
          const [text, bg, fg] = ADS[p.variant % ADS.length];
          poly(ctx, panel, bg, "#222", 1);
          ctx.save();
          ctx.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 37);
          ctx.transform(1, 0.5, 0, 1, 0, 0);
          ctx.fillStyle = fg;
          ctx.font = "800 8px 'Segoe UI', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, 0, 0);
          ctx.restore();
          bc.glows.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 - 37, r: 22, color: "255,255,255" });
        } else {
          poly(ctx, panel, "#5b7b4a", "#3a4a30", 1);
          const notes = ["#fff3b0", "#ffd6e0", "#cdeaff", "#e2f0cb"];
          for (let k = 0; k < 5; k++) {
            const t = 0.12 + k * 0.17;
            const nx = a[0] - 4 + (b[0] - a[0] + 8) * t;
            const ny = a[1] - 44 + (b[1] - a[1]) * t + (k % 2) * 7;
            ctx.fillStyle = notes[k % 4];
            ctx.fillRect(nx, ny, 5, 5);
          }
        }
        break;
      }
      case "noticeboard": {
        const a = iso(p.x + 0.3, p.y + 0.5);
        const b = iso(p.x + 0.7, p.y + 0.5);
        line(ctx, a, [a[0], a[1] - 18], "#6b4a2f", 2);
        line(ctx, b, [b[0], b[1] - 18], "#6b4a2f", 2);
        poly(ctx, [[a[0] - 2, a[1] - 14], [b[0] + 2, b[1] - 14], [b[0] + 2, b[1] - 30], [a[0] - 2, a[1] - 30]], "#b98a5a", "#6b4a2f");
        const notes = ["#fff", "#fff3b0", "#ffd6e0"];
        for (let k = 0; k < 4; k++) {
          ctx.fillStyle = notes[k % 3];
          ctx.fillRect(a[0] + k * 6, a[1] - 26 + (k % 2) * 5 + k * 3, 5, 5);
        }
        break;
      }
      case "bench": {
        const a = iso(p.x + 0.3, p.y + 0.5);
        const b = iso(p.x + 0.7, p.y + 0.5);
        line(ctx, [a[0], a[1] - 5], [b[0], b[1] - 5], "#8a5a35", 3);
        line(ctx, [a[0], a[1] - 9], [b[0], b[1] - 9], "#6b4428", 2);
        line(ctx, [a[0], a[1] - 5], [a[0], a[1]], "#333", 1);
        line(ctx, [b[0], b[1] - 5], [b[0], b[1]], "#333", 1);
        break;
      }
      case "fountain": {
        const c = iso(p.x + 0.5, p.y + 0.5);
        ctx.beginPath();
        ctx.ellipse(c[0], c[1], 22, 11, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#c9c2b3";
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c[0], c[1] - 2, 18, 8.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#5fb0d8";
        ctx.fill();
        for (let k = 0; k < 5; k++) {
          const ph = (this.time * 1.5 + k / 5) % 1;
          ctx.fillStyle = `rgba(230,245,255,${1 - ph})`;
          ctx.beginPath();
          ctx.arc(c[0] + Math.cos(k * 1.3) * 8 * ph, c[1] - 6 - Math.sin(ph * Math.PI) * 16, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case "stall": {
        const c = iso(p.x + 0.5, p.y + 0.5);
        box(ctx, p.x + 0.25, p.y + 0.3, 0.5, 0.4, 0, 8, "#a0764a");
        const cols = ["#d8433b", "#3d6fb6", "#3fa06a"];
        poly(ctx, [[c[0] - 16, c[1] - 18], [c[0] + 16, c[1] - 18], [c[0] + 12, c[1] - 26], [c[0] - 12, c[1] - 26]], cols[p.variant % 3]);
        if (sim.world.flags.has("tokens")) {
          ctx.font = "10px 'Segoe UI Emoji', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("🔁", c[0], c[1] - 30);
        }
        break;
      }
      case "hydrant": {
        const base = iso(p.x + 0.5, p.y + 0.5);
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(base[0] - 2.5, base[1] - 9, 5, 9);
        ctx.beginPath();
        ctx.arc(base[0], base[1] - 9, 2.6, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#8e2a1f";
        ctx.fillRect(base[0] - 3.5, base[1] - 5, 7, 1.6);
        ctx.fillRect(base[0] - 1, base[1] - 9, 2, 1.4);
        break;
      }
      case "bikerack": {
        const a = iso(p.x + 0.25, p.y + 0.5);
        const b = iso(p.x + 0.75, p.y + 0.5);
        ctx.strokeStyle = "#4a5058";
        ctx.lineWidth = 1.6;
        for (const [sx] of [[a[0]], [(a[0] + b[0]) / 2], [b[0]]]) {
          ctx.beginPath();
          ctx.arc(sx, a[1] - 5, 4.5, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
      case "bin": {
        const base = iso(p.x + 0.5, p.y + 0.5);
        const recycle = p.variant === 1;
        ctx.fillStyle = recycle ? "#2f7d4f" : "#3c4048";
        ctx.fillRect(base[0] - 3, base[1] - 7, 6, 7);
        ctx.fillStyle = recycle ? "#255f3d" : "#2b2e34";
        ctx.fillRect(base[0] - 3.4, base[1] - 7.6, 6.8, 1.4);
        if (recycle) {
          ctx.font = "6px sans-serif";
          ctx.fillStyle = "#dff5e6";
          ctx.textAlign = "center";
          ctx.fillText("♻", base[0], base[1] - 2.5);
        }
        break;
      }
      case "crane": {
        const base = iso(p.x + 0.5, p.y + 0.5);
        const top: Pt = [base[0], base[1] - 90];
        line(ctx, [base[0] - 5, base[1]], [top[0] - 3, top[1]], "#e0a82e", 2);
        line(ctx, [base[0] + 5, base[1]], [top[0] + 3, top[1]], "#e0a82e", 2);
        for (let k = 1; k < 9; k++) line(ctx, [base[0] - 5 + k * 0.25, base[1] - k * 10], [base[0] + 5 - k * 0.25, base[1] - k * 10 - 6], "#c48f1c", 1);
        const dir = p.variant ? -1 : 1;
        line(ctx, top, [top[0] + dir * 60, top[1] + 10], "#e0a82e", 3);
        line(ctx, top, [top[0] - dir * 18, top[1] + 4], "#e0a82e", 3);
        const hook: Pt = [top[0] + dir * (30 + Math.sin(this.time * 0.4) * 20), top[1] + 6];
        line(ctx, hook, [hook[0], hook[1] + 30], "#333", 1);
        ctx.fillStyle = ["#d8433b", "#3d6fb6"][p.variant % 2];
        ctx.fillRect(hook[0] - 7, hook[1] + 30, 14, 7);
        break;
      }
    }
  }

  private carPos(car: Car): [number, number] {
    const lane = car.dir > 0 ? 0.24 : -0.24;
    return car.axis === 0 ? [car.pos, car.line + 0.5 + lane] : [car.line + 0.5 - lane, car.pos];
  }

  private updateCars(sim: Sim, dt: number, speed: number) {
    const h = sim.hour;
    const busy = h > 7 && h < 21;
    const target = Math.round((busy ? 16 + sim.metrics.economy / 4 : 7) * (sim.phase === "running" ? 1 : 0.6));
    while (this.cars.length < target) {
      const axis = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
      const line = ROADS[Math.floor(Math.random() * ROADS.length)];
      const pos = 1.5 + Math.random() * (LAST_ROAD - 2);
      const sampleX = axis === 0 ? Math.floor(pos) : line;
      const sampleY = axis === 0 ? line : Math.floor(pos);
      const d = sim.world.district[Math.min(sim.world.tiles.length - 1, Math.max(0, sampleY * S + sampleX))];
      const kind = pickVehicleKind(d, Math.random);
      this.cars.push({
        axis,
        line,
        pos,
        dir: Math.random() < 0.5 ? 1 : -1,
        speed: (kind === "bike" ? 1.1 : kind === "truck" ? 1.3 : 1.6) + Math.random() * 1.2,
        color: kind === "bike" ? "#2b2f36" : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
        lastTurn: -1,
        kind,
      });
    }
    if (this.cars.length > target + 2) this.cars.splice(target);
    const f = sim.phase === "running" ? Math.min(3, Math.max(0.6, speed)) : 0.5;
    for (const car of this.cars) {
      const prev = car.pos;
      car.pos += car.dir * car.speed * dt * f;
      for (const r of ROADS) {
        const c = r + 0.5;
        if ((prev - c) * (car.pos - c) <= 0 && car.lastTurn !== r && r !== car.line && Math.random() < 0.35) {
          const oldLine = car.line;
          car.axis = car.axis === 0 ? 1 : 0;
          car.line = r;
          car.pos = oldLine + 0.5;
          car.dir = Math.random() < 0.5 ? 1 : -1;
          car.lastTurn = oldLine;
          break;
        }
      }
      const maxPos = car.axis === 0 && car.line === BRIDGE_Y && sim.world.flags.has("bridge") ? ISLAND_X0 + 0.5 : LAST_ROAD + 0.5;
      if (car.pos < 1.5 || car.pos > maxPos) {
        car.dir = car.pos < 1.5 ? 1 : -1;
        car.pos = Math.max(1.5, Math.min(maxPos, car.pos));
      }
    }
  }

  private drawCar(ctx: CanvasRenderingContext2D, car: Car, night: number) {
    const [cx, cy] = this.carPos(car);
    if (car.kind === "bike") {
      const p = iso(cx, cy, 3);
      ctx.strokeStyle = "#1c1e24";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(p[0] - 3, p[1] + 2, 3, 0, Math.PI * 2);
      ctx.arc(p[0] + 3, p[1] + 2, 3, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, [p[0] - 3, p[1] + 2], [p[0] + 1, p[1] - 3], "#1c1e24", 1.4);
      line(ctx, [p[0] + 3, p[1] + 2], [p[0] + 1, p[1] - 3], "#1c1e24", 1.4);
      ctx.fillStyle = "#c88a4a";
      ctx.beginPath();
      ctx.arc(p[0] + 1, p[1] - 7, 2.4, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const scale = car.kind === "truck" ? 1.5 : car.kind === "van" ? 1.2 : 1;
    const lw = (car.axis === 0 ? 0.55 : 0.3) * scale;
    const lh = (car.axis === 0 ? 0.3 : 0.55) * scale;
    const height = car.kind === "truck" ? 11 : car.kind === "van" ? 9 : 6;
    box(ctx, cx - lw / 2, cy - lh / 2, lw, lh, 0, height, car.color);
    if (car.kind === "van" || car.kind === "truck") {
      box(ctx, cx - lw * 0.42, cy - lh * 0.42, lw * 0.28, lh * 0.28, height, 4, "#c9dcea");
    } else {
      box(ctx, cx - lw / 4, cy - lh / 4, lw / 2, lh / 2, height, 4, "#2b3440", "#7fa2c0");
    }
    if (night > 0.1) {
      const p = iso(cx, cy, height - 1);
      ctx.fillStyle = "#fff4c8";
      ctx.fillRect(p[0] - 1, p[1] - 1, 2, 2);
    }
  }

  private updateParticles(ctx: CanvasRenderingContext2D, bc: BuildCtx, dt: number, speed: number) {
    this.emitTimer += dt * Math.max(0.5, Math.min(3, speed));
    if (this.emitTimer > 0.3) {
      this.emitTimer = 0;
      for (const e of bc.emitters) {
        this.particles.push({ x: e.x, y: e.y, age: 0, life: e.kind === "steam" ? 3 : 3.8, kind: e.kind, vx: 5 + Math.random() * 4 });
      }
    }
    for (const p of this.particles) {
      p.age += dt;
      p.y -= 12 * dt;
      p.x += p.vx * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    if (this.particles.length > 220) this.particles.splice(0, this.particles.length - 220);
    for (const p of this.particles) {
      const t = p.age / p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + t * 9, 0, Math.PI * 2);
      ctx.fillStyle = p.kind === "steam" ? `rgba(250,250,250,${0.5 * (1 - t)})` : `rgba(110,110,115,${0.45 * (1 - t)})`;
      ctx.fill();
    }
  }

  private drawOverlays(ctx: CanvasRenderingContext2D, sim: Sim, selected: Pick) {
    for (const e of sim.effects) {
      const age = sim.absHour - e.t;
      const t = age / 0.6;
      if (t > 1) continue;
      const [px, py] = iso(e.x, e.y);
      if (e.kind === "alert") {
        ctx.beginPath();
        ctx.ellipse(px, py, 10 + t * 40, (10 + t * 40) / 2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(230,50,50,${1 - t})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        const icon = e.kind === "heart" ? "💗" : e.kind === "leaf" ? "🌿" : e.kind === "star" ? "⭐" : "✨";
        ctx.globalAlpha = 1 - t;
        ctx.font = "12px 'Segoe UI Emoji', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(icon, px + Math.sin(t * 6) * 4, py - 30 - t * 30);
        ctx.globalAlpha = 1;
      }
    }

    const minor = new Set(["💬", "🛍️", "📱", "🗳️"]);
    for (const c of sim.citizens) {
      if (!c.bubble) continue;
      const age = sim.absHour - c.bubble.t;
      if (age > 0.5) continue;
      if (c.inside !== null && minor.has(c.bubble.icon)) continue;
      if (this.cam.zoom < 0.55 && minor.has(c.bubble.icon)) continue;
      const [px, py] = iso(c.x + c.ox * 0.5, c.y + c.oy * 0.5);
      const a = Math.min(1, (0.5 - age) * 6) * Math.min(1, age * 20);
      ctx.globalAlpha = a * (minor.has(c.bubble.icon) ? 0.75 : 1);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(px, py - 36, 9, 0, Math.PI * 2);
      ctx.fill();
      poly(ctx, [[px - 3, py - 29], [px + 3, py - 29], [px, py - 25]], "rgba(255,255,255,0.95)");
      ctx.font = "11px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.bubble.icon, px, py - 36);
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 1;
    }

    if (selected?.type === "citizen") {
      const c = sim.citizens[selected.id];
      if (c.inside !== null) {
        const b = sim.world.buildings[c.inside];
        const [px, py] = iso(b.x + b.w / 2, b.y + b.h / 2, 0);
        const top = py - (b.floors * 16 + 40) - Math.abs(Math.sin(this.time * 3)) * 6;
        poly(ctx, [[px - 8, top - 14], [px + 8, top - 14], [px, top]], "#ffd84a", "#6b5200", 1.5);
        ctx.font = "700 11px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        const label = `${c.name} is inside`;
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle = "rgba(20,24,34,0.85)";
        ctx.beginPath();
        ctx.roundRect(px - tw / 2, top - 34, tw, 16, 5);
        ctx.fill();
        ctx.fillStyle = "#ffd84a";
        ctx.fillText(label, px, top - 22);
      }
    }
  }
}
