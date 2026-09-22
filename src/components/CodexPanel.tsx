import { useState } from 'react'
import { fragments } from '../data/fragments'
import type { CodexState, FragmentId, Outcome } from '../data/types'

interface CodexPanelProps {
  fragmentStates: Record<FragmentId, CodexState>
  fragmentOutcomes: Partial<Record<FragmentId, Outcome>>
  open: boolean
  showLocked: boolean
  onClose: () => void
}

const STATE_ICON: Record<CodexState, string> = {
  unattempted: '···',
  full: '✓',
  partial: '◌',
  lost: '✕',
  contested: '⚠',
  locked: '?',
}

export function CodexPanel({ fragmentStates, open, showLocked, onClose }: CodexPanelProps) {
  const [selected, setSelected] = useState<FragmentId>(1)
  if (!open) return null

  const fragment = fragments.find((f) => f.id === selected)!
  const state = fragmentStates[selected]

  const bodyText =
    state === 'full' || state === 'contested'
      ? fragment.codex.full
      : state === 'partial'
        ? (fragment.codex.partial ?? fragment.codex.full)
        : state === 'lost'
          ? fragment.codex.lostNote
          : 'Not yet asked.'

  const showPortrait = fragment.codex.portrait && (state === 'full' || state === 'partial' || state === 'contested')

  return (
    <div className="codex-overlay" role="dialog" aria-label="Codex">
      <div className="codex-panel">
        <button className="codex-panel__close" onClick={onClose} aria-label="Close Codex">
          ×
        </button>
        <div className="codex-panel__list">
          {fragments.map((f) => (
            <button
              key={f.id}
              className={`codex-panel__item ${selected === f.id ? 'is-selected' : ''}`}
              onClick={() => setSelected(f.id)}
            >
              <span>Fragment {String(f.id).padStart(2, '0')}</span>
              <span className={`codex-panel__status codex-panel__status--${fragmentStates[f.id]}`}>
                {STATE_ICON[fragmentStates[f.id]]}
              </span>
            </button>
          ))}
          {showLocked && (
            <div className="codex-panel__item codex-panel__item--locked">
              <span>Fragment ??</span>
              <span className="codex-panel__status">?</span>
            </div>
          )}
        </div>
        <div className="codex-panel__detail">
          <h3 className="narrative">{fragment.codex.title}</h3>
          {showPortrait && (
            <img
              className={`codex-panel__portrait codex-panel__portrait--${fragment.codex.portrait}`}
              src={`/images/portraits/${fragment.codex.portrait}.png`}
              alt=""
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <p className="codex-panel__body">{bodyText}</p>
        </div>
      </div>
    </div>
  )
}
