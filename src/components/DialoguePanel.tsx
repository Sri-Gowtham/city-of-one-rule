import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AudioManager } from '../audio/AudioManager'
import type { LogEntry } from '../state/gameStore'

function useTypewriter(text: string, speed = 22) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    setShown('')
    if (!text) return
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) window.clearInterval(id)
    }, speed)
    return () => window.clearInterval(id)
  }, [text, speed])
  return shown
}

interface DialoguePanelProps {
  /** The current unbroken run of Vesper lines to reveal in sequence. */
  turn: LogEntry[]
  onTurnRevealed: () => void
}

export function DialoguePanel({ turn, onTurnRevealed }: DialoguePanelProps) {
  const [lineIndex, setLineIndex] = useState(0)
  const revealedTurnRef = useRef<LogEntry[] | null>(null)
  const current = turn[lineIndex]
  const revealed = useTypewriter(current?.text ?? '')

  useEffect(() => {
    setLineIndex(0)
    revealedTurnRef.current = null
  }, [turn])

  useEffect(() => {
    if (!current) return
    AudioManager.playSfx('text-tick')
    if (current.voiceId) AudioManager.playVoiceLine(current.voiceId)
  }, [current])

  useEffect(() => {
    if (!current) return
    if (revealed.length !== current.text.length) return
    const timeout = window.setTimeout(() => {
      if (lineIndex < turn.length - 1) {
        setLineIndex((i) => i + 1)
      } else if (revealedTurnRef.current !== turn) {
        revealedTurnRef.current = turn
        onTurnRevealed()
      }
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [revealed, current, lineIndex, turn, onTurnRevealed])

  return (
    <div className="dialogue-panel">
      <AnimatePresence mode="wait">
        <motion.p
          key={lineIndex}
          className="narrative dialogue-panel__line"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {revealed}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
