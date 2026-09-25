import { mix } from "./draw";

/** Sky color keyframes across the 24h day. Interpolated linearly between the two nearest. */
interface SkyStop {
  h: number;
  top: string;
  bottom: string;
  horizon: string;
}

const STOPS: SkyStop[] = [
  { h: 0, top: "#0b1330", bottom: "#152449", horizon: "#1b2b52" },
  { h: 4, top: "#0f1938", bottom: "#243459", horizon: "#38446e" },
  { h: 5.5, top: "#2c3f66", bottom: "#7a5a6e", horizon: "#e08a63" },
  { h: 6.5, top: "#3f6f9e", bottom: "#f2a35f", horizon: "#ffcf8a" },
  { h: 8, top: "#4f8ec2", bottom: "#bcdcef", horizon: "#eaf3f8" },
  { h: 12, top: "#3f83b8", bottom: "#bfe0f2", horizon: "#e8f4fa" },
  { h: 16, top: "#3d78ab", bottom: "#a9cfe6", horizon: "#dff0f5" },
  { h: 17.5, top: "#4a6f9e", bottom: "#f2a35f", horizon: "#ffb37a" },
  { h: 19, top: "#33456f", bottom: "#c96b7a", horizon: "#e8896f" },
  { h: 20, top: "#25275a", bottom: "#5a4a78", horizon: "#7a5a80" },
  { h: 21.5, top: "#0d1330", bottom: "#182449", horizon: "#202f56" },
  { h: 24, top: "#0b1330", bottom: "#152449", horizon: "#1b2b52" },
];

function skyAt(hour: number): SkyStop {
  let a = STOPS[0];
  let b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (hour >= STOPS[i].h && hour <= STOPS[i + 1].h) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const span = b.h - a.h || 1;
  const t = (hour - a.h) / span;
  return { h: hour, top: mix(a.top, b.top, t), bottom: mix(a.bottom, b.bottom, t), horizon: mix(a.horizon, b.horizon, t) };
}

/** 0 (full daylight) .. 1 (full night), smoothed at the edges of dawn/dusk. */
function nightAmount(hour: number): number {
  if (hour < 5) return 1;
  if (hour < 7) return 1 - (hour - 5) / 2;
  if (hour < 18) return 0;
  if (hour < 20) return (hour - 18) / 2;
  return 1;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

const STAR_CLUSTERS: readonly (readonly [number, number, number])[] = [
  [0.14, 0.16, 5],
  [0.62, 0.1, 4],
  [0.82, 0.22, 6],
];

/**
 * Sky gradient, sun/moon arc, horizon glow and stars. Pure screen space — draw before the
 * camera transform. `horizonY` is the screen y where the city actually meets the water (the
 * south tip of the isometric map under the current camera), so the sun/moon set at the real
 * waterline instead of a fixed fraction of the canvas — otherwise the city reads as floating
 * below a horizon that has nothing to do with where it's actually sitting on screen.
 */
export function drawSky(ctx: CanvasRenderingContext2D, hour: number, w: number, h: number, horizonY: number) {
  const sky = skyAt(hour);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, sky.top);
  g.addColorStop(1, sky.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const night = nightAmount(hour);

  // Sun (day) and moon (night) share one arc across the upper sky.
  const dayT = clamp01((hour - 6) / 12);
  const nightHour = hour >= 18 ? hour - 18 : hour + 6;
  const moonT = clamp01(nightHour / 12);
  const arcX = (t: number) => w * (0.08 + t * 0.84);
  const arcY = (t: number) => horizonY - Math.sin(Math.PI * t) * horizonY * 0.92;

  if (night < 1) {
    const edge = smooth(clamp01(Math.min(dayT, 1 - dayT) * 6));
    const sx = arcX(dayT);
    const sy = arcY(dayT);
    const warm = dayT < 0.5 ? 1 - dayT * 2 : (dayT - 0.5) * 2; // warmer near sunrise/sunset
    const sunColor = mix("#fff3c4", "#ffb15e", warm);
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90);
    glow.addColorStop(0, `rgba(255,235,180,${0.55 * edge})`);
    glow.addColorStop(1, "rgba(255,235,180,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 90, sy - 90, 180, 180);
    ctx.beginPath();
    ctx.arc(sx, sy, 15, 0, Math.PI * 2);
    ctx.fillStyle = sunColor;
    ctx.globalAlpha = edge;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (night > 0) {
    const mx = arcX(moonT);
    const my = arcY(moonT);
    const edge = smooth(clamp01(Math.min(moonT, 1 - moonT) * 6)) * night;
    const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 46);
    glow.addColorStop(0, `rgba(220,228,245,${0.35 * edge})`);
    glow.addColorStop(1, "rgba(220,228,245,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(mx - 46, my - 46, 92, 92);
    ctx.beginPath();
    ctx.arc(mx, my, 9, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(232,236,248,${edge})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + 3, my - 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = sky.top;
    ctx.globalAlpha = edge;
    ctx.fill();
    ctx.globalAlpha = 1;

    const starAlpha = night * night;
    if (starAlpha > 0.02) {
      for (const [cx, cy, n] of STAR_CLUSTERS) {
        for (let i = 0; i < n; i++) {
          const fx = (Math.sin(i * 12.9898 + cx * 78.233) * 43758.5453) % 1;
          const fy = (Math.sin(i * 45.164 + cy * 12.53) * 12543.234) % 1;
          const px = w * cx + Math.abs(fx) * 60 - 30;
          const py = h * cy + Math.abs(fy) * 40 - 20;
          const twinkle = 0.5 + 0.5 * Math.sin(i * 3.7 + hour * 8);
          ctx.fillStyle = `rgba(255,255,255,${starAlpha * (0.4 + 0.5 * twinkle)})`;
          ctx.fillRect(px, py, 1.4, 1.4);
        }
      }
    }
  }

  // Horizon glow band, warmest at dawn/dusk.
  const band = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 20);
  band.addColorStop(0, "rgba(255,255,255,0)");
  band.addColorStop(1, sky.horizon.replace("rgb(", "rgba(").replace(")", ",0.33)"));
  ctx.fillStyle = band;
  ctx.fillRect(0, horizonY - 40, w, 60);
}
