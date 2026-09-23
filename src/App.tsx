import { useState } from "react";
import { MetricsBar } from "./components/MetricsBar";
import { CityView } from "./components/CityView";
import { RulePanel } from "./components/RulePanel";
import type { ViewTab } from "./components/RulePanel";
import { NewsFeed } from "./components/NewsFeed";
import { PeoplePanel } from "./components/PeoplePanel";
import { BusinessesPanel } from "./components/BusinessesPanel";
import { NewsHistoryPanel } from "./components/NewsHistoryPanel";
import { EndReport } from "./components/EndReport";
import { useGameState } from "./state/useGameState";
import "./App.css";

function App() {
  const {
    metrics,
    culture,
    businessStates,
    era,
    totalEras,
    choices,
    history,
    latestRecord,
    gameOver,
    chooseRule,
    reset,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<ViewTab>("city");

  return (
    <div className="app-shell">
      <MetricsBar metrics={metrics} day={Math.min(era, totalEras)} />
      <main className="app-main">
        {activeTab === "city" && (
          <>
            <CityView />
            <NewsFeed record={latestRecord} />
          </>
        )}
        {activeTab === "people" && <PeoplePanel />}
        {activeTab === "businesses" && <BusinessesPanel states={businessStates} />}
        {activeTab === "news" && <NewsHistoryPanel history={history} />}
      </main>
      <RulePanel
        choices={choices}
        onChoose={chooseRule}
        disabled={gameOver}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {gameOver && (
        <EndReport metrics={metrics} culture={culture} history={history} onRestart={reset} />
      )}
    </div>
  );
}

export default App;
