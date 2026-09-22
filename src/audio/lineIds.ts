import { fragments } from '../data/fragments'
import { endings, postCredits, toneReplies } from '../data/endings'
import { prologueLines } from '../data/prologue'
import type { Outcome } from '../data/types'

export interface VoiceLine {
  id: string
  text: string
}

/**
 * Deterministic voice-line ID scheme, shared by the audio manifest builder (for TTS export)
 * and the game store (to know which file to request during playback). Convention:
 * public/audio/vesper/<id>.mp3
 */
export const lineIds = {
  prologue: (i: number) => `prologue-${i}`,
  fragmentIntro: (fragmentId: number, i: number) => `f${fragmentId}-intro-${i}`,
  fragmentAdvance: (fragmentId: number, i: number) => `f${fragmentId}-advance-${i}`,
  fragmentResponse: (fragmentId: number, outcome: Outcome, i: number) => `f${fragmentId}-${outcome}-${i}`,
  endingMonologue: (key: 'high' | 'low', i: number) => `ending-${key}-${i}`,
  toneReply: (tone: string, i: number) => `tone-${tone}-${i}`,
  endingClosing: (key: 'high' | 'low') => `ending-${key}-closing`,
  postCredits: (i: number) => `postcredits-${i}`,
}

/** Flattens every Vesper line in the game into a single manifest, for offline TTS generation. */
export function getAllVoiceLines(): VoiceLine[] {
  const lines: VoiceLine[] = []

  prologueLines.forEach((text, i) => lines.push({ id: lineIds.prologue(i), text }))

  for (const fragment of fragments) {
    fragment.vesperIntro.forEach((text, i) => lines.push({ id: lineIds.fragmentIntro(fragment.id, i), text }))
    ;(fragment.multiTurnAdvanceLine ?? []).forEach((text, i) =>
      lines.push({ id: lineIds.fragmentAdvance(fragment.id, i), text }),
    )
    for (const outcome of ['full', 'partial', 'lost'] as Outcome[]) {
      ;(fragment.vesperResponse[outcome] ?? []).forEach((text, i) =>
        lines.push({ id: lineIds.fragmentResponse(fragment.id, outcome, i), text }),
      )
    }
  }

  for (const key of ['high', 'low'] as const) {
    endings[key].monologue.forEach((text, i) => lines.push({ id: lineIds.endingMonologue(key, i), text }))
    lines.push({ id: lineIds.endingClosing(key), text: endings[key].closingLine })
  }

  for (const reply of toneReplies) {
    reply.vesperReply.forEach((text, i) => lines.push({ id: lineIds.toneReply(reply.tone, i), text }))
  }

  postCredits.lines.forEach((text, i) => lines.push({ id: lineIds.postCredits(i), text }))

  return lines
}
