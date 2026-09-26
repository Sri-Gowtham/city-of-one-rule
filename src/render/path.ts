/**
 * A polyline parameterised by arc length, so anything that moves along a fixed route
 * (the Metro Loop's trains, ships in the harbor, the coaster's cars, the park's mini train)
 * can be placed at "distance d along the route" with one shared walker instead of each
 * keeping its own copy. Works in any 2D space — tile coordinates or screen pixels.
 */
export interface ArcPath {
  pts: [number, number][];
  cum: number[];
  total: number;
}

export function arcPath(pts: [number, number][]): ArcPath {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, total: cum[cum.length - 1] };
}

function segmentAt(path: ArcPath, d: number): { i: number; t: number } {
  const target = ((d % path.total) + path.total) % path.total;
  let i = 1;
  while (i < path.cum.length && path.cum[i] < target) i++;
  i = Math.min(i, path.cum.length - 1);
  const segLen = path.cum[i] - path.cum[i - 1] || 1;
  return { i, t: (target - path.cum[i - 1]) / segLen };
}

/** The point at distance `d` along the path, wrapping around for closed loops. */
export function pointAt(path: ArcPath, d: number): [number, number] {
  const { i, t } = segmentAt(path, d);
  const [x0, y0] = path.pts[i - 1];
  const [x1, y1] = path.pts[i];
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
}

/** Unit direction of travel at distance `d` along the path. */
export function directionAt(path: ArcPath, d: number): [number, number] {
  const { i } = segmentAt(path, d);
  const dx = path.pts[i][0] - path.pts[i - 1][0];
  const dy = path.pts[i][1] - path.pts[i - 1][1];
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

/** A closed loop through `corners` with each corner rounded off, so vehicles turn smoothly. */
export function roundedLoop(corners: [number, number][], radius: number, steps = 4): [number, number][] {
  const out: [number, number][] = [];
  const n = corners.length;
  for (let k = 0; k < n; k++) {
    const prev = corners[(k - 1 + n) % n];
    const cur = corners[k];
    const next = corners[(k + 1) % n];
    const toPrev = norm([prev[0] - cur[0], prev[1] - cur[1]]);
    const toNext = norm([next[0] - cur[0], next[1] - cur[1]]);
    const a: [number, number] = [cur[0] + toPrev[0] * radius, cur[1] + toPrev[1] * radius];
    const b: [number, number] = [cur[0] + toNext[0] * radius, cur[1] + toNext[1] * radius];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // Quadratic Bezier from a through the corner to b.
      const u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * cur[0] + t * t * b[0], u * u * a[1] + 2 * u * t * cur[1] + t * t * b[1]]);
    }
  }
  out.push(out[0]);
  return out;
}

function norm(v: [number, number]): [number, number] {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
}
