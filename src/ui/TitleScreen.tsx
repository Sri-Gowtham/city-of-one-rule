import { useMemo, useRef, useState } from "react";
import { Sim } from "../sim/engine";
import { CityRenderer } from "../render/renderer";
import { CityCanvas } from "./CityCanvas";
import { play, startAudio } from "./audio";

export function TitleScreen({ onStart }: { onStart: (eras: number) => void }) {
  const ambient = useMemo(() => {
    const s = new Sim(Math.floor(Math.random() * 1e9), 1, true);
    s.update(4);
    return s;
  }, []);
  const renderer = useMemo(() => new CityRenderer(), []);
  const speedRef = useRef(1.4);
  const [eras, setEras] = useState(10);

  return (
    <div className="title-screen">
      <CityCanvas sim={ambient} renderer={renderer} speedRef={speedRef} selected={null} interactive={false} />
      <div className="title-veil" />
      <div className="title-card">
        <div className="title-kicker">A SOCIAL SIMULATION</div>
        <h1 className="title">
          City <span>of</span> One Rule
        </h1>
        <p className="tagline">Change one rule. Watch a city change itself.</p>
        <p className="pitch">
          You are the temporary mayor. You don't control anyone — you control the <b>incentives</b>. Every day you choose one rule. Citizens,
          businesses and the press react. Behavior spreads. Repeated behavior becomes culture. Culture changes the city.
        </p>
        <ol className="how">
          <li>
            <b>Choose a rule</b>
            <span>One at a time, from what the city makes thinkable</span>
          </li>
          <li>
            <b>Watch the day unfold</b>
            <span>Follow any citizen and see who copies whom</span>
          </li>
          <li>
            <b>Read the evening paper</b>
            <span>Consequences, not scores</span>
          </li>
          <li>
            <b>See what you built</b>
            <span>A report on the society your rules produced</span>
          </li>
        </ol>
        <div className="title-actions">
          <div className="seg">
            <button className={eras === 10 ? "on" : ""} onClick={() => setEras(10)}>
              10 days
            </button>
            <button className={eras === 30 ? "on" : ""} onClick={() => setEras(30)}>
              30 days
            </button>
            <button className={!Number.isFinite(eras) ? "on" : ""} onClick={() => setEras(Infinity)}>
              Endless
            </button>
          </div>
          <button className="cta big" onClick={() => {
              startAudio();
              play("rule");
              onStart(eras);
            }}>
            TAKE OFFICE
          </button>
        </div>
      </div>
    </div>
  );
}
