import { useState } from "react";
import { MetricsBar } from "./components/MetricsBar";
import { CityView } from "./components/CityView";
import { RulePanel } from "./components/RulePanel";
import { initialMetrics } from "./data/metrics";
import "./App.css";

function App() {
  const [metrics] = useState(initialMetrics);
  const [day] = useState(1);

  return (
    <div className="app-shell">
      <MetricsBar metrics={metrics} day={day} />
      <main className="app-main">
        <CityView />
      </main>
      <RulePanel />
    </div>
  );
}

export default App;
