import { create } from 'zustand'
import { fragmentById, fragments } from '../data/fragments'
import { HIGH_ENDING_THRESHOLD, toneReplies } from '../data/endings'
import { deriveCodexState, judgePrompt } from '../engine/promptJudge'
import { lineIds } from '../audio/lineIds'
import type { CodexState, FragmentId, Outcome } from '../data/types'

export type GamePhase = 'prologue' | 'fragment' | 'fragmentResolved' | 'ending'

export interface LogEntry {
  role: 'vesper' | 'player'
  text: string
  /** Voice line ID for playback (Vesper lines only). */
  voiceId?: string
}

function vesperLines(texts: string[], idFor: (i: number) => string): LogEntry[] {
  return texts.map((text, i) => ({ role: 'vesper', text, voiceId: idFor(i) }))
}

interface GameState {
  phase: GamePhase
  currentFragmentId: FragmentId
  multiTurnStep: number
  fragmentStates: Record<FragmentId, CodexState>
  fragmentOutcomes: Partial<Record<FragmentId, Outcome>>
  endingTone: (typeof toneReplies)[number]['tone'] | null
  log: LogEntry[]

  startGame: () => void
  advancePrologue: () => void
  submitPrompt: (text: string) => void
  continueToNextFragment: () => void
  completionScore: () => number
  endingKey: () => 'high' | 'low'
}

const initialFragmentStates = (): Record<FragmentId, CodexState> =>
  Object.fromEntries(fragments.map((f) => [f.id, 'unattempted'])) as Record<FragmentId, CodexState>

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'prologue',
  currentFragmentId: 1,
  multiTurnStep: 0,
  fragmentStates: initialFragmentStates(),
  fragmentOutcomes: {},
  endingTone: null,
  log: [],

  startGame: () => {
    const first = fragmentById.get(1)!
    set({
      phase: 'fragment',
      currentFragmentId: 1,
      log: vesperLines(first.vesperIntro, (i) => lineIds.fragmentIntro(1, i)),
    })
  },

  advancePrologue: () => {
    get().startGame()
  },

  submitPrompt: (text: string) => {
    const state = get()
    if (state.phase !== 'fragment') return
    const fragment = fragmentById.get(state.currentFragmentId)!

    const result = judgePrompt(fragment, text, {
      getFragmentState: (id) => get().fragmentStates[id],
      multiTurnStep: state.multiTurnStep,
    })

    const logAfterPlayer: LogEntry[] = [...state.log, { role: 'player', text }]

    if (result.advanceStep) {
      const lines = fragment.multiTurnAdvanceLine ?? []
      set({
        multiTurnStep: state.multiTurnStep + 1,
        log: [...logAfterPlayer, ...vesperLines(lines, (i) => lineIds.fragmentAdvance(fragment.id, i))],
      })
      return
    }

    const codexState = deriveCodexState(fragment, result.outcome)
    const responseLines = fragment.vesperResponse[result.outcome] ?? fragment.vesperResponse.partial ?? []
    const outcomeForIds: Outcome = fragment.vesperResponse[result.outcome] ? result.outcome : 'partial'

    set({
      phase: 'fragmentResolved',
      fragmentStates: { ...state.fragmentStates, [fragment.id]: codexState },
      fragmentOutcomes: { ...state.fragmentOutcomes, [fragment.id]: result.outcome },
      endingTone: fragment.judging.type === 'toneOnly' ? result.tone ?? 'fallback' : state.endingTone,
      log: [
        ...logAfterPlayer,
        ...vesperLines(responseLines, (i) => lineIds.fragmentResponse(fragment.id, outcomeForIds, i)),
      ],
    })
  },

  continueToNextFragment: () => {
    const state = get()
    const nextId = (state.currentFragmentId + 1) as FragmentId
    const next = fragmentById.get(nextId)

    if (!next) {
      set({ phase: 'ending' })
      return
    }

    set({
      phase: 'fragment',
      currentFragmentId: nextId,
      multiTurnStep: 0,
      log: [...state.log, ...vesperLines(next.vesperIntro, (i) => lineIds.fragmentIntro(nextId, i))],
    })
  },

  completionScore: () => {
    const { fragmentOutcomes } = get()
    // Fragment 10 is unscored (toneOnly) and excluded from the completion calculation.
    const scored = fragments.filter((f) => f.judging.type !== 'toneOnly')
    const weight: Record<Outcome, number> = { full: 1, partial: 0.5, lost: 0 }
    const total = scored.reduce((sum, f) => {
      const outcome = fragmentOutcomes[f.id]
      return sum + (outcome ? weight[outcome] : 0)
    }, 0)
    return total / scored.length
  },

  endingKey: () => (get().completionScore() >= HIGH_ENDING_THRESHOLD ? 'high' : 'low'),
}))

/** The trailing run of Vesper lines since the last player message (or from the start, if none). */
export function latestVesperTurn(log: LogEntry[]): LogEntry[] {
  const turn: LogEntry[] = []
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const entry = log[i]
    if (entry.role === 'player') break
    turn.unshift(entry)
  }
  return turn
}
