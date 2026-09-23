import { useEffect, useState } from "react";
import type { Sim } from "../sim/engine";

export function useSimTick(sim: Sim | null, ms = 250) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!sim) return;
    const unsub = sim.subscribe(() => setN((n) => n + 1));
    const id = window.setInterval(() => setN((n) => n + 1), ms);
    return () => {
      unsub();
      window.clearInterval(id);
    };
  }, [sim, ms]);
}
