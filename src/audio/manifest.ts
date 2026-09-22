export type SfxId = 'text-tick' | 'glyph-lock' | 'loss' | 'submit' | 'ending-swell'

export function voiceLinePath(id: string): string {
  return `/audio/vesper/${id}.mp3`
}

export function ambientLoopPath(act: 1 | 2 | 3): string {
  return `/audio/ambient/act-${act}.mp3`
}

export function sfxPath(id: SfxId): string {
  return `/audio/sfx/${id}.mp3`
}
