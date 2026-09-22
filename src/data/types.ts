export type FragmentId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type Act = 1 | 2 | 3

export type JudgeType =
  | 'standard' // topic + precision keyword matching
  | 'contested' // rewards re-asking after a contradiction
  | 'dependency' // standard, but full recovery gated on another fragment's state
  | 'multiTurn' // two sequential asks, each with its own keyword set
  | 'empathy' // rewards emotional/motive language over fact-seeking language
  | 'toneOnly' // unscored; only buckets the response's tone for the ending

export type Outcome = 'full' | 'partial' | 'lost'

export type CodexState = 'unattempted' | 'full' | 'partial' | 'lost' | 'contested' | 'locked'

export interface KeywordGroup {
  /** At least one of these (case-insensitive substring match) must appear for the prompt to be "on topic". */
  keywords: string[]
}

export interface MultiTurnStep {
  topicGroups: KeywordGroup[]
  precisionKeywords?: string[]
}

export interface JudgingRules {
  type: JudgeType
  /** At least one group must have a hit for the prompt to be considered on-topic at all. */
  topicGroups?: KeywordGroup[]
  /** Presence of any of these upgrades a partial recovery to a full one. */
  precisionKeywords?: string[]
  /** Prompts shorter than this (word count) are penalized as too vague. */
  minWords?: number
  /** Prompts longer than this (word count) are penalized as rambling/imprecise. */
  maxWords?: number
  /** Generic catch-all phrases that always trigger a vagueness penalty. */
  vaguePhrases?: string[]
  /** For type "dependency": the other fragment must be in 'full' state for this one to fully resolve. */
  dependsOn?: FragmentId
  /** For type "multiTurn": ordered steps, each judged independently. */
  steps?: MultiTurnStep[]
  /** For type "empathy": motive/feeling-seeking language, not fact-seeking language. */
  empathyKeywords?: string[]
}

export interface CodexEntryContent {
  title: string
  /** Full recovered text, shown when the fragment resolves to 'full'. */
  full: string
  /** Partial/incomplete text, shown (with a dotted-outline treatment) when resolved to 'partial'. */
  partial?: string
  /** Small in-fiction note shown when the fragment is lost entirely. */
  lostNote: string
  /** Portrait asset key, for the four human-referenced fragments only. */
  portrait?: 'sareen' | 'oldMan' | 'ama' | 'child'
}

export interface FragmentDefinition {
  id: FragmentId
  act: Act
  codexTitle: string
  /** Vesper's line(s) introducing/framing the fragment, in order. */
  vesperIntro: string[]
  judging: JudgingRules
  codex: CodexEntryContent
  /** Other fragment IDs this one is visually threaded to in the Codex. */
  linkedFragmentIds?: FragmentId[]
  /** Vesper's reaction after the player's prompt resolves (fragment is finalized). */
  vesperResponse: Partial<Record<Outcome, string[]>>
  /** multiTurn only: Vesper's line shown when a step succeeds and advances to the next step (not yet finalized). */
  multiTurnAdvanceLine?: string[]
}

export interface ToneReply {
  tone: 'certain' | 'uncertain' | 'reflective' | 'fallback'
  vesperReply: string[]
}

export interface EndingContent {
  /** Vesper's closing monologue, before the tone-specific line about Fragment 10 is appended. */
  monologue: string[]
  closingLine: string
}
