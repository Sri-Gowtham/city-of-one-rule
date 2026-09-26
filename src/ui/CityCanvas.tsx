import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { HOURS_PER_SECOND } from "../sim/engine";
import type { Sim } from "../sim/engine";
import type { CityRenderer, Pick } from "../render/renderer";

interface Props {
  sim: Sim;
  renderer: CityRenderer;
  speedRef: RefObject<number>;
  selected: Pick;
  onPick?: (p: Pick) => void;
  interactive?: boolean;
}

export function CityCanvas({ sim, renderer, speedRef, selected, onPick, interactive = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const selRef = useRef<Pick>(selected);
  const pickRef = useRef(onPick);
  selRef.current = selected;
  pickRef.current = onPick;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      renderer.resize(r.width, r.height, dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;
      const speed = speedRef.current ?? 1;
      if (speed > 0) sim.update(dt * speed * HOURS_PER_SECOND);
      renderer.draw(ctx, sim, dt, speed, selRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    if (!interactive) {
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
      };
    }

    let down: { x: number; y: number; moved: boolean } | null = null;
    const local = (e: PointerEvent | WheelEvent) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const onDown = (e: PointerEvent) => {
      const [x, y] = local(e);
      down = { x, y, moved: false };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e);
      if (down) {
        const dx = x - down.x;
        const dy = y - down.y;
        if (down.moved || Math.hypot(dx, dy) > 5) {
          down.moved = true;
          renderer.pan(dx, dy);
          down.x = x;
          down.y = y;
          canvas.style.cursor = "grabbing";
        }
        return;
      }
      const p = renderer.pick(sim, x, y);
      renderer.hover = p;
      canvas.style.cursor = p ? "pointer" : "grab";
    };
    const onUp = (e: PointerEvent) => {
      const [x, y] = local(e);
      if (down && !down.moved) pickRef.current?.(renderer.pick(sim, x, y));
      down = null;
      canvas.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [x, y] = local(e);
      renderer.zoomAt(x, y, Math.exp(-e.deltaY * 0.0015));
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [sim, renderer, speedRef, interactive]);

  return <canvas ref={ref} className="city-canvas" />;
}
