import { endings, toneReplies } from '../data/endings'
import type { ToneReply } from '../data/types'

export function getEndingText(endingKey: 'high' | 'low', tone: ToneReply['tone'] | null) {
  const ending = endings[endingKey]
  const reply = toneReplies.find((r) => r.tone === tone) ?? toneReplies.find((r) => r.tone === 'fallback')!
  return {
    monologue: ending.monologue,
    toneReply: reply.vesperReply,
    closingLine: ending.closingLine,
  }
}
