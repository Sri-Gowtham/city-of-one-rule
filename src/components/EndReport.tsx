import type { CultureState, EraRecord, MetricsState } from "../engine/types";
import { metricIcons } from "../data/metrics";
import "./EndReport.css";

interface Props {
  metrics: MetricsState;
  culture: CultureState;
  history: EraRecord[];
  onRestart: () => void;
}

function dominantTraits(culture: CultureState) {
  return (Object.entries(culture) as [string, number][])
    .filter(([, value]) => value >= 65)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

export function EndReport({ metrics, culture, history, onRestart }: Props) {
  const traits = dominantTraits(culture);

  return (
    <div className="end-report-overlay">
      <div className="end-report">
        <h1>Your City Has Become...</h1>

        <div className="end-report-metrics">
          {(Object.keys(metrics) as (keyof MetricsState)[]).map((key) => (
            <div className="end-report-metric" key={key}>
              <span>{metricIcons[key]}</span>
              <span className="end-report-metric-name">{key}</span>
              <span className="end-report-metric-value">{metrics[key]}</span>
            </div>
          ))}
        </div>

        <h2>Dominant Cultural Traits</h2>
        <ul className="end-report-traits">
          {traits.length > 0 ? (
            traits.map((t) => <li key={t}>{t}</li>)
          ) : (
            <li>No single trait dominates — a balanced city.</li>
          )}
        </ul>

        <h2>The Rules You Chose</h2>
        <ol className="end-report-timeline">
          {history.map((h) => (
            <li key={h.era}>
              <strong>Era {h.era}:</strong> {h.ruleName}
            </li>
          ))}
        </ol>

        <p className="end-report-reflection">
          This is the society your rules produced.
        </p>
        <p className="end-report-question">What did you become what you beheld?</p>

        <button onClick={onRestart}>Play Again</button>
      </div>
    </div>
  );
}
