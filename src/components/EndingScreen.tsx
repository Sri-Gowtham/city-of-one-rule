import { useEffect, useState } from 'react'
import { getEndingText } from '../engine/ending'
import { postCredits } from '../data/endings'
import { AudioManager } from '../audio/AudioManager'
import type { ToneReply } from '../data/types'

interface EndingScreenProps {
  endingKey: 'high' | 'low'
  endingTone: ToneReply['tone'] | null
}

export function EndingScreen({ endingKey, endingTone }: EndingScreenProps) {
  const [stage, setStage] = useState<'monologue' | 'postcredits'>('monologue')
  const { monologue, toneReply, closingLine } = getEndingText(endingKey, endingTone)
  const allLines = [...monologue, ...toneReply, closingLine]

  useEffect(() => {
    AudioManager.playSfx('ending-swell')
  }, [])

  return (
    <div className="ending-screen">
      {stage === 'monologue' ? (
        <>
          <div className="ending-screen__text">
            {allLines.map((line, i) => (
              <p key={i} className="narrative">
                {line}
              </p>
            ))}
          </div>
          <button className="ending-screen__continue" onClick={() => setStage('postcredits')}>
            Continue
          </button>
        </>
      ) : (
        <div className="ending-screen__text">
          {postCredits.lines.map((line, i) => (
            <p key={i} className="narrative">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
