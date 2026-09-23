import { CityMetrics, metricIcons } from "../data/metrics";
import "./MetricsBar.css";

interface Props {
  metrics: CityMetrics;
  day: number;
}

export function MetricsBar({ metrics, day }: Props) {
  return (
    <header className="metrics-bar">
      <div className="metrics-title">
        <span>CITY OF ONE RULE</span>
        <span className="metrics-day">Day {day}</span>
      </div>
      <div className="metrics-list">
        {(Object.keys(metrics) as (keyof CityMetrics)[]).map((key) => (
          <div className="metric" key={key}>
            <span className="metric-icon">{metricIcons[key]}</span>
            <span className="metric-name">{key}</span>
            <span className="metric-value">{metrics[key]}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
