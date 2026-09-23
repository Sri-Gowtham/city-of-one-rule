import { useMemo, useState } from "react";
import { rules } from "../data/rules";
import { initialCulture, pickRuleChoices, runEra } from "../engine/simulation";
import type { EraRecord, RuleDef } from "../engine/types";
import { initialMetrics } from "../data/metrics";

const TOTAL_ERAS = 5;

export function useGameState() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [culture, setCulture] = useState(initialCulture);
  const [era, setEra] = useState(1);
  const [history, setHistory] = useState<EraRecord[]>([]);
  const [latestRecord, setLatestRecord] = useState<EraRecord | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const choices = useMemo(
    () => pickRuleChoices(history.map((h) => h.ruleId), rules, 3),
    // Regenerate only when history length changes (a new era begins).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history.length]
  );

  function chooseRule(rule: RuleDef) {
    const result = runEra(era, rule, metrics, culture);
    setMetrics(result.metrics);
    setCulture(result.culture);
    setLatestRecord(result.record);
    setHistory((prev) => [...prev, result.record]);

    if (era >= TOTAL_ERAS) {
      setGameOver(true);
    } else {
      setEra((e) => e + 1);
    }
  }

  function reset() {
    setMetrics(initialMetrics);
    setCulture(initialCulture);
    setEra(1);
    setHistory([]);
    setLatestRecord(null);
    setGameOver(false);
  }

  return {
    metrics,
    culture,
    era,
    totalEras: TOTAL_ERAS,
    choices,
    history,
    latestRecord,
    gameOver,
    chooseRule,
    reset,
  };
}
