import { MetricsBar } from "./components/MetricsBar";
import { CityView } from "./components/CityView";
import { RulePanel } from "./components/RulePanel";
import { NewsFeed } from "./components/NewsFeed";
import { EndReport } from "./components/EndReport";
import { useGameState } from "./state/useGameState";
import "./App.css";

function App() {
  const {
    metrics,
    culture,
    era,
    totalEras,
    choices,
    history,
    latestRecord,
    gameOver,
    chooseRule,
    reset,
  } = useGameState();

  return (
    <div className="app-shell">
      <MetricsBar metrics={metrics} day={Math.min(era, totalEras)} />
      <main className="app-main">
        <CityView />
        <NewsFeed record={latestRecord} />
      </main>
      <RulePanel choices={choices} onChoose={chooseRule} disabled={gameOver} />
      {gameOver && (
        <EndReport metrics={metrics} culture={culture} history={history} onRestart={reset} />
      )}
    </div>
  );
}

export default App;
