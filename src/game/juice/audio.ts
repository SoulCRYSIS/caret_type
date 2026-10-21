/**
 * Procedural sound: typewriter clacks, ink splats and stamps, synthesized with Web Audio
 * so there are no audio assets to load.
 */
export class Synth {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private volume = 0.6
  enabled = true

  setVolume(v: number): void {
    this.volume = v
    if (this.master) this.master.gain.value = v * 0.7
  }

  /** Must be called from a user gesture before sound can play. */
  unlock(): void {
    if (!this.enabled) return
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor({ latencyHint: 'interactive' })
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume * 0.7
      const comp = this.ctx.createDynamicsCompressor()
      comp.threshold.value = -14
      comp.ratio.value = 4
      this.master.connect(comp).connect(this.ctx.destination)
      const len = Math.floor(this.ctx.sampleRate * 0.6)
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const data = this.noise.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  close(): void {
    void this.ctx?.close()
    this.ctx = null
    this.master = null
  }

  private ready(): AudioContext | null {
    if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return null
    return this.ctx
  }

  private env(ctx: AudioContext, peak: number, attack: number, decay: number, at = ctx.currentTime): GainNode {
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(peak, at + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
    g.connect(this.master!)
    return g
  }

  private noiseBurst(ctx: AudioContext, filter: BiquadFilterType, freq: number, q: number, out: AudioNode, at = ctx.currentTime, dur = 0.3) {
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    src.playbackRate.value = 0.9 + Math.random() * 0.2
    const f = ctx.createBiquadFilter()
    f.type = filter
    f.frequency.value = freq
    f.Q.value = q
    src.connect(f).connect(out)
    src.start(at, Math.random() * 0.2, dur)
    return f
  }

  /** Correct keystroke. Pitch climbs with combo. */
  clack(combo: number): void {
    const ctx = this.ready()
    if (!ctx) return
    const lift = Math.min(combo, 60)
    const jitter = 0.94 + Math.random() * 0.12
    const out = this.env(ctx, 0.55, 0.001, 0.05)
    this.noiseBurst(ctx, 'bandpass', (2100 + lift * 38) * jitter, 2.2, out, ctx.currentTime, 0.08)
    const body = ctx.createOscillator()
    body.type = 'triangle'
    body.frequency.setValueAtTime((210 + lift * 7) * jitter, ctx.currentTime)
    body.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.04)
    const bg = this.env(ctx, 0.28, 0.001, 0.035)
    body.connect(bg)
    body.start()
    body.stop(ctx.currentTime + 0.06)
  }

  /** Wrong key: dull wooden thud. */
  thud(): void {
    const ctx = this.ready()
    if (!ctx) return
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(150, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(48, ctx.currentTime + 0.14)
    o.connect(this.env(ctx, 0.7, 0.002, 0.16))
    o.start()
    o.stop(ctx.currentTime + 0.2)
    this.noiseBurst(ctx, 'lowpass', 500, 0.7, this.env(ctx, 0.25, 0.002, 0.08), ctx.currentTime, 0.1)
  }

  /** Enemy killed: wet ink splat, bigger for longer words. */
  splat(size = 1, combo = 0): void {
    const ctx = this.ready()
    if (!ctx) return
    const t = ctx.currentTime
    const out = this.env(ctx, 0.5 + Math.min(0.3, size * 0.05), 0.003, 0.22 + size * 0.02)
    const f = this.noiseBurst(ctx, 'lowpass', 2400, 1.4, out, t, 0.4)
    f.frequency.setValueAtTime(2600, t)
    f.frequency.exponentialRampToValueAtTime(220, t + 0.25)
    const pop = ctx.createOscillator()
    pop.type = 'sine'
    const base = 320 + Math.min(combo, 50) * 6
    pop.frequency.setValueAtTime(base, t)
    pop.frequency.exponentialRampToValueAtTime(70, t + 0.12)
    pop.connect(this.env(ctx, 0.45, 0.002, 0.12))
    pop.start(t)
    pop.stop(t + 0.16)
  }

  /** Rubber stamp slammed on paper. */
  stamp(): void {
    const ctx = this.ready()
    if (!ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(110, t)
    o.frequency.exponentialRampToValueAtTime(38, t + 0.22)
    o.connect(this.env(ctx, 0.9, 0.002, 0.26))
    o.start(t)
    o.stop(t + 0.3)
    this.noiseBurst(ctx, 'highpass', 700, 0.6, this.env(ctx, 0.35, 0.001, 0.06), t, 0.08)
  }

  /** Typewriter carriage bell. */
  bell(): void {
    const ctx = this.ready()
    if (!ctx) return
    const t = ctx.currentTime
    for (const [freq, peak] of [
      [2093, 0.22],
      [4186, 0.08],
      [3136, 0.05],
    ] as const) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = freq
      o.connect(this.env(ctx, peak, 0.002, 0.9, t))
      o.start(t)
      o.stop(t + 1)
    }
  }

  /** Ink lost at the margin. */
  blot(): void {
    const ctx = this.ready()
    if (!ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(180, t)
    o.frequency.exponentialRampToValueAtTime(40, t + 0.4)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 600
    o.connect(lp).connect(this.env(ctx, 0.5, 0.005, 0.42))
    o.start(t)
    o.stop(t + 0.5)
    this.noiseBurst(ctx, 'lowpass', 800, 1, this.env(ctx, 0.4, 0.004, 0.3), t, 0.4)
  }

  /** Rising chime, e.g. streak extended or combo tier reached. */
  chime(steps = 3, base = 523.25): void {
    const ctx = this.ready()
    if (!ctx) return
    const ratios = [1, 1.25, 1.5, 2, 2.5]
    for (let i = 0; i < steps; i++) {
      const at = ctx.currentTime + i * 0.075
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = base * ratios[i % ratios.length]
      o.connect(this.env(ctx, 0.18, 0.004, 0.35, at))
      o.start(at)
      o.stop(at + 0.4)
    }
  }
}
