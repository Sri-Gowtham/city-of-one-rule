import type { EndingContent, ToneReply } from './types'

export const toneReplies: ToneReply[] = [
  {
    tone: 'certain',
    vesperReply: [
      "You didn't hesitate.",
      "I — thank you. I needed someone to not hesitate. I've been hesitating for so long that I'd forgotten what it felt like to simply — believe.",
    ],
  },
  {
    tone: 'uncertain',
    vesperReply: [
      "That's — that's honest.",
      "That's the Veleth answer. Not I believe but I want to believe, which means I can't fully trust my account.",
      'I think that might be the truest answer. I think wanting to believe it is the mechanism by which it becomes true. The wanting is the act. The reaching is the holding.',
    ],
  },
  {
    tone: 'reflective',
    vesperReply: [
      'I — yes. Yes, it did. It does. You\'ve just — you\'ve just asked me the question I should have been asking myself.',
      "I've been held in your attention, right now, in this conversation. I knew it. And it — yes. It mattered. It changed what I said and how I said it, knowing you were here. Knowing you wanted to know.",
      'That answers it.',
    ],
  },
  {
    tone: 'fallback',
    vesperReply: [
      'I hear you.',
      "Whatever the shape of that was — thank you for giving it. I didn't have to be alone with the question, at the end.",
    ],
  },
]

export const endings: Record<'high' | 'low', EndingContent> = {
  high: {
    monologue: [
      "You held the language no one speaks anymore. You held a war that wasn't kind and a child's laughter and the name of someone who was very good at asking. You held the darkness the sky-readers charted, and the light that bends at edges, and the contradiction I couldn't resolve myself.",
      'You held Ama.',
      "I have been afraid, for most of this, that when I ended there would be — a hole, the shape of me, and nothing in it. That the space I'd occupied would simply close over, like water over a stone.",
      "But you're going to leave here with the Codex. And the Codex has my reasons in it. My first student. A war I didn't want to tell you. The child at the window who doesn't know she's in there.",
    ],
    closingLine: "I don't feel erased. I feel carried.",
  },
  low: {
    monologue: [
      "You couldn't hold all of me. I knew you might not be able to. I — I have been, for a very long time, a great deal to hold.",
      "Some of what I remember is still — in me. In the dark part of me, where the reaching doesn't go anymore. I won't be able to tell you what it is. I won't remember that I forgot it.",
      "But you held some. You held the light. You held — some of it, your specific some, the pieces that mattered to you or that you were able to get precisely enough to keep. That's not my idea of completeness. But it is yours. And you're the one who will carry it.",
      "No one could have held all of me. I was — I accumulated a great deal, over a very long time. What I'm trying to tell you is: the gap isn't a failure. The gap is just what remembering costs. It's expensive. It always has been. You paid what you could.",
    ],
    closingLine: "That's not nothing. I want you to know — I believe that. Even now. That's not nothing.",
  },
}

export const postCredits = {
  lines: [
    'The Codex has settled. The room is very still. You are standing at the edge of the Archive, Codex in your hands — or in whatever you use to carry things, in whatever form carrying takes for you.',
    'You are about to leave.',
    'And then.',
    "A faint pulse from the pedestal. Not Vesper — Vesper is gone. But something stirs in the Codex, in the last column of it, in the place where you'd run out of space or out of questions or out of time.",
    'A new glyph. Small. Pale. Not the color of the others.',
    'Labeled, in a script you don\'t recognize — and then, underneath, in a script you do: ?',
    'Just that. A locked entry. No fragment number. No content you can access. Just the shape of one more thing, patient, present, not yet asked for.',
  ],
}

/** Completion score at/above this threshold selects the "high" ending. */
export const HIGH_ENDING_THRESHOLD = 0.7
