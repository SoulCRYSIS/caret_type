import trackUrl from '../../assets/music/caret_ink_on_water_soft_loop.ogg'

const FADE_IN = 1.1
const FADE_OUT = 0.55

/**
 * Looping bed for a run. Its gain sits next to the effects bus, so the music
 * slider never moves the clacks and the effects slider never moves the bed.
 */
export class Music {
  private ctx: AudioContext | null = null
  private gain: GainNode | null = null
  private source: AudioBufferSourceNode | null = null
  /** A source we have faded out and will stop once the ramp finishes. */
  private fading: AudioBufferSourceNode | null = null
  private buffer: AudioBuffer | null = null
  private pending: Promise<AudioBuffer | null> | null = null
  private volume = 0.5
  private audible = false
  private generation = 0
  enabled = true

  attach(ctx: AudioContext): void {
    if (this.ctx === ctx && this.gain) return
    this.ctx = ctx
    this.gain = ctx.createGain()
    this.gain.gain.value = 0
    this.gain.connect(ctx.destination)
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v))
    if (this.audible && this.enabled && this.source) this.ramp(this.volume, 0.12)
  }

  /** Hear the loop from where it left off. */
  play(): void {
    this.audible = true
    this.generation++
    void this.ensure()
  }

  /** Keep the place in the loop, but fade the bed out. Used while the run is paused. */
  quiet(): void {
    this.audible = false
    this.generation++
    this.ramp(0, FADE_OUT)
  }

  /** Fade out and rewind, for leaving the run. */
  stop(): void {
    this.audible = false
    this.generation++
    this.ramp(0, FADE_OUT)
    const src = this.source
    this.source = null
    if (!src) return
    this.retire(src)
  }

  private retire(src: AudioBufferSourceNode): void {
    if (this.fading && this.fading !== src) {
      try { this.fading.disconnect() } catch { /* already gone */ }
      try { this.fading.stop() } catch { /* already stopped */ }
    }
    this.fading = src
    const gen = this.generation
    window.setTimeout(() => {
      if (this.generation !== gen || this.fading !== src) return
      try { src.stop() } catch { /* already stopped */ }
      try { src.disconnect() } catch { /* already gone */ }
      this.fading = null
    }, FADE_OUT * 1000)
  }

  private async ensure(): Promise<void> {
    const ctx = this.ctx
    if (!this.audible || !this.enabled || !ctx || !this.gain) return
    if (ctx.state === 'suspended') await ctx.resume()
    const gen = this.generation
    const buf = await this.load()
    if (!this.audible || !this.enabled || gen !== this.generation || !buf || !this.gain) return
    if (this.fading) {
      try { this.fading.disconnect() } catch { /* already gone */ }
      try { this.fading.stop() } catch { /* already stopped */ }
      this.fading = null
    }
    const fromSilence = !this.source || (this.gain?.gain.value ?? 0) < 0.02
    if (!this.source) this.spawn(buf)
    this.ramp(this.volume, fromSilence ? FADE_IN : 0.12)
  }

  private load(): Promise<AudioBuffer | null> {
    if (this.buffer) return Promise.resolve(this.buffer)
    const ctx = this.ctx
    if (!ctx) return Promise.resolve(null)
    if (!this.pending) {
      this.pending = fetch(trackUrl)
        .then((res) => {
          if (!res.ok) throw new Error('music')
          return res.arrayBuffer()
        })
        .then((raw) => ctx.decodeAudioData(raw))
        .then((buf) => {
          this.buffer = buf
          return buf
        })
        .catch(() => {
          this.pending = null
          return null
        })
    }
    return this.pending
  }

  private spawn(buf: AudioBuffer): void {
    const ctx = this.ctx
    const gain = this.gain
    if (!ctx || !gain) return
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    src.connect(gain)
    src.start()
    this.source = src
  }

  private ramp(value: number, seconds: number): void {
    const ctx = this.ctx
    const gain = this.gain
    if (!ctx || !gain) return
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(value, now + seconds)
  }
}

export const music = new Music()
