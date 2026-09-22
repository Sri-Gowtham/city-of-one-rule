import type { CodexState, FragmentDefinition, FragmentId, KeywordGroup, Outcome, ToneReply } from '../data/types'

export interface JudgeContext {
  /** Resolves another fragment's current Codex state — used by 'dependency' judges. */
  getFragmentState: (id: FragmentId) => CodexState
  /** For 'multiTurn' fragments: which step (0-indexed) the player is currently on. */
  multiTurnStep?: number
}

export interface JudgeResult {
  outcome: Outcome
  /** 'multiTurn' only: true if this result should advance to the next step rather than resolve the fragment. */
  advanceStep?: boolean
  /** 'toneOnly' only: which of Vesper's scripted replies this prompt earns. */
  tone?: ToneReply['tone']
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function normalize(text: string): string {
  return text.toLowerCase()
}

function matchesKeywordGroups(promptLower: string, groups: KeywordGroup[] | undefined): boolean {
  if (!groups || groups.length === 0) return true
  return groups.some((group) => group.keywords.some((kw) => promptLower.includes(kw.toLowerCase())))
}

function matchesAny(promptLower: string, phrases: string[] | undefined): boolean {
  if (!phrases || phrases.length === 0) return false
  return phrases.some((p) => promptLower.includes(p.toLowerCase()))
}

/**
 * A precise, on-topic, appropriately-scoped prompt earns 'full'. An on-topic but vague,
 * too-short, or too-long/rambling prompt earns 'partial'. An off-topic or empty prompt
 * loses the fragment entirely, mirroring the story's own in-fiction rule: a long vague
 * question returns a long vague answer, and asking nothing relevant returns nothing.
 */
function judgeStandard(fragment: FragmentDefinition, promptText: string): Outcome {
  const promptLower = normalize(promptText)
  const words = wordCount(promptText)
  const { judging } = fragment

  if (words === 0) return 'lost'
  if (!matchesKeywordGroups(promptLower, judging.topicGroups)) return 'lost'

  const tooShort = judging.minWords != null && words < judging.minWords
  const tooLong = judging.maxWords != null && words > judging.maxWords
  const generic = matchesAny(promptLower, judging.vaguePhrases)

  if (tooShort || tooLong || generic) return 'partial'

  const precise = matchesAny(promptLower, judging.precisionKeywords)
  return precise ? 'full' : 'partial'
}

function judgeContested(fragment: FragmentDefinition, promptText: string): Outcome {
  const promptLower = normalize(promptText)
  const words = wordCount(promptText)
  if (words === 0) return 'lost'
  return matchesKeywordGroups(promptLower, fragment.judging.topicGroups) ? 'full' : 'lost'
}

function judgeDependency(fragment: FragmentDefinition, promptText: string, ctx: JudgeContext): Outcome {
  const base = judgeStandard(fragment, promptText)
  if (base !== 'full') return base
  const dependsOn = fragment.judging.dependsOn
  if (dependsOn == null) return base
  const priorState = ctx.getFragmentState(dependsOn)
  return priorState === 'full' ? 'full' : 'partial'
}

function judgeEmpathy(fragment: FragmentDefinition, promptText: string): Outcome {
  const promptLower = normalize(promptText)
  const words = wordCount(promptText)
  const { judging } = fragment
  if (judging.minWords != null && words < judging.minWords) return 'lost'
  if (words === 0) return 'lost'
  const empathetic = matchesAny(promptLower, judging.empathyKeywords)
  return empathetic ? 'full' : 'partial'
}

function judgeMultiTurn(fragment: FragmentDefinition, promptText: string, ctx: JudgeContext): JudgeResult {
  const steps = fragment.judging.steps ?? []
  const stepIndex = ctx.multiTurnStep ?? 0
  const step = steps[stepIndex]
  if (!step) return { outcome: 'lost' }

  const promptLower = normalize(promptText)
  const words = wordCount(promptText)
  if (words === 0 || !matchesKeywordGroups(promptLower, step.topicGroups)) {
    // A miss on step 0 loses the fragment outright; a miss on step 1 leaves it at 'partial'.
    return { outcome: stepIndex === 0 ? 'lost' : 'partial' }
  }

  const isLastStep = stepIndex === steps.length - 1
  return isLastStep ? { outcome: 'full' } : { outcome: 'partial', advanceStep: true }
}

const TONE_UNCERTAIN_MARKERS = ["don't know", 'not sure', 'maybe', 'perhaps', 'want to believe', 'i think so', 'hope so', 'i hope']
const TONE_CERTAIN_MARKERS = ['yes', 'of course', 'definitely', 'certainly', 'absolutely', 'it matters', 'it does matter', 'always']

function classifyTone(promptText: string): ToneReply['tone'] {
  const trimmed = promptText.trim()
  const lower = normalize(trimmed)
  if (trimmed.length === 0) return 'fallback'

  const asksBack = trimmed.endsWith('?') && (lower.includes('you') || lower.includes('vesper'))
  if (asksBack) return 'reflective'

  if (matchesAny(lower, TONE_UNCERTAIN_MARKERS)) return 'uncertain'
  if (matchesAny(lower, TONE_CERTAIN_MARKERS)) return 'certain'

  return 'fallback'
}

export function judgePrompt(fragment: FragmentDefinition, promptText: string, ctx: JudgeContext): JudgeResult {
  switch (fragment.judging.type) {
    case 'standard':
      return { outcome: judgeStandard(fragment, promptText) }
    case 'contested':
      return { outcome: judgeContested(fragment, promptText) }
    case 'dependency':
      return { outcome: judgeDependency(fragment, promptText, ctx) }
    case 'empathy':
      return { outcome: judgeEmpathy(fragment, promptText) }
    case 'multiTurn':
      return judgeMultiTurn(fragment, promptText, ctx)
    case 'toneOnly':
      return { outcome: 'full', tone: classifyTone(promptText) }
    default:
      return { outcome: 'lost' }
  }
}

/**
 * Maps a fragment + outcome to the Codex display state. Fragment 4 is a special case:
 * a full recovery is always flagged 'contested' rather than plain 'full', per the story's
 * own instruction that this entry is marked CONTESTED regardless of how well it's held.
 */
export function deriveCodexState(fragment: FragmentDefinition, outcome: Outcome): CodexState {
  if (fragment.judging.type === 'contested' && outcome === 'full') return 'contested'
  return outcome
}
