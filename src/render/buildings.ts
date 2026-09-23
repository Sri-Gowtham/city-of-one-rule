import type { Building, BuildingKind } from "../sim/types";
import { TH, TW, hash, iso, line, poly, shade } from "./draw";
import type { Pt } from "./draw";

export interface BuildCtx {
  night: number;
  hour: number;
  time: number;
  era: number;
  lit: Pt[][];
  glows: { x: number; y: number; r: number; color: string }[];
  emitters: { x: number; y: number; kind: "smoke" | "steam" }[];
  working: boolean;
  highlight: 0 | 1 | 2;
  community: number;
}

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
};

const EMBLEM: Partial<Record<BuildingKind, string>> = {
  cafe: "☕",
  restaurant: "🍝",
  shop: "🛍️",
  mall: "🛒",
  grocery: "🛒",
  boutique: "💎",
  repair: "🔧",
  workshop: "🛠️",
  kiosk: "🍦",
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
};

const STOREFRONT: ReadonlySet<BuildingKind> = new Set<BuildingKind>([
  "shop",
  "cafe",
  "restaurant",
  "boutique",
  "repair",
  "workshop",
]);

export function buildingHeight(b: Building): number {
  return b.floors * (FLOOR_H[b.kind] ?? 15);
}

export function buildingHull(b: Building): Pt[] {
  const H = buildingHeight(b) + (b.kind === "cityhall" ? 60 : b.kind === "house" ? 14 : 8);
  const { x, y, w, h } = b;
  return [iso(x, y + h), iso(x + w, y + h), iso(x + w, y), iso(x + w, y, H), iso(x, y, H), iso(x, y + h, H)];
}

function litProb(hour: number, kind: BuildingKind): number {
  const home = kind === "house" || kind === "apartment";
  if (hour >= 18 && hour < 23) return home ? 0.7 : 0.35;
  if (hour >= 23) return home ? 0.3 : 0.15;
  if (hour < 7.5) return home ? 0.45 : 0.1;
  return 0;
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
}

