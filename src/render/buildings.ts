import type { Building, BuildingKind } from "../sim/types";
import { TH, TW, hash, iso, line, poly, shade } from "./draw";
import type { Pt } from "./draw";

export interface BuildCtx {
  windows: Pt[][];
  emitters: { x: number; y: number; kind: "smoke" | "steam" }[];
  lamps: Pt[];
}

export interface Sprite {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  w: number;
  h: number;
  windows: Pt[][];
  emitters: BuildCtx["emitters"];
  lamps: Pt[];
  key: string;
}

type Material = "brick" | "concrete" | "stone" | "siding" | "glass" | "metal";

const FLOOR_H: Partial<Record<BuildingKind, number>> = {
  house: 18,
  apartment: 14,
  office: 13,
  cityhall: 17,
  factory: 17,
  warehouse: 17,
  kiosk: 12,
  grocery: 20,
  mall: 17,
  police: 15,
  firestation: 18,
  hospital: 14,
  stadium: 22,
  theatre: 16,
  skyscraper: 13,
  themepark: 12,
  lighthouse: 16,
};

const MATERIAL: Record<BuildingKind, Material> = {
  house: "siding",
  apartment: "concrete",
  shop: "brick",
  mall: "concrete",
  cafe: "brick",
  restaurant: "brick",
  grocery: "concrete",
  office: "glass",
  bank: "stone",
  media: "concrete",
  techco: "glass",
  cinema: "concrete",
  factory: "brick",
  warehouse: "metal",
  power: "concrete",
  school: "brick",
  university: "brick",
  library: "stone",
  lab: "concrete",
  community: "brick",
  cityhall: "stone",
  kiosk: "siding",
  boutique: "stone",
  repair: "brick",
  workshop: "siding",
  police: "concrete",
  firestation: "brick",
  hospital: "concrete",
  terminal: "glass",
  stadium: "concrete",
  theatre: "stone",
  skyscraper: "glass",
  themepark: "siding",
  lighthouse: "stone",
};

const EMBLEM: Partial<Record<BuildingKind, string>> = {
  cafe: "☕",
  restaurant: "🍝",
  shop: "🛍️",
  boutique: "💎",
  repair: "🔧",
  workshop: "🛠️",
  cinema: "🎬",
  library: "📚",
  lab: "🔬",
  community: "🤝",
  media: "📡",
  techco: "💡",
  factory: "⚙️",
  warehouse: "📦",
  power: "⚡",
  school: "✏️",
  university: "🎓",
  police: "🚓",
  firestation: "🚒",
  hospital: "🏥",
  terminal: "✈️",
  stadium: "⚽",
  theatre: "🎭",
  themepark: "🎡",
};

const STOREFRONT: ReadonlySet<BuildingKind> = new Set<BuildingKind>(["shop", "cafe", "restaurant", "boutique", "repair", "workshop"]);

export function buildingHeight(b: Building): number {
  return b.floors * (FLOOR_H[b.kind] ?? 15);
}

export function buildingHull(b: Building): Pt[] {
  const H = buildingHeight(b) + (b.kind === "cityhall" ? 60 : b.kind === "house" ? 14 : 8);
  const { x, y, w, h } = b;
  return [iso(x, y + h), iso(x + w, y + h), iso(x + w, y), iso(x + w, y, H), iso(x, y, H), iso(x, y + h, H)];
}

export function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  z: number,
  height: number,
  color: string,
  top?: string,
) {
  const W = iso(x, y + h, z);
  const S = iso(x + w, y + h, z);
  const E = iso(x + w, y, z);
  const N = iso(x, y, z);
  const up = (p: Pt): Pt => [p[0], p[1] - height];
  poly(ctx, [W, S, up(S), up(W)], shade(color, -0.04));
  poly(ctx, [S, E, up(E), up(S)], shade(color, -0.25));
  poly(ctx, [up(N), up(E), up(S), up(W)], top ?? shade(color, 0.12));
  line(ctx, up(W), up(S), "rgba(255,255,255,0.18)", 0.6);
  line(ctx, up(S), up(E), "rgba(255,255,255,0.1)", 0.6);
}

