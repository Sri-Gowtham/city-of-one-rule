import { buildings } from "../data/buildings";
import "./CityView.css";

const TILE_W = 190;
const TILE_H = 110;

export function CityView() {
  return (
    <div className="city-view">
      <div className="city-grid">
        {buildings.map((b) => {
          const left = (b.gridX - b.gridY) * (TILE_W / 2);
          const top = (b.gridX + b.gridY) * (TILE_H / 2);
          return (
            <div
              key={b.id}
              className="city-building"
              style={{ left, top }}
              title={b.name}
            >
              <img src={b.sprite} alt={b.name} draggable={false} />
              <span className="city-building-label">{b.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
