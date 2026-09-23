import { buildings, districtLayout } from "../data/buildings";
import type { District } from "../data/buildings";
import "./CityView.css";

const CELL_W = 150;
const CELL_H = 140;

const districts = Object.keys(districtLayout) as District[];

export function CityView() {
  return (
    <div className="city-view">
      <div className="city-grid">
        {districts.map((d) => {
          const layout = districtLayout[d];
          return (
            <div
              className="city-district-label"
              key={d}
              style={{ left: layout.left, top: layout.top - 22 }}
            >
              {layout.label}
            </div>
          );
        })}

        {buildings.map((b) => {
          const layout = districtLayout[b.district];
          const left = layout.left + b.col * CELL_W;
          const top = layout.top + b.row * CELL_H;
          return (
            <div key={b.id} className="city-building" style={{ left, top }} title={b.name}>
              <img src={b.sprite} alt={b.name} draggable={false} />
              <span className="city-building-label">{b.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
