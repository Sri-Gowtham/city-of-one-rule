import { Howl, Howler } from 'howler'
import { ambientLoopPath, sfxPath, voiceLinePath, type SfxId } from './manifest'

/**
 * Layered playback for voice, ambient bed, and SFX. All assets are static files generated
 * once offline (see the audio pipeline in the build plan) — nothing is fetched or generated
 * at runtime. Missing/unloaded files fail silently so the game is always playable without them.
 */
class AudioManagerImpl {
  private voiceHowl: Howl | null = null
  private ambientHowl: Howl | null = null
  private currentAmbientAct: 1 | 2 | 3 | null = null
  private sfxCache = new Map<SfxId, Howl>()

  playVoiceLine(id: string, onEnd?: () => void) {
    this.voiceHowl?.stop()
    const howl = new Howl({
      src: [voiceLinePath(id)],
      html5: true,
      onloaderror: () => onEnd?.(),
      onplayerror: () => onEnd?.(),
      onend: () => onEnd?.(),
    })
    this.voiceHowl = howl
    howl.play()
  }

  stopVoice() {
    this.voiceHowl?.stop()
  }

  crossfadeAmbient(act: 1 | 2 | 3, durationMs = 2000) {
    if (this.currentAmbientAct === act) return
    const previous = this.ambientHowl

    const next = new Howl({
      src: [ambientLoopPath(act)],
      loop: true,
      volume: 0,
      html5: true,
      onloaderror: () => {
        /* missing ambient asset — no bed plays, game continues */
      },
    })
    next.play()
    next.fade(0, 0.4, durationMs)

    if (previous) {
      previous.fade(previous.volume(), 0, durationMs)
      setTimeout(() => previous.unload(), durationMs + 100)
    }

    this.ambientHowl = next
    this.currentAmbientAct = act
  }

  playSfx(id: SfxId) {
    let howl = this.sfxCache.get(id)
    if (!howl) {
      howl = new Howl({ src: [sfxPath(id)], onloaderror: () => {} })
      this.sfxCache.set(id, howl)
    }
    howl.play()
  }

  setMuted(muted: boolean) {
    Howler.mute(muted)
  }

  stopAll() {
    this.voiceHowl?.stop()
    this.ambientHowl?.stop()
  }
}

export const AudioManager = new AudioManagerImpl()
