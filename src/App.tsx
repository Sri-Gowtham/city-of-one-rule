import { useState } from "react";
import { Sim } from "./sim/engine";
import { GameView } from "./ui/GameView";
import { TitleScreen } from "./ui/TitleScreen";

export default function App() {
  const [game, setGame] = useState<{ sim: Sim; key: number } | null>(null);

  if (!game) {
    return <TitleScreen onStart={(eras) => setGame({ sim: new Sim(Math.floor(Math.random() * 1e9), eras), key: Date.now() })} />;
  }
  return <GameView key={game.key} sim={game.sim} onRestart={() => setGame(null)} />;
}
