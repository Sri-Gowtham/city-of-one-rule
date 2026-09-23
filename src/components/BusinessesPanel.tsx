import { businesses } from "../data/businesses";
import type { BusinessState } from "../engine/types";
import "./BusinessesPanel.css";

interface Props {
  states: BusinessState[];
}

export function BusinessesPanel({ states }: Props) {
  return (
    <div className="businesses-panel">
      <h2>Businesses</h2>
      <div className="businesses-grid">
        {businesses.map((b) => {
          const state = states.find((s) => s.id === b.id);
          return (
            <div className="business-card" key={b.id}>
              <span className="business-card-name">{b.name}</span>
              <span className="business-card-type">{b.type}</span>
              <div className="business-card-stats">
                <span>Demand: {Math.round(state?.demand ?? 60)}</span>
                <span>Reputation: {Math.round(state?.reputation ?? 60)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
