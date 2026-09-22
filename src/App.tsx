import { useEffect, useMemo, useState } from 'react'
import { ArchiveScene } from './components/ArchiveScene'
import { DialoguePanel } from './components/DialoguePanel'
import { PromptInput } from './components/PromptInput'
import { CodexPanel } from './components/CodexPanel'
import { EndingScreen } from './components/EndingScreen'
import { latestVesperTurn, useGameStore, type LogEntry } from './state/gameStore'
import { getSceneVisualState } from './engine/decayState'
import { AudioManager } from './audio/AudioManager'
import { lineIds } from './audio/lineIds'
import { prologueLines } from './data/prologue'
import { fragmentById, fragments } from './data/fragments'

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 640

function App() {
  const phase = useGameStore((s) => s.phase)
  const currentFragmentId = useGameStore((s) => s.currentFragmentId)
  const log = useGameStore((s) => s.log)
  const fragmentStates = useGameStore((s) => s.fragmentStates)
  const fragmentOutcomes = useGameStore((s) => s.fragmentOutcomes)
  const endingTone = useGameStore((s) => s.endingTone)
  const submitPrompt = useGameStore((s) => s.submitPrompt)
  const continueToNextFragment = useGameStore((s) => s.continueToNextFragment)
  const startGame = useGameStore((s) => s.startGame)
  const endingKey = useGameStore((s) => s.endingKey())

  const [turnRevealed, setTurnRevealed] = useState(false)
  const [codexOpen, setCodexOpen] = useState(false)

  const prologueTurn = useMemo<LogEntry[]>(
    () => prologueLines.map((text, i) => ({ role: 'vesper', text, voiceId: lineIds.prologue(i) })),
    [],
  )
  const dialogueTurn = useMemo(() => latestVesperTurn(log), [log])
  const activeTurn = phase === 'prologue' ? prologueTurn : dialogueTurn

  useEffect(() => {
    setTurnRevealed(false)
  }, [activeTurn])

  const activeFragment = fragmentById.get(currentFragmentId)
  const sceneVisual = useMemo(
    () => getSceneVisualState(phase === 'ending' ? 10 : currentFragmentId),
    [phase, currentFragmentId],
  )

  useEffect(() => {
    const act = phase === 'ending' ? 3 : (activeFragment?.act ?? 1)
    AudioManager.crossfadeAmbient(act)
  }, [activeFragment?.act, phase])

  useEffect(() => {
    if (phase !== 'fragmentResolved') return
    const outcome = fragmentOutcomes[currentFragmentId]
    if (outcome === 'lost') AudioManager.playSfx('loss')
    else if (outcome) AudioManager.playSfx('glyph-lock')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentFragmentId])

  function handleSubmitPrompt(text: string) {
    AudioManager.playSfx('submit')
    submitPrompt(text)
  }

  const showPromptInput = phase === 'fragment' && turnRevealed
  const showContinue = phase === 'fragmentResolved' && turnRevealed
  const recoveredCount = Object.values(fragmentStates).filter(
    (s) => s === 'full' || s === 'partial' || s === 'contested',
  ).length

  return (
    <div className="app-root">
      <div className="scene-layer">
        <ArchiveScene visual={sceneVisual} highFidelity={!IS_MOBILE} />
      </div>

      {phase === 'prologue' && (
        <div className="prologue-screen">
          <DialoguePanel turn={prologueTurn} onTurnRevealed={() => setTurnRevealed(true)} />
          {turnRevealed && (
            <button className="continue-bar__button" onClick={startGame}>
              Enter the Archive
            </button>
          )}
        </div>
      )}

      {(phase === 'fragment' || phase === 'fragmentResolved') && (
        <div className="overlay-layer">
          <div className="hud-bar">
            <span>ARCHIVE SESSION — ACT {activeFragment?.act ?? 1}</span>
            <button className="hud-bar__codex-button" onClick={() => setCodexOpen(true)}>
              CODEX — {recoveredCount} / {fragments.length}
            </button>
          </div>

          <div>
            <DialoguePanel turn={dialogueTurn} onTurnRevealed={() => setTurnRevealed(true)} />
            {showPromptInput && <PromptInput onSubmit={handleSubmitPrompt} />}
            {showContinue && (
              <div className="continue-bar">
                <button className="continue-bar__button" onClick={continueToNextFragment}>
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'ending' && <EndingScreen endingKey={endingKey} endingTone={endingTone} />}

      <CodexPanel
        fragmentStates={fragmentStates}
        fragmentOutcomes={fragmentOutcomes}
        open={codexOpen}
        showLocked={phase === 'ending'}
        onClose={() => setCodexOpen(false)}
      />
    </div>
  )
}

export default App