function faceText(ctx: CanvasRenderingContext2D, text: string, p: Pt, face: "L" | "R", size: number, color: string, weight = 700) {
  ctx.save();
  ctx.translate(p[0], p[1]);
  ctx.transform(1, face === "L" ? 0.5 : -0.5, 0, 1, 0, 0);
  ctx.font = `${weight} ${size}px 'Inter', 'Segoe UI', system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function emoji(ctx: CanvasRenderingContext2D, e: string, p: Pt, size: number) {
  ctx.font = `${size}px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(e, p[0], p[1]);
}

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function inset(q: Pt[], k: number): Pt[] {
  const c: Pt = [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
  return q.map((p) => lerp(p, c, k));
}

export function buildSprite(b: Building, scale: number): Sprite {
  const hull = buildingHull(b);
  const xs = hull.map((p) => p[0]);
  const ys = hull.map((p) => p[1]);
  const minX = Math.min(...xs) - 34;
  const maxX = Math.max(...xs) + 34;
  const minY = Math.min(...ys) - 70;
  const maxY = Math.max(...ys) + 16;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((maxX - minX) * scale);
  canvas.height = Math.ceil((maxY - minY) * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);
  const bc: BuildCtx = { windows: [], emitters: [], lamps: [] };
  drawBuilding(ctx, b, bc);
  return {
    canvas,
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
    windows: bc.windows,
    emitters: bc.emitters,
    lamps: bc.lamps,
    key: spriteKey(b),
  };
}

export function spriteKey(b: Building): string {
  return `${b.closed}|${b.shared}|${b.name}|${b.floors}|${b.level}|${Math.round(b.condition * 5)}|${Math.round(b.construction * 8)}`;
}

export function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, bc: BuildCtx) {
  const { x, y, w, h, kind } = b;
  const H = buildingHeight(b);
  const N = iso(x, y);
  const E = iso(x + w, y);
  const S = iso(x + w, y + h);
  const W = iso(x, y + h);
  const up = (p: Pt, z: number): Pt => [p[0], p[1] - z];
  const L = (u: number, v: number): Pt => {
    const p = iso(x + u * w, y + h);
    return [p[0], p[1] - v * H];
  };
  const R = (u: number, v: number): Pt => {
    const p = iso(x + w, y + h - u * h);
    return [p[0], p[1] - v * H];
  };
  const quad = (f: (u: number, v: number) => Pt, u0: number, u1: number, v0: number, v1: number): Pt[] => [
    f(u0, v0),
    f(u1, v0),
    f(u1, v1),
    f(u0, v1),
  ];
  if (b.construction < 1) {
    drawConstruction(ctx, b, H);
    return;
  }
  if (kind === "lighthouse") {
    drawLighthouse(ctx, b, H, bc);
    return;
  }
  const closed = b.closed;
  const wall = closed ? "#8c8782" : b.wall;
  const accent = closed ? "#6f6a66" : b.accent;
  const mat = MATERIAL[kind];
  const rnd = (...k: number[]) => hash(b.seed, ...k);
  const faceLen = { L: w * 35.8, R: h * 35.8 };

  // Forecourt paving and contact shadow
  const pad = 0.14;
  poly(ctx, [iso(x - pad, y - pad), iso(x + w + pad, y - pad), iso(x + w + pad, y + h + pad), iso(x - pad, y + h + pad)], "rgba(214,206,190,0.55)");
  ctx.save();
  ctx.filter = "blur(5px)";
  poly(ctx, [S, E, [E[0] + 22, E[1] + 11], [S[0] + 22, S[1] + 11]], "rgba(15,25,20,0.28)");
  poly(ctx, [iso(x - 0.05, y + h + 0.08), iso(x + w + 0.08, y + h + 0.08), iso(x + w + 0.08, y - 0.05)], undefined, "rgba(10,15,10,0.35)", 5);
  ctx.restore();

  // Walls with light falloff
  const leftFace: Pt[] = [W, S, up(S, H), up(W, H)];
  const rightFace: Pt[] = [S, E, up(E, H), up(S, H)];
  poly(ctx, leftFace, shade(wall, -0.03));
  poly(ctx, rightFace, shade(wall, -0.26));
  for (const [face, dark] of [
    [leftFace, 0.05],
    [rightFace, 0.1],
  ] as const) {
    const g = ctx.createLinearGradient(face[0][0], face[0][1], face[3][0], face[3][1]);
    g.addColorStop(0, `rgba(0,0,0,${0.16 + dark})`);
    g.addColorStop(0.18, "rgba(0,0,0,0.02)");
    g.addColorStop(1, "rgba(255,245,225,0.08)");
    poly(ctx, face, g);
  }
  const hg = ctx.createLinearGradient(S[0], S[1], E[0], E[1]);
  hg.addColorStop(0, "rgba(0,0,0,0)");
  hg.addColorStop(1, "rgba(0,0,0,0.12)");
  poly(ctx, rightFace, hg);

  // Surface material
  const texture = (f: (u: number, v: number) => Pt, len: number) => {
    ctx.beginPath();
    const addLine = (a: Pt, c: Pt) => {
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(c[0], c[1]);
    };
    if (mat === "brick" || mat === "stone" || mat === "siding") {
      const course = mat === "brick" ? 3.6 : mat === "stone" ? 7 : 3.2;
      const joint = mat === "brick" ? 8 : 15;
      let row = 0;
      for (let z = course; z < H; z += course, row++) {
        const v = z / H;
        addLine(f(0, v), f(1, v));
        if (mat !== "siding" && row % 2 === 0) {
          for (let s = (row % 4 === 0 ? 0 : joint / 2) + joint; s < len; s += joint) {
            const u = s / len;
            addLine(f(u, v), f(u, v - course / H));
          }
        }
      }
      ctx.strokeStyle = mat === "brick" ? "rgba(60,30,20,0.16)" : mat === "stone" ? "rgba(70,60,45,0.13)" : "rgba(0,0,0,0.1)";
    } else if (mat === "concrete") {
      const panels = Math.max(2, Math.round(len / 18));
      for (let i = 1; i < panels; i++) addLine(f(i / panels, 0), f(i / panels, 1));
      for (let fl = 1; fl < b.floors; fl++) addLine(f(0, fl / b.floors), f(1, fl / b.floors));
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
    } else if (mat === "metal") {
      for (let s = 3; s < len; s += 3) addLine(f(s / len, 0), f(s / len, 1));
      ctx.strokeStyle = "rgba(0,0,0,0.09)";
    } else {
      for (let fl = 1; fl <= b.floors; fl++) addLine(f(0, fl / b.floors - 0.02), f(1, fl / b.floors - 0.02));
      ctx.strokeStyle = "rgba(40,55,70,0.35)";
    }
    ctx.lineWidth = 0.6;
    ctx.stroke();
  };
  texture(L, faceLen.L);
  texture(R, faceLen.R);

  // Weathering: rain streaks and base grime
  for (const [f, side] of [
    [L, 0],
    [R, 1],
  ] as const) {
    const streaks = 2 + Math.floor(rnd(side, 9) * 4);
    for (let k = 0; k < streaks; k++) {
      const u = 0.05 + rnd(side, k, 1) * 0.9;
      const top = f(u, 1);
      const bot = f(u, 1 - (0.15 + rnd(side, k, 2) * 0.35));
      const g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
      g.addColorStop(0, "rgba(40,35,30,0.16)");
      g.addColorStop(1, "rgba(40,35,30,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1 + rnd(side, k, 3) * 1.8;
      ctx.beginPath();
      ctx.moveTo(top[0], top[1]);
      ctx.lineTo(bot[0], bot[1]);
      ctx.stroke();
    }
  }
  line(ctx, S, up(S, H), "rgba(0,0,0,0.18)", 1);
  line(ctx, up(W, H), up(S, H), "rgba(255,255,255,0.25)", 0.8);

  // Windows: frame, glass with sky reflection, sill, mullions
  const windows = (face: "L" | "R", cols: number, rows: number, gw = 0.55, gh = 0.45, skipGround = false, tint?: string) => {
    const f = face === "L" ? L : R;
    const len = face === "L" ? faceLen.L : faceLen.R;
    for (let r = skipGround ? 1 : 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cu = (c + 0.5) / cols;
        const hw = gw / cols / 2;
        const v0 = (r + 0.3) / rows;
        const v1 = (r + 0.3 + gh) / rows;
        const outer = quad(f, cu - hw, cu + hw, v0, v1);
        if (closed) {
          poly(ctx, outer, "#5d4a3a");
          line(ctx, outer[0], outer[2], "#3b2f25", 1);
          line(ctx, outer[1], outer[3], "#3b2f25", 1);
          continue;
        }
        poly(ctx, outer, mat === "glass" ? "#3e4c5c" : "#e9e4d8");
        const glass = inset(outer, 0.16);
        const g = ctx.createLinearGradient(glass[3][0], glass[3][1], glass[0][0], glass[0][1]);
        const sky = tint ?? (face === "L" ? "#bcd6ea" : "#8fb0c8");
        g.addColorStop(0, sky);
        g.addColorStop(0.55, shade(sky, -0.28));
        g.addColorStop(1, shade(sky, -0.5));
        poly(ctx, glass, g);
        poly(ctx, [glass[3], lerp(glass[3], glass[2], 0.45), lerp(glass[0], glass[1], 0.15)], "rgba(255,255,255,0.22)");
        const widthPx = gw * (len / cols);
        if (widthPx > 7) line(ctx, lerp(glass[0], glass[1], 0.5), lerp(glass[3], glass[2], 0.5), "rgba(40,45,55,0.55)", 0.7);
        if (mat !== "glass") line(ctx, lerp(outer[0], outer[1], -0.08), lerp(outer[1], outer[0], -0.08), "rgba(245,240,230,0.9)", 1.3);
        bc.windows.push(glass);
      }
    }
  };

  const flatRoof = (color: string) => {
    const top: Pt[] = [up(N, H), up(E, H), up(S, H), up(W, H)];
    poly(ctx, top, color);
    for (let k = 0; k < 40; k++) {
      const p = iso(x + 0.1 + rnd(k, 1) * (w - 0.2), y + 0.1 + rnd(k, 2) * (h - 0.2), H);
      ctx.fillStyle = rnd(k, 3) > 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)";
      ctx.fillRect(p[0], p[1], 1.2, 1.2);
    }
    const ctr = iso(x + w / 2, y + h / 2, H);
    const inner = top.map((p) => lerp(p, ctr, 0.08));
    poly(ctx, inner, undefined, "rgba(0,0,0,0.18)", 1);
    line(ctx, top[3], top[2], "rgba(255,255,255,0.35)", 1.2);
    line(ctx, top[2], top[1], "rgba(255,255,255,0.2)", 1.2);
    if (w * h >= 4 && kind !== "cityhall") {
      box(ctx, x + w * 0.62, y + h * 0.18, 0.28, 0.2, H, 7, "#9aa1a8");
      box(ctx, x + w * 0.2, y + h * 0.55, 0.12, 0.12, H, 5, "#7d858e");
      const vent = iso(x + w * 0.35, y + h * 0.3, H);
      ctx.fillStyle = "#6b737c";
      ctx.fillRect(vent[0] - 1, vent[1] - 6, 2, 6);
    }
  };

  const canopy = (u = 0.5) => {
    const out: Pt = [(-TW / 2) * 0.16, (TH / 2) * 0.16];
    const vTop = Math.min(0.9, 20 / H);
    const a0 = L(u - 0.12, vTop);
    const a1 = L(u + 0.12, vTop);
    poly(ctx, quad(L, u - 0.08, u + 0.08, 0, vTop * 0.9), "#3a3f47");
    const gl = inset(quad(L, u - 0.08, u + 0.08, 0, vTop * 0.9), 0.12);
    poly(ctx, gl, "#8fb4cc");
    line(ctx, lerp(gl[0], gl[1], 0.5), lerp(gl[3], gl[2], 0.5), "#3a3f47", 0.8);
    poly(ctx, [a0, a1, [a1[0] + out[0], a1[1] + out[1]], [a0[0] + out[0], a0[1] + out[1]]], "#d9dde2", "rgba(0,0,0,0.25)", 0.6);
    for (const uu of [u - 0.15, u + 0.15]) {
      const p = L(uu, vTop * 0.75);
      ctx.fillStyle = "#2b2f36";
      ctx.fillRect(p[0] - 1, p[1] - 2, 2, 3);
      ctx.fillStyle = "#ffe0a0";
      ctx.fillRect(p[0] - 0.8, p[1] - 1.5, 1.6, 1.5);
      bc.lamps.push(p);
    }
  };

  const storefront = (va: number, awning = true) => {
    const frame = quad(L, 0.1, 0.9, 0.03, va * 0.92);
    poly(ctx, frame, "#2e2a27");
    const glass = inset(frame, 0.06);
    const g = ctx.createLinearGradient(glass[3][0], glass[3][1], glass[0][0], glass[0][1]);
    g.addColorStop(0, closed ? "#4a3f36" : "#c9dcea");
    g.addColorStop(1, closed ? "#2c241e" : "#6f8799");
    poly(ctx, glass, g);
    if (!closed) {
      poly(ctx, [glass[3], lerp(glass[3], glass[2], 0.35), lerp(glass[0], glass[1], 0.1)], "rgba(255,255,255,0.2)");
      bc.windows.push(glass);
    }
    poly(ctx, quad(L, 0.44, 0.56, 0.03, va * 0.8), shade(accent, -0.35));
    line(ctx, L(0.55, va * 0.4), L(0.55, va * 0.46), "#d9b44a", 1.2);
    if (closed) {
      line(ctx, glass[0], glass[2], "#2b221b", 1.5);
      line(ctx, glass[1], glass[3], "#2b221b", 1.5);
      return;
    }
    if (!awning) {
      // Clean modern front: a slim glass canopy instead of the striped fabric awning.
      const out: Pt = [(-TW / 2) * 0.14, (TH / 2) * 0.14];
      const e0 = L(0.06, va);
      const e1 = L(0.94, va);
      poly(ctx, [e0, e1, [e1[0] + out[0], e1[1] + out[1]], [e0[0] + out[0], e0[1] + out[1]]], "rgba(180,205,220,0.85)", "rgba(0,0,0,0.2)", 0.8);
      return;
    }
    const out: Pt = [(-TW / 2) * 0.24, (TH / 2) * 0.24];
    const n = 7;
    for (let k = 0; k < n; k++) {
      const u0 = 0.06 + (k * 0.88) / n;
      const u1 = 0.06 + ((k + 1) * 0.88) / n;
      const a0 = L(u0, va);
      const a1 = L(u1, va);
      poly(ctx, [a0, a1, [a1[0] + out[0], a1[1] + out[1] + 6], [a0[0] + out[0], a0[1] + out[1] + 6]], k % 2 ? "#f6f1e7" : accent);
    }
    const e0 = L(0.06, va);
    const e1 = L(0.94, va);
    line(ctx, [e0[0] + out[0], e0[1] + out[1] + 6], [e1[0] + out[0], e1[1] + out[1] + 6], "rgba(0,0,0,0.3)", 1);
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.filter = "blur(2px)";
    poly(ctx, [L(0.06, va - 0.02), L(0.94, va - 0.02), L(0.94, va - 0.2), L(0.06, va - 0.2)], "#000");
    ctx.restore();
  };

  switch (kind) {
    case "house": {
      windows("R", 1, 1, 0.42, 0.45);
      poly(ctx, quad(L, 0.2, 0.4, 0, 0.62), "#f1ece2");
      poly(ctx, quad(L, 0.22, 0.38, 0, 0.58), shade(b.roof, -0.35));
      ctx.fillStyle = "#d9b44a";
      const knob = L(0.35, 0.3);
      ctx.fillRect(knob[0] - 0.7, knob[1] - 0.7, 1.4, 1.4);
      windows("L", 1, 1, 0.32, 0.42);
      const lamp = L(0.44, 0.55);
      bc.lamps.push(lamp);
      const rh = 15;
      const roof = b.shared ? "#35a39a" : b.roof;
      const roofStyle = rnd(0, 90);
      if (roofStyle < 0.55) {
        // Classic gable, ridge running the length of the house.
        const A = iso(x, y + h / 2, H + rh);
        const B = iso(x + w, y + h / 2, H + rh);
        const eW = iso(x - 0.06, y + h + 0.06, H - 1);
        const eS = iso(x + w + 0.06, y + h + 0.06, H - 1);
        poly(ctx, [up(N, H), up(E, H), B, A], shade(roof, -0.25));
        poly(ctx, [eW, eS, B, A], roof);
        ctx.beginPath();
        for (let t = 0.14; t < 1; t += 0.14) {
          const a = lerp(eW, A, t);
          const c = lerp(eS, B, t);
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(c[0], c[1]);
        }
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
        line(ctx, eW, eS, "rgba(0,0,0,0.35)", 1.2);
        line(ctx, A, B, shade(roof, 0.2), 1.4);
        poly(ctx, [up(E, H), up(S, H), B], shade(wall, -0.3));
        box(ctx, x + 0.62, y + 0.2, 0.14, 0.14, H + 6, 13, "#8a5a45");
      } else if (roofStyle < 0.8) {
        // Hip roof: all four sides slope to a single apex.
        const apex = iso(x + w / 2, y + h / 2, H + rh);
        poly(ctx, [up(N, H), up(E, H), apex], shade(roof, -0.15));
        poly(ctx, [up(E, H), up(S, H), apex], shade(roof, -0.3));
        poly(ctx, [up(S, H), up(W, H), apex], shade(roof, 0.06));
        poly(ctx, [up(W, H), up(N, H), apex], shade(roof, -0.08));
        line(ctx, up(N, H), apex, "rgba(0,0,0,0.2)", 0.8);
        line(ctx, up(E, H), apex, "rgba(0,0,0,0.2)", 0.8);
        box(ctx, x + 0.62, y + 0.2, 0.14, 0.14, H + 6, 10, "#8a5a45");
      } else {
        // Flat modern roof with a low parapet and a small rail.
        const top = [up(N, H + 4), up(E, H + 4), up(S, H + 4), up(W, H + 4)];
        poly(ctx, top, shade(roof, 0.15));
        line(ctx, up(W, H + 4), up(S, H + 4), shade(roof, -0.2), 1.4);
        line(ctx, up(S, H + 4), up(E, H + 4), shade(roof, -0.35), 1.4);
        line(ctx, up(N, H), up(N, H + 4), shade(wall, -0.1), 1.2);
        line(ctx, up(S, H), up(S, H + 4), shade(wall, -0.2), 1.2);
      }
      break;
    }
    case "apartment": {
      // About a third of apartment blocks read as a plainer, more modern tower instead of
      // the classic balconied slab — same footprint rules, a different silhouette.
      const modern = rnd(0, 95) < 0.32;
      windows("L", w * 3, b.floors, 0.5, 0.42, false, modern ? "#cfe6ee" : undefined);
      windows("R", h * 3, b.floors, 0.5, 0.42, false, modern ? "#bcd8e2" : undefined);
      if (!modern) {
        const out: Pt = [(-TW / 2) * 0.1, (TH / 2) * 0.1];
        for (let r = 1; r < b.floors; r++) {
          for (let c = 0; c < w * 3; c += 2) {
            const cu = (c + 0.5) / (w * 3);
            const a = L(cu - 0.12, (r + 0.25) / b.floors);
            const d = L(cu + 0.12, (r + 0.25) / b.floors);
            poly(ctx, [a, d, [d[0] + out[0], d[1] + out[1]], [a[0] + out[0], a[1] + out[1]]], "#cfc9bd", "rgba(0,0,0,0.25)", 0.5);
            line(ctx, [a[0] + out[0], a[1] + out[1] - 5], [d[0] + out[0], d[1] + out[1] - 5], "rgba(60,60,60,0.7)", 0.8);
          }
        }
      }
      if (w > 1) canopy();
      flatRoof(shade(b.roof, 0.1));
      if (modern && w > 1) box(ctx, x + w * 0.18, y + h * 0.18, w * 0.64, h * 0.64, H, 11, shade(wall, 0.12), shade(wall, 0.28));
      else box(ctx, x + w * 0.62, y + h * 0.55, 0.25, 0.25, H, 12, "#9aa3ad");
      break;
    }
    case "office":
    case "techco": {
      const tint = kind === "techco" ? "#a9e6df" : "#b7d3e8";
      windows("L", w * 3, b.floors, 0.9, 0.7, false, tint);
      windows("R", h * 3, b.floors, 0.9, 0.7, false, shade(tint, -0.15));
      const sky = ctx.createLinearGradient(up(W, H)[0], up(W, H)[1], S[0], S[1]);
      sky.addColorStop(0, "rgba(255,255,255,0.14)");
      sky.addColorStop(0.5, "rgba(255,255,255,0)");
      sky.addColorStop(1, "rgba(255,255,255,0.06)");
      poly(ctx, leftFace, sky);
      if (w > 1) canopy();
      if (kind === "techco") {
        flatRoof("#8a9a86");
        const ctr = iso(x + w / 2, y + h / 2, H);
        for (let k = 0; k < 14; k++) {
          const p = iso(x + 0.2 + rnd(k, 5) * (w - 0.4), y + 0.2 + rnd(k, 6) * (h - 0.4), H);
          ctx.fillStyle = k % 3 ? "#5e9a55" : "#7cb86b";
          ctx.beginPath();
          ctx.arc(p[0], p[1] - 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        emoji(ctx, EMBLEM.techco!, [ctr[0], ctr[1] - 12], 12);
      } else {
        flatRoof(shade(b.roof, 0.15));
        if (w > 1 && rnd(0, 71) < 0.4) {
          // Setback crown: gives some office towers a tiered silhouette from day one,
          // instead of only the tallest, longest-standing buildings looking distinct.
          box(ctx, x + w * 0.22, y + h * 0.22, w * 0.56, h * 0.56, H, 16, shade(wall, 0.08), shade(wall, 0.25));
          const t = iso(x + w / 2, y + h / 2, H + 16);
          line(ctx, t, up(t, 20), "#555", 1.4);
          ctx.fillStyle = "#e0463a";
          ctx.fillRect(t[0] - 1.3, t[1] - 22, 2.6, 2.6);
        } else {
          const t = iso(x + w * 0.7, y + h * 0.3, H);
          line(ctx, t, up(t, 24), "#555", 1.5);
          ctx.fillStyle = "#e0463a";
          ctx.fillRect(t[0] - 1.5, t[1] - 26, 3, 3);
        }
      }
      break;
    }
    case "shop":
    case "cafe":
    case "restaurant":
    case "boutique":
    case "repair":
    case "workshop": {
      const modernFront = rnd(0, 111) < 0.4;
      const va = Math.min(0.7, 0.75 / b.floors);
      if (b.floors > 1) windows("L", w * 2, b.floors, 0.5, 0.45, true);
      windows("R", h * 2, b.floors, 0.45, 0.45, false);
      storefront(va, !modernFront);
      if (modernFront) {
        // A low parapet instead of a plain flat roof, to match the cleaner front below.
        const top = [up(N, H + 3), up(E, H + 3), up(S, H + 3), up(W, H + 3)];
        poly(ctx, top, shade(b.roof, 0.15));
        line(ctx, up(W, H + 3), up(S, H + 3), shade(accent, -0.1), 1.6);
      } else {
        flatRoof(shade(b.roof, 0.1));
      }
      line(ctx, up(W, H - 2), up(S, H - 2), shade(accent, -0.1), 2.5);
      if (kind === "boutique") line(ctx, up(W, H - 5), up(S, H - 5), "#d9b44a", 1.5);
      const sign = L(0.5, Math.min(0.97, va + 0.18));
      if (!closed) {
        poly(ctx, [[sign[0] - 9, sign[1] - 7], [sign[0] + 9, sign[1] - 2], [sign[0] + 9, sign[1] + 9], [sign[0] - 9, sign[1] + 4]], "#f7f3ea", "rgba(0,0,0,0.3)", 0.6);
        emoji(ctx, EMBLEM[kind]!, [sign[0], sign[1] + 1], 10);
      } else faceText(ctx, "CLOSED", L(0.5, va * 0.5), "L", 8, "#ffdddd");
      bc.lamps.push(L(0.08, va + 0.05), L(0.92, va + 0.05));
      break;
    }
    case "grocery":
    case "mall": {
      const va = 0.55 / b.floors;
      storefront(va);
      windows("R", h * 2, b.floors, 0.6, 0.4);
      const band = quad(L, 0.03, 0.97, 1 - 0.3 / b.floors, 1 - 0.05 / b.floors);
      poly(ctx, band, accent, "rgba(0,0,0,0.25)", 0.8);
      faceText(ctx, b.name.toUpperCase(), L(0.5, 1 - 0.175 / b.floors), "L", 9, "#ffffff", 800);
      flatRoof(shade(b.roof, 0.2));
      for (let k = 0; k < 3; k++) box(ctx, x - 0.25 + k * 0.12, y + h + 0.15, 0.1, 0.18, 0, 3, "#b9bec4");
      break;
    }
    case "bank":
    case "cityhall": {
      windows("R", h * 2, b.floors, 0.45, 0.5);
      const plinth = quad(L, 0, 1, 0, 0.08);
      poly(ctx, plinth, shade(wall, -0.15));
      for (let k = 0; k < 7; k++) {
        const u = 0.1 + k * 0.13;
        poly(ctx, quad(L, u, u + 0.055, 0.08, 0.76), "#f7f2e6");
        poly(ctx, quad(L, u + 0.04, u + 0.065, 0.08, 0.76), "rgba(0,0,0,0.14)");
        poly(ctx, quad(L, u - 0.01, u + 0.065, 0.74, 0.79), "#eee6d4");
      }
      poly(ctx, quad(L, 0.43, 0.57, 0.08, 0.42), "#4a3a2c");
      line(ctx, L(0.5, 0.08), L(0.5, 0.42), "#2e241b", 0.8);
      poly(ctx, quad(L, 0.02, 0.98, 0.79, 0.86), shade(wall, 0.12), "rgba(0,0,0,0.15)", 0.6);
      const a = L(0.16, 0.86);
      const bb = L(0.84, 0.86);
      const mid = L(0.5, 0.86);
      poly(ctx, [a, bb, [mid[0], mid[1] - 18]], shade(wall, 0.12), "rgba(0,0,0,0.2)", 0.8);
      for (let k = 0; k < 4; k++) {
        const s0: Pt = lerp(L(0.3, 0), L(0.7, 0), 0);
        const out: Pt = [(-TW / 2) * 0.05 * (k + 1), (TH / 2) * 0.05 * (k + 1)];
        line(ctx, [s0[0] + out[0], s0[1] + out[1] - 2], [L(0.7, 0)[0] + out[0], L(0.7, 0)[1] + out[1] - 2], "rgba(0,0,0,0.18)", 1);
      }
      flatRoof(shade(wall, 0.12));
      bc.lamps.push(L(0.38, 0.35), L(0.62, 0.35));
      if (kind === "bank") {
        faceText(ctx, "$", [mid[0], mid[1] - 7], "L", 11, "#b58a1e", 800);
      } else {
        const c = iso(x + w / 2, y + h / 2, H);
        const rx = 26;
        const drum = ctx.createLinearGradient(c[0] - rx, 0, c[0] + rx, 0);
        drum.addColorStop(0, shade(wall, 0.05));
        drum.addColorStop(1, shade(wall, -0.25));
        ctx.fillStyle = drum;
        ctx.fillRect(c[0] - rx, c[1] - 16, rx * 2, 16);
        for (let k = 0; k < 8; k++) {
          const px = c[0] - rx + 4 + k * 6.3;
          ctx.fillStyle = "rgba(60,80,100,0.55)";
          ctx.fillRect(px, c[1] - 13, 2.5, 8);
        }
        ctx.beginPath();
        ctx.ellipse(c[0], c[1] - 16, rx, rx * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = shade(wall, 0.1);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c[0], c[1] - 16, rx, rx * 0.95, 0, Math.PI, 0);
        const g = ctx.createRadialGradient(c[0] - 10, c[1] - 36, 2, c[0], c[1] - 20, rx * 1.2);
        g.addColorStop(0, "#9ad3c9");
        g.addColorStop(0.5, "#4f9d93");
        g.addColorStop(1, "#1f5752");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = "rgba(20,50,45,0.35)";
        ctx.lineWidth = 0.7;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.ellipse(c[0], c[1] - 16, Math.abs(k) * rx * 0.3 + 0.1, rx * 0.95, 0, Math.PI, 0);
          ctx.stroke();
        }
        const top: Pt = [c[0], c[1] - 16 - rx * 0.95];
        line(ctx, top, [top[0], top[1] - 30], "#c9a33a", 2);
        poly(ctx, [[top[0], top[1] - 30], [top[0] + 16, top[1] - 26], [top[0], top[1] - 22]], "#d8433b");
      }
      break;
    }
    case "media":
    case "lab": {
      windows("L", w * 3, b.floors, 0.6, 0.5);
      windows("R", h * 3, b.floors, 0.6, 0.5);
      if (kind === "media") {
        const band = quad(L, 0.05, 0.95, 1 - 0.35 / b.floors, 1 - 0.05 / b.floors);
        poly(ctx, band, accent, "rgba(0,0,0,0.25)", 0.8);
        faceText(ctx, b.name.toUpperCase(), L(0.5, 1 - 0.2 / b.floors), "L", 9, "#fff", 800);
      }
      canopy();
      flatRoof(shade(b.roof, 0.3));
      const d = iso(x + w * 0.35, y + h * 0.35, H);
      line(ctx, d, up(d, 12), "#666", 2);
      ctx.beginPath();
      ctx.ellipse(d[0], d[1] - 16, 9, 5, -0.5, 0, Math.PI * 2);
      const dg = ctx.createLinearGradient(d[0] - 9, d[1] - 20, d[0] + 9, d[1] - 12);
      dg.addColorStop(0, "#ffffff");
      dg.addColorStop(1, "#a9b3bc");
      ctx.fillStyle = dg;
      ctx.fill();
      ctx.strokeStyle = "#8a959f";
      ctx.stroke();
      break;
    }
    case "cinema": {
      windows("R", h * 2, b.floors, 0.4, 0.4);
      poly(ctx, quad(L, 0.3, 0.7, 0.02, 0.4), "#2a1f3a");
      const band = quad(L, 0.05, 0.95, 0.5, 0.78);
      poly(ctx, band, closed ? "#555" : "#f5c84b", "rgba(0,0,0,0.3)", 0.8);
      faceText(ctx, "CINEMA", L(0.5, 0.64), "L", 10, "#3c2d52", 800);
      if (!closed)
        for (let k = 0; k < 10; k++) {
          const p = L(0.08 + k * 0.093, 0.82);
          ctx.fillStyle = "#fff6c8";
          ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
          bc.lamps.push(p);
        }
      flatRoof(shade(b.roof, 0.15));
      break;
    }
    case "factory":
    case "warehouse":
    case "power": {
      if (kind === "warehouse") {
        for (const u of [0.18, 0.55]) {
          const door = quad(L, u, u + 0.28, 0, 0.62);
          poly(ctx, door, "#6d7784");
          ctx.beginPath();
          for (let k = 1; k < 12; k++) {
            const a = lerp(door[0], door[3], k / 12);
            const c = lerp(door[1], door[2], k / 12);
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(c[0], c[1]);
          }
          ctx.strokeStyle = "rgba(0,0,0,0.22)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
          poly(ctx, quad(L, u - 0.02, u + 0.3, 0.62, 0.68), "#e0b64a");
        }
        windows("R", h * 2, 1, 0.5, 0.25);
      } else {
        windows("L", w * 3, b.floors, 0.55, 0.35);
        windows("R", h * 3, b.floors, 0.55, 0.35);
      }
      flatRoof(shade(b.roof, 0.2));
      if (kind === "factory") {
        for (let k = 0; k < 3; k++) {
          const x0 = x + (w * k) / 3;
          const x1 = x + (w * (k + 1)) / 3;
          const a = iso(x0, y + h, H);
          const c = iso(x1, y + h, H);
          const a2 = iso(x0, y, H);
          const c2 = iso(x1, y, H);
          const peakF: Pt = [c[0], c[1] - 10];
          const peakB: Pt = [c2[0], c2[1] - 10];
          poly(ctx, [a2, peakB, peakF, a], shade(b.roof, 0.05), "rgba(0,0,0,0.2)", 0.6);
          poly(ctx, [c, peakF, peakB, c2], "#8fb0c8", "rgba(0,0,0,0.25)", 0.6);
        }
        for (const [cx, cy] of [
          [x + w * 0.25, y + h * 0.2],
          [x + w * 0.6, y + h * 0.2],
        ]) {
          box(ctx, cx, cy, 0.18, 0.18, H, 42, "#b8473a");
          box(ctx, cx, cy, 0.18, 0.18, H + 20, 5, "#f1eee8");
          box(ctx, cx, cy, 0.18, 0.18, H + 32, 4, "#f1eee8");
          const tp = iso(cx + 0.09, cy + 0.09, H + 42);
          bc.emitters.push({ x: tp[0], y: tp[1], kind: "smoke" });
        }
        const pipeA = iso(x + w, y + h * 0.5, H * 0.6);
        line(ctx, pipeA, [pipeA[0] + 14, pipeA[1] + 7], "#7d858e", 3);
      } else if (kind === "power") {
        const c = iso(x + w * 0.35, y + h * 0.35, H);
        const rx = 18;
        const ht = 40;
        ctx.beginPath();
        ctx.moveTo(c[0] - rx, c[1]);
        ctx.quadraticCurveTo(c[0] - rx * 0.6, c[1] - ht * 0.6, c[0] - rx * 0.75, c[1] - ht);
        ctx.lineTo(c[0] + rx * 0.75, c[1] - ht);
        ctx.quadraticCurveTo(c[0] + rx * 0.6, c[1] - ht * 0.6, c[0] + rx, c[1]);
        ctx.closePath();
        const g = ctx.createLinearGradient(c[0] - rx, 0, c[0] + rx, 0);
        g.addColorStop(0, "#eceff1");
        g.addColorStop(0.6, "#b7bec5");
        g.addColorStop(1, "#8a929a");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c[0], c[1] - ht, rx * 0.75, rx * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#5b6168";
        ctx.fill();
        line(ctx, [c[0] - rx * 0.8, c[1] - ht * 0.45], [c[0] + rx * 0.8, c[1] - ht * 0.45], "#d8433b", 3);
        bc.emitters.push({ x: c[0], y: c[1] - ht, kind: "steam" });
      }
      break;
    }
    case "school":
    case "university": {
      windows("L", w * 3, b.floors, 0.55, 0.45);
      windows("R", h * 3, b.floors, 0.55, 0.45);
      for (let fl = 1; fl < b.floors; fl++) line(ctx, L(0, fl / b.floors), L(1, fl / b.floors), "rgba(245,240,228,0.8)", 1.4);
      canopy();
      flatRoof(shade(b.roof, 0.1));
      if (kind === "school") {
        const c = L(0.5, 0.86);
        ctx.beginPath();
        ctx.arc(c[0], c[1], 6, 0, Math.PI * 2);
        ctx.fillStyle = "#fbf6ea";
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.stroke();
        line(ctx, c, [c[0], c[1] - 4], "#333", 1);
        line(ctx, c, [c[0] + 3, c[1]], "#333", 1);
        const f = iso(x + w * 0.8, y + h * 0.2, H);
        line(ctx, f, [f[0], f[1] - 30], "#777", 1.5);
        poly(ctx, [[f[0], f[1] - 30], [f[0] + 12, f[1] - 27], [f[0], f[1] - 24]], "#3d6fb6");
      } else {
        box(ctx, x + w * 0.4, y + h * 0.4, 0.4, 0.4, H, 34, wall);
        const t = iso(x + w * 0.4 + 0.2, y + h * 0.4 + 0.2, H + 34);
        const bl = iso(x + w * 0.4, y + h * 0.4 + 0.4, H + 34);
        const br = iso(x + w * 0.4 + 0.4, y + h * 0.4 + 0.4, H + 34);
        const tr = iso(x + w * 0.4 + 0.4, y + h * 0.4, H + 34);
        poly(ctx, [bl, br, [t[0], t[1] - 18]], shade(b.roof, 0));
        poly(ctx, [br, tr, [t[0], t[1] - 18]], shade(b.roof, -0.25));
        const clock = iso(x + w * 0.4 + 0.2, y + h * 0.4 + 0.4, H + 22);
        ctx.beginPath();
        ctx.arc(clock[0], clock[1], 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fbf6ea";
        ctx.fill();
      }
      break;
    }
    case "library": {
      windows("L", w * 3, b.floors, 0.5, 0.55);
      windows("R", h * 3, b.floors, 0.5, 0.55);
      for (let k = 0; k < 4; k++) {
        const u = 0.3 + k * 0.13;
        poly(ctx, quad(L, u, u + 0.05, 0.02, 0.7), "#f6f0e2");
        poly(ctx, quad(L, u + 0.035, u + 0.05, 0.02, 0.7), "rgba(0,0,0,0.12)");
      }
      flatRoof(shade(wall, 0.15));
      const c = iso(x + w / 2, y + h / 2, H);
      ctx.beginPath();
      ctx.ellipse(c[0], c[1], 20, 16, 0, Math.PI, 0);
      const g = ctx.createRadialGradient(c[0] - 6, c[1] - 12, 2, c[0], c[1] - 6, 22);
      g.addColorStop(0, "rgba(230,245,255,0.95)");
      g.addColorStop(1, "rgba(110,160,190,0.95)");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "#5c7d91";
      ctx.lineWidth = 0.8;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.ellipse(c[0], c[1], Math.abs(k) * 6 + 0.1, 16, 0, Math.PI, 0);
        ctx.stroke();
      }
      break;
    }
    case "community": {
      windows("L", w * 2, b.floors, 0.75, 0.55);
      windows("R", h * 2, b.floors, 0.7, 0.55);
      poly(ctx, quad(L, 0.08, 0.2, 0.25, 0.95), "#3e8e6a");
      poly(ctx, quad(L, 0.8, 0.92, 0.25, 0.95), "#3d6fb6");
      canopy();
      flatRoof(shade(b.roof, 0.25));
      break;
    }
    case "police": {
      windows("L", w * 2, b.floors, 0.6, 0.5);
      windows("R", h * 2, b.floors, 0.55, 0.5, false, "#a9c3e0");
      const band = quad(L, 0.05, 0.95, 1 - 0.28 / b.floors, 1 - 0.06 / b.floors);
      poly(ctx, band, "#1f3a63", "rgba(0,0,0,0.3)", 0.8);
      faceText(ctx, "POLICE", L(0.5, 1 - 0.17 / b.floors), "L", 9, "#ffffff", 800);
      canopy();
      flatRoof(shade(b.roof, 0.12));
      const badge = L(0.5, Math.min(0.95, 1 - 0.06 / b.floors + 0.14));
      ctx.beginPath();
      ctx.arc(badge[0], badge[1], 6, 0, Math.PI * 2);
      ctx.fillStyle = "#d9b44a";
      ctx.fill();
      emoji(ctx, "🛡️", badge, 8);
      const cx = x + w + 0.35;
      const cy = y + h * 0.3;
      box(ctx, cx, cy, 0.3, 0.16, 0, 6, "#1f3a63");
      box(ctx, cx + 0.06, cy + 0.02, 0.14, 0.1, 6, 4, "#0e1a2e", "#7fa2c0");
      const roofbar = iso(cx + 0.15, cy + 0.08, 6);
      ctx.fillStyle = "#d8433b";
      ctx.fillRect(roofbar[0] - 3, roofbar[1] - 2, 3, 2);
      ctx.fillStyle = "#3d6fb6";
      ctx.fillRect(roofbar[0], roofbar[1] - 2, 3, 2);
      break;
    }
    case "hospital": {
      windows("L", w * 2, b.floors, 0.6, 0.5);
      windows("R", h * 2, b.floors, 0.55, 0.5, false, "#cfeaf0");
      canopy();
      flatRoof(shade(b.roof, 0.25));
      const cross = L(0.5, 1 - 0.1 / b.floors + 0.16);
      ctx.fillStyle = "#e0463a";
      ctx.fillRect(cross[0] - 2.2, cross[1] - 7, 4.4, 14);
      ctx.fillRect(cross[0] - 7, cross[1] - 2.2, 14, 4.4);
      const bay = quad(L, 0.06, 0.34, 0, 0.5);
      poly(ctx, bay, "#c7cdd3");
      ctx.beginPath();
      for (let k = 1; k < 10; k++) {
        const a = lerp(bay[0], bay[3], k / 10);
        const c = lerp(bay[1], bay[2], k / 10);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(c[0], c[1]);
      }
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
      const acx = x - 0.4;
      const acy = y + h * 0.25;
      box(ctx, acx, acy, 0.28, 0.16, 0, 7, "#f2f2f0");
      box(ctx, acx + 0.05, acy + 0.02, 0.16, 0.1, 7, 5, "#dfe6ea", "#a9c3e0");
      const acTop = iso(acx + 0.14, acy + 0.08, 7);
      ctx.fillStyle = "#e0463a";
      ctx.fillRect(acTop[0] - 3, acTop[1] - 3, 6, 2);
      ctx.fillRect(acTop[0] - 1, acTop[1] - 5, 2, 6);
      break;
    }
    case "firestation": {
      windows("L", w * 2, b.floors, 0.55, 0.45, true);
      windows("R", h * 2, b.floors, 0.5, 0.45);
      const doors = w >= 2 ? [0.1, 0.55] : [0.15];
      for (const u of doors) {
        const bay = quad(L, u, u + 0.35, 0, 0.6);
        poly(ctx, bay, "#8f2a22");
        ctx.beginPath();
        for (let k = 1; k < 8; k++) {
          const a = lerp(bay[0], bay[3], k / 8);
          const c = lerp(bay[1], bay[2], k / 8);
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(c[0], c[1]);
        }
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
        if (!closed) {
          const truck = inset(bay, 0.16);
          poly(ctx, truck, "#d8433b");
          poly(ctx, [truck[0], lerp(truck[0], truck[1], 0.5), lerp(truck[3], truck[2], 0.5), truck[3]], "#f2c14e");
        }
      }
      flatRoof(shade(b.roof, 0.1));
      const pole = iso(x + w - 0.3, y + h - 0.3, H);
      line(ctx, pole, [pole[0], pole[1] - 22], "#c9a33a", 3);
      const flag = iso(x + w * 0.5, y + 0.15, H);
      line(ctx, flag, [flag[0], flag[1] - 20], "#666", 1.5);
      poly(ctx, [[flag[0], flag[1] - 20], [flag[0] + 12, flag[1] - 17], [flag[0], flag[1] - 14]], "#d8433b");
      break;
    }
    case "terminal": {
      windows("L", w * 3, b.floors, 0.92, 0.75, false, "#cfe6f5");
      windows("R", h * 3, b.floors, 0.92, 0.75, false, "#9cc3dd");
      flatRoof("#e9eef2");
      const a = up(W, H);
      const e = up(E, H);
      const s2 = up(S, H);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo((a[0] + s2[0]) / 2, (a[1] + s2[1]) / 2 - 16, s2[0], s2[1]);
      ctx.quadraticCurveTo((s2[0] + e[0]) / 2, (s2[1] + e[1]) / 2 - 16, e[0], e[1]);
      ctx.strokeStyle = "#b9c4cc";
      ctx.lineWidth = 3;
      ctx.stroke();
      canopy();
      break;
    }
    case "kiosk": {
      poly(ctx, quad(L, 0.1, 0.9, 0.1, 0.9), "#f7e7c4");
      flatRoof(shade(b.roof, 0.2));
      const c = iso(x + 0.5, y + 0.5, H);
      line(ctx, c, [c[0], c[1] - 16], "#666", 1.5);
      for (let k = 0; k < 8; k++) {
        const a0 = (k / 8) * Math.PI * 2;
        const a1 = ((k + 1) / 8) * Math.PI * 2;
        poly(
          ctx,
          [
            [c[0], c[1] - 22],
            [c[0] + Math.cos(a0) * 20, c[1] - 16 + Math.sin(a0) * 9],
            [c[0] + Math.cos(a1) * 20, c[1] - 16 + Math.sin(a1) * 9],
          ],
          k % 2 ? "#ffffff" : "#d8433b",
        );
      }
      break;
    }
    case "stadium": {
      const top: Pt[] = [up(N, H), up(E, H), up(S, H), up(W, H)];
      const ctr = iso(x + w / 2, y + h / 2, H);
      poly(ctx, top, "#5a8a52");
      const inner = top.map((p) => lerp(p, ctr, 0.2));
      poly(ctx, inner, "#3fa06a", "rgba(255,255,255,0.55)", 1.4);
      const pitch = top.map((p) => lerp(p, ctr, 0.42));
      poly(ctx, pitch, "#4a9a5c", "rgba(255,255,255,0.4)", 1);
      line(ctx, lerp(pitch[0], pitch[1], 0.5), lerp(pitch[3], pitch[2], 0.5), "rgba(255,255,255,0.4)", 1);
      for (const corner of [up(N, H), up(E, H), up(S, H), up(W, H)]) {
        line(ctx, corner, [corner[0], corner[1] - 24], "#555", 1.4);
        ctx.fillStyle = "#f2f2e6";
        ctx.fillRect(corner[0] - 5, corner[1] - 28, 10, 4);
      }
      break;
    }
    case "theatre": {
      windows("R", h * 2, b.floors, 0.45, 0.5);
      const plinth = quad(L, 0, 1, 0, 0.1);
      poly(ctx, plinth, shade(wall, -0.15));
      for (let k = 0; k < 5; k++) {
        const u = 0.1 + k * 0.19;
        poly(ctx, quad(L, u, u + 0.07, 0.1, 0.72), "#f2e6d8");
        poly(ctx, quad(L, u + 0.05, u + 0.07, 0.1, 0.72), "rgba(0,0,0,0.14)");
      }
      const band = quad(L, 0.03, 0.97, 0.74, 0.9);
      poly(ctx, band, accent, "rgba(0,0,0,0.25)", 0.8);
      faceText(ctx, b.name.toUpperCase(), L(0.5, 0.82), "L", 8, "#3c1d2c", 800);
      flatRoof(shade(wall, 0.18));
      break;
    }
    case "skyscraper": {
      windows("L", w * 3, b.floors, 0.85, 0.72, false, "#bfe3ea");
      windows("R", h * 3, b.floors, 0.85, 0.72, false, "#9fd0d6");
      flatRoof(shade(b.roof, 0.2));
      box(ctx, x + w * 0.28, y + h * 0.28, w * 0.44, h * 0.44, H, 20, shade(wall, 0.12), shade(wall, 0.3));
      const spire = iso(x + w / 2, y + h / 2, H + 20);
      line(ctx, spire, [spire[0], spire[1] - 36], "#c9a33a", 2);
      ctx.fillStyle = "#ff5a4a";
      ctx.beginPath();
      ctx.arc(spire[0], spire[1] - 36, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "themepark": {
      poly(ctx, quad(L, 0.06, 0.94, 0, 0.55), "#ff8fb1");
      const a = L(0.06, 0.55);
      const bb = L(0.94, 0.55);
      const arcTop: Pt = [(a[0] + bb[0]) / 2, Math.min(a[1], bb[1]) - 16];
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(arcTop[0], arcTop[1], bb[0], bb[1]);
      ctx.strokeStyle = "#c94f77";
      ctx.lineWidth = 5;
      ctx.stroke();
      faceText(ctx, b.name.toUpperCase(), L(0.5, 0.42), "L", 8, "#ffffff", 800);
      for (let k = 0; k < 5; k++) {
        const p = L(0.1 + k * 0.2, 0.58);
        poly(ctx, [p, [p[0] + 4, p[1] - 6], [p[0] - 4, p[1] - 6]], k % 2 ? "#ffe066" : "#3d6fb6");
      }
      flatRoof("#ffe066");
      break;
    }
  }

  if (EMBLEM[kind] && !STOREFRONT.has(kind) && kind !== "techco") {
    emoji(ctx, EMBLEM[kind]!, iso(x + w / 2, y + h / 2, H + 12), 12);
  }

  // Wear: grime darkens facades as condition falls
  const wear = Math.max(0, 0.65 - b.condition);
  if (wear > 0.05) {
    poly(ctx, leftFace, `rgba(60,48,36,${wear * 0.55})`);
    poly(ctx, rightFace, `rgba(40,32,24,${wear * 0.6})`);
    for (let k = 0; k < Math.round(wear * 14); k++) {
      const f = k % 2 ? L : R;
      const p = f(rnd(k, 31), rnd(k, 32) * 0.9);
      ctx.fillStyle = "rgba(30,24,18,0.35)";
      ctx.fillRect(p[0], p[1], 2 + rnd(k, 33) * 3, 1.5);
    }
  }
  // Disrepair: cracks appear below 0.4 condition, windows start breaking below 0.2,
  // and ivy creeps up closed, badly-worn buildings.
  if (b.condition < 0.4) {
    const crackCount = b.condition < 0.2 ? 4 : 2;
    for (let k = 0; k < crackCount; k++) {
      const f = k % 2 ? L : R;
      const u0 = 0.1 + rnd(k, 41) * 0.7;
      const v0 = 0.15 + rnd(k, 42) * 0.5;
      const a = f(u0, v0);
      const b2 = f(u0 + 0.05 + rnd(k, 43) * 0.08, v0 - 0.18 - rnd(k, 44) * 0.15);
      const mid: Pt = [(a[0] + b2[0]) / 2 + (rnd(k, 45) - 0.5) * 6, (a[1] + b2[1]) / 2];
      ctx.strokeStyle = "rgba(20,16,12,0.5)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(mid[0], mid[1]);
      ctx.lineTo(b2[0], b2[1]);
      ctx.stroke();
    }
  }
  if (b.condition < 0.2 && bc.windows.length) {
    const brokenCount = Math.max(1, Math.round(bc.windows.length * 0.4));
    for (let k = 0; k < brokenCount; k++) {
      const glass = bc.windows[Math.floor(rnd(k, 51) * bc.windows.length)];
      poly(ctx, glass, "rgba(15,15,18,0.55)");
      line(ctx, glass[0], glass[2], "rgba(0,0,0,0.6)", 1);
      line(ctx, glass[1], glass[3], "rgba(0,0,0,0.6)", 1);
    }
  }
  if (b.closed && b.condition < 0.3) {
    const ivyFace = rnd(0, 61) > 0.5 ? L : R;
    const baseU = 0.08 + rnd(0, 62) * 0.15;
    const topV = 0.4 + rnd(0, 63) * 0.4;
    ctx.strokeStyle = "rgba(60,110,55,0.75)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const p0 = ivyFace(baseU, 0);
    ctx.moveTo(p0[0], p0[1]);
    for (let v = 0.15; v <= topV; v += 0.15) {
      const p = ivyFace(baseU + Math.sin(v * 14) * 0.02, v);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    for (let v = 0.2; v <= topV; v += 0.22) {
      const p = ivyFace(baseU + Math.sin(v * 14) * 0.02, v);
      ctx.fillStyle = "rgba(70,120,60,0.8)";
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Prosperity: higher levels earn rooftop gardens, crowns and lit trims
  if (!closed && b.level >= 4 && kind !== "house" && kind !== "cityhall") {
    const top = [up(N, H), up(E, H), up(S, H), up(W, H)];
    const ctr = iso(x + w / 2, y + h / 2, H);
    poly(ctx, top.map((p) => lerp(p, ctr, 0.3)), "rgba(110,170,90,0.85)");
    line(ctx, up(W, H), up(S, H), b.level >= 5 ? "#e9c46a" : "rgba(255,255,255,0.6)", b.level >= 5 ? 2.2 : 1.4);
    line(ctx, up(S, H), up(E, H), b.level >= 5 ? "#c9a33a" : "rgba(255,255,255,0.4)", b.level >= 5 ? 2.2 : 1.4);
    if (b.level >= 5 && (kind === "office" || kind === "apartment" || kind === "techco")) {
      box(ctx, x + w * 0.3, y + h * 0.3, w * 0.4, h * 0.4, H, 14, "#9fc3dd", "#dcebf5");
      const spire = iso(x + w / 2, y + h / 2, H + 14);
      line(ctx, spire, [spire[0], spire[1] - 22], "#c9a33a", 1.6);
    }
  }

  // Ground-level landscaping: planters along the front
  if (w > 1 && kind !== "warehouse" && kind !== "factory" && kind !== "power") {
    for (const u of [0.04, 0.96]) {
      const p = iso(x + u * w, y + h + 0.12);
      box(ctx, x + u * w - 0.07, y + h + 0.06, 0.14, 0.12, 0, 3, "#9a9186");
      ctx.fillStyle = "#4f8a45";
      ctx.beginPath();
      ctx.arc(p[0], p[1] - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6aa85b";
      ctx.beginPath();
      ctx.arc(p[0] - 1, p[1] - 7.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * A tapered red-and-white striped tower with a gallery and glazed lantern room. Drawn as a
 * round tower rather than the generic box every other building starts from, so it reads as
 * a lighthouse at a glance even at the zoomed-out default view.
 */
function drawLighthouse(ctx: CanvasRenderingContext2D, b: Building, H: number, bc: BuildCtx) {
  const c0 = iso(b.x + 0.5, b.y + 0.5, 0);
  const rb = 13;
  const rt = 8;
  const at = (z: number): { cx: number; cy: number; r: number } => {
    const t = z / H;
    return { cx: c0[0], cy: c0[1] - z, r: rb + (rt - rb) * t };
  };

  // Rocky base and contact shadow.
  ctx.fillStyle = "rgba(15,25,20,0.28)";
  ctx.beginPath();
  ctx.ellipse(c0[0] + 8, c0[1] + 3, rb + 10, (rb + 10) * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8d8a82";
  ctx.beginPath();
  ctx.ellipse(c0[0], c0[1], rb + 6, (rb + 6) * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Striped tapered body, drawn as stacked bands.
  const bands = 6;
  for (let k = 0; k < bands; k++) {
    const lo = at((H * k) / bands);
    const hi = at((H * (k + 1)) / bands);
    const color = k % 2 ? "#d8433b" : "#f4f1ea";
    ctx.beginPath();
    ctx.moveTo(lo.cx - lo.r, lo.cy);
    ctx.ellipse(lo.cx, lo.cy, lo.r, lo.r * 0.5, 0, Math.PI, 0, true);
    ctx.lineTo(hi.cx + hi.r, hi.cy);
    ctx.ellipse(hi.cx, hi.cy, hi.r, hi.r * 0.5, 0, 0, Math.PI, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  // Round-body shading: light from the left, shadow on the right.
  const g = ctx.createLinearGradient(c0[0] - rb, 0, c0[0] + rb, 0);
  g.addColorStop(0, "rgba(255,255,255,0.18)");
  g.addColorStop(0.45, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.32)");
  const top = at(H);
  ctx.beginPath();
  ctx.moveTo(c0[0] - rb, c0[1]);
  ctx.lineTo(top.cx - top.r, top.cy);
  ctx.lineTo(top.cx + top.r, top.cy);
  ctx.lineTo(c0[0] + rb, c0[1]);
  ctx.ellipse(c0[0], c0[1], rb, rb * 0.5, 0, 0, Math.PI);
  ctx.fillStyle = g;
  ctx.fill();
  // A door and two small windows.
  ctx.fillStyle = "#3b2f25";
  ctx.fillRect(c0[0] - 3, c0[1] - 9 + rb * 0.4, 6, 9);
  ctx.fillStyle = "#2b3440";
  ctx.fillRect(c0[0] - 1.5, c0[1] - H * 0.5, 3, 5);
  ctx.fillRect(c0[0] - 1.5, c0[1] - H * 0.78, 3, 5);

  // Gallery (walkway ring with railing).
  ctx.fillStyle = "#2f3540";
  ctx.beginPath();
  ctx.ellipse(top.cx, top.cy, top.r + 5, (top.r + 5) * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1c2027";
  ctx.lineWidth = 1;
  for (let k = -3; k <= 3; k++) {
    const px = top.cx + (k / 3) * (top.r + 4);
    ctx.beginPath();
    ctx.moveTo(px, top.cy);
    ctx.lineTo(px, top.cy - 5);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(top.cx, top.cy - 5, top.r + 5, (top.r + 5) * 0.5, 0, 0, Math.PI);
  ctx.stroke();

  // Glazed lantern room and red dome.
  const lz = top.cy - 5;
  ctx.fillStyle = "#ffe38a";
  ctx.fillRect(top.cx - 6, lz - 12, 12, 12);
  ctx.strokeStyle = "#2f3540";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(top.cx - 6, lz - 12, 12, 12);
  line(ctx, [top.cx, lz - 12], [top.cx, lz], "#2f3540", 1);
  ctx.fillStyle = "#b5362f";
  ctx.beginPath();
  ctx.ellipse(top.cx, lz - 12, 8, 7, 0, Math.PI, 0);
  ctx.fill();
  line(ctx, [top.cx, lz - 19], [top.cx, lz - 25], "#2f3540", 1.2);
  bc.lamps.push([top.cx, lz - 6]);
}

function drawConstruction(ctx: CanvasRenderingContext2D, b: Building, fullH: number) {
  const { x, y, w, h } = b;
  const H = Math.max(10, fullH * b.construction);
  poly(ctx, [iso(x - 0.1, y - 0.1), iso(x + w + 0.1, y - 0.1), iso(x + w + 0.1, y + h + 0.1), iso(x - 0.1, y + h + 0.1)], "#b39873");
  box(ctx, x + 0.12, y + 0.12, w - 0.24, h - 0.24, 0, H, "#a9a39a", "#8f8a82");
  ctx.strokeStyle = "rgba(210,140,40,0.9)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [u, v] of [
    [0, 1],
    [1, 1],
    [1, 0],
  ] as const) {
    const base = iso(x + u * w, y + v * h);
    ctx.moveTo(base[0], base[1]);
    ctx.lineTo(base[0], base[1] - H - 6);
  }
  for (let z = 8; z < H + 6; z += 8) {
    const a = iso(x, y + h, z);
    const m = iso(x + w, y + h, z);
    const e = iso(x + w, y, z);
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(m[0], m[1]);
    ctx.lineTo(e[0], e[1]);
  }
  ctx.stroke();
  const top = iso(x + w * 0.8, y + h * 0.2, H);
  line(ctx, top, [top[0], top[1] - 50], "#e0a82e", 2.5);
  line(ctx, [top[0] - 10, top[1] - 48], [top[0] + 40, top[1] - 48], "#e0a82e", 2.5);
  line(ctx, [top[0] + 30, top[1] - 48], [top[0] + 30, top[1] - 30], "#333", 1);
  emoji(ctx, "🏗️", iso(x + w / 2, y + h / 2, H + 14), 14);
}
