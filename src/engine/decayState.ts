import type { FragmentId } from '../data/types'
import { fragmentById } from '../data/fragments'

export interface SceneVisualState {
  act: 1 | 2 | 3
  /** Number of glyphs drifting around the pedestal. */
  glyphCount: number
  /** Multiplier on the base drift/rotation speed. */
  motionSpeed: number
  /** 0–1: probability/intensity of a glyph flicker or brief dim-out. */
  flicker: number
  /** 0–1: how far the glow leans toward the warm amber palette. */
  warmBlend: number
  /** Bloom post-processing intensity. */
  bloomIntensity: number
  /** Volumetric fog density — lower in Act 3 (near-black, less haze, more focused light). */
  fogDensity: number
}

const BASE_STATE_BY_ACT: Record<1 | 2 | 3, Omit<SceneVisualState, 'act'>> = {
  1: { glyphCount: 12, motionSpeed: 1, flicker: 0, warmBlend: 0, bloomIntensity: 1, fogDensity: 0.06 },
  2: { glyphCount: 7, motionSpeed: 0.75, flicker: 0.25, warmBlend: 0.05, bloomIntensity: 0.85, fogDensity: 0.08 },
  3: { glyphCount: 3, motionSpeed: 0.5, flicker: 0.1, warmBlend: 0.4, bloomIntensity: 1.4, fogDensity: 0.04 },
}

/** Fragments whose dangerous/contested content briefly spikes flicker/aberration beyond the act baseline. */
const ABERRATION_FRAGMENTS = new Set<FragmentId>([4, 6])

/** Fragment 9's "child laughing at light" memory is the one full departure into the warm palette. */
const WARM_MEMORY_FRAGMENT: FragmentId = 9

export function getSceneVisualState(fragmentId: FragmentId): SceneVisualState {
  const fragment = fragmentById.get(fragmentId)
  const act = fragment?.act ?? 1
  const base = BASE_STATE_BY_ACT[act]

  // Glyph count steps down within an act as fragments progress, not just at act boundaries.
  const actFragmentIds = [...fragmentById.values()].filter((f) => f.act === act).map((f) => f.id)
  const indexInAct = actFragmentIds.indexOf(fragmentId)
  const stepDown = Math.max(0, indexInAct)
  const glyphCount = Math.max(2, base.glyphCount - stepDown)

  const aberration = ABERRATION_FRAGMENTS.has(fragmentId)
  const flicker = aberration ? Math.min(1, base.flicker + 0.35) : base.flicker

  if (fragmentId === WARM_MEMORY_FRAGMENT) {
    return { act, ...base, glyphCount, flicker, warmBlend: 0.9, bloomIntensity: base.bloomIntensity * 1.2 }
  }

  return { act, ...base, glyphCount, flicker }
}