function faceText(ctx: CanvasRenderingContext2D, text: string, p: Pt, face: "L" | "R", size: number, color: string, weight = 700) {
  ctx.save();
  ctx.translate(p[0], p[1]);
  ctx.transform(1, face === "L" ? 0.5 : -0.5, 0, 1, 0, 0);
  ctx.font = `${weight} ${size}px 'Segoe UI', system-ui, sans-serif`;
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
  const closed = b.closed;
  const wall = closed ? "#8c8782" : b.wall;
  const accent = closed ? "#6f6a66" : b.accent;

  poly(ctx, [S, E, [E[0] + 16, E[1] + 8], [S[0] + 16, S[1] + 8]], "rgba(20,30,20,0.16)");
  poly(ctx, [W, S, up(S, H), up(W, H)], shade(wall, -0.03));
  poly(ctx, [S, E, up(E, H), up(S, H)], shade(wall, -0.25));
  line(ctx, S, up(S, H), "rgba(0,0,0,0.12)", 1);

  const lp = litProb(bc.hour, kind) * (bc.night > 0.05 ? 1 : 0);
  const windows = (
    face: "L" | "R",
    cols: number,
    rows: number,
    gw = 0.55,
    gh = 0.45,
    skipGround = false,
    glassL = "#c3dcee",
    glassR = "#8fb2cc",
  ) => {
    const f = face === "L" ? L : R;
    for (let r = skipGround ? 1 : 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cu = (c + 0.5) / cols;
        const hw = gw / cols / 2;
        const q = quad(f, cu - hw, cu + hw, (r + 0.3) / rows, (r + 0.3 + gh) / rows);
        if (closed) {
          poly(ctx, q, "#5d4a3a");
          line(ctx, q[0], q[2], "#3b2f25", 1);
          line(ctx, q[1], q[3], "#3b2f25", 1);
          continue;
        }
        const on = lp > 0 && hash(b.seed, face === "L" ? 1 : 2, r, c, Math.floor(bc.hour)) < lp;
        poly(ctx, q, on ? "#f7d58c" : face === "L" ? glassL : glassR);
        if (on) bc.lit.push(q);
      }
    }
  };
  const flatRoof = (color: string) => {
    const top: Pt[] = [up(N, H), up(E, H), up(S, H), up(W, H)];
    poly(ctx, top, color);
    const inset = (p: Pt, c: Pt): Pt => [p[0] + (c[0] - p[0]) * 0.1, p[1] + (c[1] - p[1]) * 0.1];
    const ctr = iso(x + w / 2, y + h / 2, H);
    poly(ctx, top.map((p) => inset(p, ctr)), undefined, "rgba(0,0,0,0.12)", 1);
  };
  const storefront = (va: number) => {
    const glass = quad(L, 0.12, 0.88, 0.04, va * 0.9);
    poly(ctx, glass, closed ? "#4a3f36" : bc.night > 0.1 && bc.hour < 22 ? "#f5d189" : "#b8d4e6");
    if (!closed && bc.night > 0.1 && bc.hour < 22) bc.lit.push(glass);
    poly(ctx, quad(L, 0.44, 0.56, 0.04, va * 0.82), shade(accent, -0.3));
    if (closed) {
      line(ctx, glass[0], glass[2], "#2b221b", 1.5);
      line(ctx, glass[1], glass[3], "#2b221b", 1.5);
      return;
    }
    const out: Pt = [(-TW / 2) * 0.22, (TH / 2) * 0.22];
    const n = 6;
    for (let k = 0; k < n; k++) {
      const u0 = 0.06 + (k * 0.88) / n;
      const u1 = 0.06 + ((k + 1) * 0.88) / n;
      const a0 = L(u0, va);
      const a1 = L(u1, va);
      poly(
        ctx,
        [a0, a1, [a1[0] + out[0], a1[1] + out[1] + 5], [a0[0] + out[0], a0[1] + out[1] + 5]],
        k % 2 ? "#f6f1e7" : accent,
      );
    }
  };

  switch (kind) {
    case "house": {
      windows("R", 1, 1, 0.4, 0.45);
      poly(ctx, quad(L, 0.2, 0.42, 0, 0.62), shade(b.roof, -0.35));
      windows("L", 1, 1, 0.3, 0.42);
      const rh = 15;
      const roof = b.shared ? "#35a39a" : b.roof;
      const A = iso(x, y + h / 2, H + rh);
      const B = iso(x + w, y + h / 2, H + rh);
      poly(ctx, [up(N, H), up(E, H), B, A], shade(roof, -0.2));
      poly(ctx, [up(W, H), up(S, H), B, A], roof);
      poly(ctx, [up(E, H), up(S, H), B], shade(wall, -0.32));
      box(ctx, x + 0.62, y + 0.2, 0.14, 0.14, H + 6, 12, "#7b5a48");
      break;
    }
    case "apartment": {
      windows("L", w * 3, b.floors, 0.5, 0.42);
      windows("R", h * 3, b.floors, 0.5, 0.42);
      for (let r = 1; r < b.floors; r++) line(ctx, L(0.05, (r + 0.22) / b.floors), L(0.95, (r + 0.22) / b.floors), "rgba(60,50,40,0.55)", 1.5);
      flatRoof(shade(b.roof, 0.1));
      box(ctx, x + w * 0.62, y + h * 0.2, 0.25, 0.25, H, 12, "#9aa3ad");
      break;
    }
    case "office":
    case "techco": {
      const cols = w * 3;
      windows("L", cols, b.floors, 0.82, 0.62, false, kind === "techco" ? "#bff0ea" : "#d5e7f5", kind === "techco" ? "#7cc9c1" : "#93b6d3");
      windows("R", h * 3, b.floors, 0.82, 0.62, false, kind === "techco" ? "#bff0ea" : "#d5e7f5", kind === "techco" ? "#7cc9c1" : "#93b6d3");
      flatRoof(kind === "techco" ? "#79b86b" : shade(b.roof, 0.15));
      if (kind === "office") {
        const t = iso(x + w * 0.7, y + h * 0.3, H);
        line(ctx, t, up(t, 24), "#555", 1.5);
        ctx.fillStyle = Math.sin(bc.time * 3) > 0 ? "#ff5a4a" : "#7a2a24";
        ctx.fillRect(t[0] - 1.5, t[1] - 26, 3, 3);
      } else {
        emoji(ctx, EMBLEM.techco!, iso(x + w / 2, y + h / 2, H + 10), 14);
      }
      break;
    }
    case "shop":
    case "cafe":
    case "restaurant":
    case "boutique":
    case "repair":
    case "workshop": {
      const va = Math.min(0.7, 0.75 / b.floors);
      if (b.floors > 1) {
        windows("L", w * 2, b.floors, 0.5, 0.45, true);
      }
      windows("R", h * 2, b.floors, 0.45, 0.45, false);
      storefront(va);
      flatRoof(shade(b.roof, 0.1));
      if (kind === "boutique") line(ctx, up(W, H - 3), up(S, H - 3), "#d9b44a", 2);
      emoji(ctx, EMBLEM[kind]!, closed ? L(0.5, 0.5) : [L(0.5, 1)[0], L(0.5, 1)[1] - 10], 13);
      if (closed) faceText(ctx, "CLOSED", L(0.5, va * 0.5), "L", 9, "#ffdddd");
      break;
    }
    case "grocery":
    case "mall": {
      const va = 0.55 / b.floors;
      storefront(va);
      windows("R", h * 2, b.floors, 0.6, 0.4);
      const band = quad(L, 0.03, 0.97, 1 - 0.3 / b.floors, 1 - 0.05 / b.floors);
      poly(ctx, band, accent);
      faceText(ctx, b.name.toUpperCase(), L(0.5, 1 - 0.175 / b.floors), "L", 10, "#ffffff");
      flatRoof(shade(b.roof, 0.2));
      box(ctx, x + w * 0.3, y + h * 0.25, 0.3, 0.3, H, 8, "#a8adb3");
      break;
    }
    case "bank":
    case "cityhall": {
      windows("R", h * 2, b.floors, 0.45, 0.5);
      for (let k = 0; k < 7; k++) {
        const u = 0.1 + k * 0.13;
        poly(ctx, quad(L, u, u + 0.05, 0.02, 0.78), "#f6f0e2");
        poly(ctx, quad(L, u + 0.05, u + 0.07, 0.02, 0.78), "rgba(0,0,0,0.12)");
      }
      poly(ctx, quad(L, 0.44, 0.56, 0.02, 0.4), "#5a4636");
      const a = L(0.18, 0.8);
      const bb = L(0.82, 0.8);
      const mid = L(0.5, 0.8);
      poly(ctx, [a, bb, [mid[0], mid[1] - 18]], shade(wall, 0.1), "rgba(0,0,0,0.15)");
      flatRoof(shade(wall, 0.12));
      if (kind === "bank") {
        faceText(ctx, "$", [mid[0], mid[1] - 7], "L", 11, "#b58a1e", 800);
      } else {
        const c = iso(x + w / 2, y + h / 2, H);
        const rx = 26;
        ctx.fillStyle = shade(wall, -0.05);
        ctx.fillRect(c[0] - rx, c[1] - 16, rx * 2, 16);
        ctx.beginPath();
        ctx.ellipse(c[0], c[1] - 16, rx, rx * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = shade(wall, 0.1);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c[0], c[1] - 16, rx, rx * 0.95, 0, Math.PI, 0);
        const g = ctx.createLinearGradient(c[0] - rx, 0, c[0] + rx, 0);
        g.addColorStop(0, "#5fb5aa");
        g.addColorStop(1, "#276f69");
        ctx.fillStyle = g;
        ctx.fill();
        const top: Pt = [c[0], c[1] - 16 - rx * 0.95];
        line(ctx, top, [top[0], top[1] - 30], "#c9a33a", 2);
        const wave = Math.sin(bc.time * 3) * 2;
        poly(ctx, [[top[0], top[1] - 30], [top[0] + 16, top[1] - 27 + wave], [top[0], top[1] - 22]], "#d8433b");
      }
      break;
    }
    case "media":
    case "lab": {
      windows("L", w * 3, b.floors, 0.6, 0.5);
      windows("R", h * 3, b.floors, 0.6, 0.5);
      if (kind === "media") {
        const band = quad(L, 0.05, 0.95, 1 - 0.35 / b.floors, 1 - 0.05 / b.floors);
        poly(ctx, band, accent);
        faceText(ctx, b.name.toUpperCase(), L(0.5, 1 - 0.2 / b.floors), "L", 10, "#fff");
      }
      flatRoof(shade(b.roof, 0.3));
      const d = iso(x + w * 0.35, y + h * 0.35, H);
      line(ctx, d, up(d, 12), "#666", 2);
      ctx.beginPath();
      ctx.ellipse(d[0], d[1] - 16, 9, 5, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#e9eef2";
      ctx.fill();
      ctx.strokeStyle = "#8a959f";
      ctx.stroke();
      break;
    }
    case "cinema": {
      windows("R", h * 2, b.floors, 0.4, 0.4);
      poly(ctx, quad(L, 0.3, 0.7, 0.02, 0.4), "#2a1f3a");
      const band = quad(L, 0.05, 0.95, 0.5, 0.78);
      poly(ctx, band, closed ? "#555" : "#f5c84b");
      faceText(ctx, "CINEMA", L(0.5, 0.64), "L", 10, "#3c2d52", 800);
      if (!closed)
        for (let k = 0; k < 10; k++) {
          const p = L(0.08 + k * 0.093, 0.82);
          ctx.fillStyle = Math.sin(bc.time * 6 + k) > 0 ? "#fff6c8" : "#c79a2a";
          ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
        }
      flatRoof(shade(b.roof, 0.15));
      break;
    }
    case "factory":
    case "warehouse":
    case "power": {
      if (kind === "warehouse") {
        poly(ctx, quad(L, 0.22, 0.78, 0, 0.62), "#6d7784");
        for (let k = 1; k < 6; k++) line(ctx, L(0.22, k * 0.1), L(0.78, k * 0.1), "rgba(0,0,0,0.2)", 1);
        windows("R", h * 2, 1, 0.5, 0.25);
      } else {
        windows("L", w * 3, b.floors, 0.55, 0.35);
        windows("R", h * 3, b.floors, 0.55, 0.35);
      }
      flatRoof(shade(b.roof, 0.2));
      if (kind === "factory") {
        for (const [cx, cy] of [
          [x + w * 0.25, y + h * 0.2],
          [x + w * 0.6, y + h * 0.2],
        ]) {
          box(ctx, cx, cy, 0.18, 0.18, H, 40, "#b8473a");
          box(ctx, cx, cy, 0.18, 0.18, H + 18, 6, "#f1eee8");
          if (bc.working && !closed) {
            const tp = iso(cx + 0.09, cy + 0.09, H + 40);
            bc.emitters.push({ x: tp[0], y: tp[1], kind: "smoke" });
          }
        }
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
        g.addColorStop(0, "#e2e5e8");
        g.addColorStop(1, "#9aa1a8");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c[0], c[1] - ht, rx * 0.75, rx * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#6b7178";
        ctx.fill();
        line(ctx, [c[0] - rx * 0.8, c[1] - ht * 0.45], [c[0] + rx * 0.8, c[1] - ht * 0.45], "#d8433b", 3);
        if (bc.working) bc.emitters.push({ x: c[0], y: c[1] - ht, kind: "steam" });
      }
      break;
    }
    case "school":
    case "university": {
      windows("L", w * 3, b.floors, 0.55, 0.45);
      windows("R", h * 3, b.floors, 0.55, 0.45);
      poly(ctx, quad(L, 0.42, 0.58, 0, 0.35), "#5a4030");
      flatRoof(shade(b.roof, 0.1));
      if (kind === "school") {
        const c = L(0.5, 0.82);
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
        poly(ctx, [[f[0], f[1] - 30], [f[0] + 12, f[1] - 27 + Math.sin(bc.time * 3)], [f[0], f[1] - 24]], "#3d6fb6");
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
      }
      flatRoof(shade(wall, 0.15));
      const c = iso(x + w / 2, y + h / 2, H);
      ctx.beginPath();
      ctx.ellipse(c[0], c[1], 20, 20 * 0.8, 0, Math.PI, 0);
      ctx.fillStyle = "rgba(160,205,230,0.95)";
      ctx.fill();
      ctx.strokeStyle = "#5c7d91";
      ctx.stroke();
      break;
    }
    case "community": {
      windows("L", w * 2, b.floors, 0.75, 0.55);
      windows("R", h * 2, b.floors, 0.7, 0.55);
      poly(ctx, quad(L, 0.08, 0.2, 0.25, 0.95), "#3e8e6a");
      poly(ctx, quad(L, 0.8, 0.92, 0.25, 0.95), "#3d6fb6");
      flatRoof(shade(b.roof, 0.25));
      if (bc.community > 60 && !closed) {
        const c = iso(x + w / 2, y + h / 2, H);
        bc.glows.push({ x: c[0], y: c[1], r: 60, color: "255,190,120" });
      }
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
  }

  if (EMBLEM[kind] && !STOREFRONT.has(kind) && kind !== "techco" && kind !== "kiosk" && kind !== "mall" && kind !== "grocery") {
    emoji(ctx, EMBLEM[kind]!, iso(x + w / 2, y + h / 2, H + 12), 13);
  }

  if (b.born > 0 && bc.era - b.born <= 1) {
    const p = iso(x + w / 2, y + h / 2, H + 26 + Math.sin(bc.time * 4) * 3);
    emoji(ctx, "✨", p, 14);
  }

  if (bc.highlight) {
    poly(ctx, buildingHull(b), undefined, bc.highlight === 2 ? "#ffd84a" : "rgba(255,255,255,0.85)", bc.highlight === 2 ? 3 : 1.5);
  }
}
