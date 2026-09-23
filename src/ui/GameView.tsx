import { useEffect, useMemo, useRef, useState } from "react";
import type { Sim } from "../sim/engine";
import type { FrontPage, RuleId } from "../sim/types";
import { CityRenderer } from "../render/renderer";
import type { Pick } from "../render/renderer";
import { CityCanvas } from "./CityCanvas";
import { BottomBar, TopBar } from "./Hud";
import type { Tab } from "./Hud";
import { EventFeed, LensPanel } from "./Lens";
import { Newspaper, RuleDraft, SocietyReport } from "./Modals";
import { BusinessesPanel, NewsPanel, PeoplePanel } from "./Panels";
import { useSimTick } from "./useSim";

export function GameView({ sim, onRestart }: { sim: Sim; onRestart: () => void }) {
  useSimTick(sim);
  const renderer = useMemo(() => new CityRenderer(), [sim]);
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  speedRef.current = speed;
  const [selected, setSelected] = useState<Pick>(null);
  const [follow, setFollow] = useState(false);
  const [tab, setTab] = useState<Tab>("city");
  const [draftOpen, setDraftOpen] = useState(true);
  const [reportOpen, setReportOpen] = useState(true);
  const [archived, setArchived] = useState<FrontPage | null>(null);
  const phase = sim.phase;

  useEffect(() => {
    sim.watchId = selected?.type === "citizen" ? selected.id : null;
    renderer.followId = follow && selected?.type === "citizen" ? selected.id : null;
  }, [sim, renderer, selected, follow]);

  useEffect(() => {
    if (phase === "choosing") setDraftOpen(true);
    if (phase !== "running" && speed === 30) setSpeed(1);
    if (phase === "report") setReportOpen(true);
  }, [phase, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        setSpeed((s) => (s === 0 ? 1 : 0));
      } else if (e.key === "1") setSpeed(1);
      else if (e.key === "2") setSpeed(2);
      else if (e.key === "3") setSpeed(4);
      else if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectCitizen = (id: number) => {
    setSelected({ type: "citizen", id });
    setFollow(true);
    setTab("city");
  };
  const choose = (id: RuleId) => {
    sim.startEra(id);
    setTab("city");
    setSpeed((s) => (s === 0 ? 1 : s));
  };
  const latest = sim.papers[sim.papers.length - 1];

  return (
    <div className="game">
      <TopBar sim={sim} />
      <div className="stage">
        <CityCanvas
          sim={sim}
          renderer={renderer}
          speedRef={speedRef}
          selected={selected}
          onPick={(p) => {
            setSelected(p);
            if (!p || p.type !== "citizen") setFollow(false);
          }}
        />
        {tab === "city" && (
          <>
            <EventFeed sim={sim} onSelect={selectCitizen} />
            <LensPanel sim={sim} selected={selected} follow={follow} setFollow={setFollow} onSelect={(p) => setSelected(p)} />
            <div className="hint">Drag to pan · scroll to zoom · click a person to follow them · space to pause</div>
          </>
        )}
        {tab === "people" && <PeoplePanel sim={sim} onSelect={selectCitizen} />}
        {tab === "businesses" && (
          <BusinessesPanel
            sim={sim}
            onSelect={(id) => {
              setSelected({ type: "building", id });
              setFollow(false);
              const b = sim.world.buildings[id];
              renderer.centerOn(b.x + b.w / 2, b.y + b.h / 2);
              setTab("city");
            }}
          />
        )}
        {tab === "news" && <NewsPanel sim={sim} onOpen={setArchived} />}

        {phase === "choosing" && draftOpen && <RuleDraft sim={sim} onChoose={choose} onPeek={() => setDraftOpen(false)} />}
        {phase === "newspaper" && latest && (
          <Newspaper
            paper={latest}
            cta={sim.era >= sim.totalEras ? "SEE WHAT YOUR CITY BECAME →" : "CONTINUE TO DAY " + (sim.era + 1) + " →"}
            onClose={() => sim.continueAfterPaper()}
          />
        )}
        {archived && <Newspaper paper={archived} cta="BACK" onClose={() => setArchived(null)} />}
        {phase === "report" && reportOpen && <SocietyReport sim={sim} onRestart={onRestart} onExplore={() => setReportOpen(false)} />}
      </div>
      <BottomBar
        sim={sim}
        tab={tab}
        setTab={setTab}
        speed={speed}
        setSpeed={setSpeed}
        onChooseRule={() => setDraftOpen(true)}
        onShowReport={() => setReportOpen(true)}
      />
    </div>
  );
}
