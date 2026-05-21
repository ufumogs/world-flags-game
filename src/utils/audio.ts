// Sound manager built on the Web Audio API.
//
// WHY programmatic generation instead of audio files:
//   - Zero network requests — oscillators start on the same audio quantum as the call
//   - No asset pipeline, no licensing, no CDN
//   - Parameters (pitch, duration, gain) are plain numbers — easy to tune later
//   - The AudioContext is lazily created on the first user gesture, which is the
//     only way browsers permit audio playback without an auto-play policy violation
//
// WHY a singleton class (not a hook):
//   - AudioContext must be a single instance per page (browsers enforce this)
//   - The enabled state must survive component unmounts (e.g. between quiz phases)
//   - React hooks can't hold long-lived audio resources reliably across re-renders
//   - The class is the "audio engine"; useSound() is just a thin UI sync wrapper

export type SoundType = 'correct' | 'incorrect' | 'complete' | 'click'

const STORAGE_KEY = 'flags-quiz-sound-enabled'

class SoundManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private _enabled: boolean

  constructor() {
    // Default to ON; only opt-out if the user explicitly disabled it before
    const stored = localStorage.getItem(STORAGE_KEY)
    this._enabled = stored !== 'false'
  }

  get enabled(): boolean {
    return this._enabled
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled
    localStorage.setItem(STORAGE_KEY, String(enabled))
  }

  play(type: SoundType): void {
    if (!this._enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return // AudioContext unavailable (e.g. sandboxed iframe)

    switch (type) {
      case 'correct':   this.playCorrect(ctx);   break
      case 'incorrect': this.playIncorrect(ctx); break
      case 'complete':  this.playComplete(ctx);  break
      case 'click':     this.playClick(ctx);     break
    }
  }

  // ── AudioContext lifecycle ───────────────────────────────────────────────────

  private ensureContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext()
        this.master = this.ctx.createGain()
        this.master.gain.value = 0.75 // global headroom — prevents clipping
        this.master.connect(this.ctx.destination)
      }
      // Browsers suspend the context until a user gesture has occurred.
      // By the time play() is called (on a button click), the gesture has happened.
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume()
      }
      return this.ctx
    } catch {
      return null
    }
  }

  // ── Shared oscillator helper ─────────────────────────────────────────────────
  //
  // Builds an oscillator → gain envelope → master chain.
  // The gain follows attack (10ms linear) → exponential decay to near-zero.
  // This gives a "pluck" shape that feels snappy and natural.

  private tone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    peak: number,
    type: OscillatorType = 'sine',
  ): void {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(this.master!)

    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)

    const attack = 0.008 // 8 ms — fast but not a click
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(peak, startTime + attack)
    // exponentialRamp can't go to exactly 0 — use 0.0001 as floor
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.01) // tiny tail so gain reaches floor cleanly
  }

  // ── Individual sounds ────────────────────────────────────────────────────────
  //
  // Design principle: correct feels rewarding (ascending, bright),
  // incorrect feels gentle (descending, soft, single note),
  // complete feels earned (mini arpeggio), click is barely there.

  private playCorrect(ctx: AudioContext): void {
    const t = ctx.currentTime
    // Two ascending notes: E5 → B5 (a perfect fifth — universally pleasant)
    this.tone(ctx, 659.25, t,        0.18, 0.26) // E5
    this.tone(ctx, 987.77, t + 0.1,  0.22, 0.21) // B5
  }

  private playIncorrect(ctx: AudioContext): void {
    const t = ctx.currentTime
    // Single descending pitch slide: E4 → B3 over 280ms
    // A slide says "wrong" more clearly than a flat tone, without being harsh
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(this.master!)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(329.63, t)                          // E4
    osc.frequency.exponentialRampToValueAtTime(246.94, t + 0.28)    // B3

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.17, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)

    osc.start(t)
    osc.stop(t + 0.32)
  }

  private playComplete(ctx: AudioContext): void {
    const t = ctx.currentTime
    // Ascending C major arpeggio: C5 → E5 → G5 → C6
    // Universally associated with victory; last note is longer and louder
    const notes   = [523.25, 659.25, 783.99, 1046.5]
    const step    = 0.11  // 110 ms between each note
    const gains   = [0.22, 0.22, 0.22, 0.30]
    const lengths = [0.14, 0.14, 0.14, 0.50]

    notes.forEach((freq, i) => {
      this.tone(ctx, freq, t + i * step, lengths[i], gains[i])
    })
  }

  private playClick(ctx: AudioContext): void {
    const t = ctx.currentTime
    // Near-imperceptible tick — adds tactility without being distracting
    this.tone(ctx, 1000, t, 0.04, 0.055)
  }
}

// One instance for the entire app lifetime
export const soundManager = new SoundManager()
