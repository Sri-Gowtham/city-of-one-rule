import { citizens } from "../data/citizens";
import "./PeoplePanel.css";

export function PeoplePanel() {
  return (
    <div className="people-panel">
      <h2>Citizens</h2>
      <div className="people-grid">
        {citizens.map((c) => (
          <div className="people-card" key={c.id}>
            <span className="people-card-name">{c.name}</span>
            <span className="people-card-occupation">{c.occupation}</span>
            <div className="people-card-traits">
              {c.traits.map((t) => (
                <span key={t} className="people-card-trait">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
