import type { Synth } from './audio'

/** A continuous felt-key / plucked-string theme. Combo opens stems on the same musical clock. */
const FILES = import.meta.glob('../../assets/music/theme.{mp3,ogg,wav}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const THEME_URL = Object.values(FILES)[0]
const STEP = 60 / 84 / 2
const LEVELS = [0.46, 0.55, 0.65, 0.76, 0.88, 1]
const CHORDS = [
  { bass: 38, notes: [57, 62, 65, 69] }, // Dm9
  { bass: 34, notes: [57, 60, 62, 65] }, // Bbmaj7
  { bass: 41, notes: [57, 60, 64, 67] }, // Fmaj9
  { bass: 36, notes: [55, 60, 62, 67] }, // Csus2
]
const MELODY = [
  74, 0, 0, 0, 77, 0, 76, 0, 74, 0, 0, 0, 69, 0, 0, 0,
  72, 0, 0, 0, 74, 0, 77, 0, 74, 0, 0, 0, 72, 0, 0, 0,
  69, 0, 0, 0, 72, 0, 76, 0, 79, 0, 0, 0, 76, 0, 0, 0,
  74, 0, 0, 0, 72, 0, 69, 0, 67, 0, 0, 0, 0, 0, 0, 0,
]
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12)

export class Music {
  private timer = 0
  private playing = false
  private tier = 1
  private step = 0
  private next = 0
  private bus: GainNode | null = null
  private ctx: AudioContext | null = null
  private stems: GainNode[] = []
  private nodes: AudioNode[] = []
  private sources = new Set<AudioScheduledSourceNode>()
  private theme: AudioBuffer | null = null
  private loading = false
  private recordingFailed = false
  private recording: AudioBufferSourceNode | null = null
  private filter: BiquadFilterNode | null = null
  private recordOffset = 0
  private recordStarted = 0

  private synth: Synth

  constructor(synth: Synth) { this.synth = synth }

  start(): void {
    if (this.playing) return
    this.playing = true
    this.next = 0
    this.timer = window.setInterval(() => this.tick(), 35)
    this.tick()
  }

  /** Retain the phrase across a pause; release every source, including looping recordings. */
  stop(fade = 0.35): void {
    this.playing = false
    window.clearInterval(this.timer)
    const ctx = this.ctx
    const bus = this.bus
    if (this.recording && ctx && this.theme) {
      this.recordOffset = (this.recordOffset + ctx.currentTime - this.recordStarted) % this.theme.duration
    }
    const sources = [...this.sources]
    const nodes = this.nodes
    this.sources.clear()
    this.nodes = []
    this.bus = null
    this.stems = []
    this.recording = null
    this.filter = null
    if (!ctx || !bus) return
    const now = ctx.currentTime
    bus.gain.cancelScheduledValues(now)
    bus.gain.setTargetAtTime(0, now, Math.max(0.01, fade / 4))
    for (const source of sources) {
      try { source.stop(now + fade + 0.08) } catch { /* already ended */ }
    }
    window.setTimeout(() => nodes.forEach((n) => n.disconnect()), (fade + 0.15) * 1000)
  }

  /** A new run starts from the opening phrase, while resume uses start(). */
  reset(): void {
    this.stop(0.1)
    this.step = 0
    this.tier = 1
    this.recordOffset = 0
  }

  setTier(tier: number): void {
    const t = Math.min(6, Math.max(1, Math.round(tier)))
    if (this.tier === t) return
    this.tier = t
    this.applyTier()
  }

  private applyTier(): void {
    if (!this.ctx || !this.bus) return
    const at = this.ctx.currentTime
    this.bus.gain.setTargetAtTime(LEVELS[this.tier - 1] * 2.4, at, 0.45)
    this.stems.forEach((stem, i) => stem.gain.setTargetAtTime(i < this.tier ? 1 : 0, at, 0.4))
    this.filter?.frequency.setTargetAtTime([2200, 3000, 4200, 5800, 8000, 12000][this.tier - 1], at, 0.45)
  }

  private connect(ctx: AudioContext, master: GainNode): void {
    this.ctx = ctx
    const bus = ctx.createGain()
    bus.gain.value = 0
    bus.connect(master)
    this.bus = bus
    this.nodes = [bus]
    // A quiet stereo echo supplies space without noisy synthetic drums or a long muddy tail.
    const delay = ctx.createDelay(1)
    delay.delayTime.value = STEP * 1.5
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 1800
    const wet = ctx.createGain()
    wet.gain.value = 0.14
    const pan = ctx.createStereoPanner()
    pan.pan.value = 0.45
    delay.connect(tone).connect(wet).connect(pan).connect(bus)
    this.nodes.push(delay, tone, wet, pan)
    this.stems = Array.from({ length: 6 }, () => {
      const gain = ctx.createGain()
      gain.gain.value = 0
      gain.connect(bus)
      gain.connect(delay)
      this.nodes.push(gain)
      return gain
    })
    this.applyTier()
  }

  private tick(): void {
    const graph = this.synth.graph
    if (!graph) return
    const { ctx, master } = graph
    if (!this.bus || ctx !== this.ctx) this.connect(ctx, master)
    if (THEME_URL && !this.recordingFailed) {
      this.tickRecording(ctx, THEME_URL)
      return
    }
    if (!this.next || this.next < ctx.currentTime - 0.2) this.next = ctx.currentTime + 0.04
    while (this.next < ctx.currentTime + 0.14) {
      this.schedule(this.step % 64, this.next, ctx)
      this.step++
      this.next += STEP
    }
  }

  private tickRecording(ctx: AudioContext, url: string): void {
    if (!this.theme) {
      if (!this.loading) {
        this.loading = true
        void fetch(url).then((r) => {
          if (!r.ok) throw new Error(`theme: ${r.status}`)
          return r.arrayBuffer()
        }).then((b) => ctx.decodeAudioData(b)).then((b) => { this.theme = b })
          .catch((err) => { this.recordingFailed = true; console.warn('could not load the theme; using the instrumental', err) })
      }
      return
    }
    if (this.recording || !this.bus) return
    const src = ctx.createBufferSource()
    src.buffer = this.theme
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    src.connect(filter).connect(this.bus)
    this.filter = filter
    this.recording = src
    this.nodes.push(filter)
    this.track(src)
    this.applyTier()
    this.recordStarted = ctx.currentTime
    src.start(0, this.recordOffset)
  }

  private track(source: AudioScheduledSourceNode): void {
    this.sources.add(source)
    source.onended = () => { this.sources.delete(source); source.disconnect() }
  }

  private schedule(i: number, at: number, ctx: AudioContext): void {
    const chord = CHORDS[Math.floor(i / 16)]
    const beat = i % 16
    // The motif is present from tier one: every tier still sounds like the same song.
    if (MELODY[i]) this.note(ctx, 0, MELODY[i], at, 0.09, 1.3, -0.18)
    if (beat === 0 || beat === 8) this.note(ctx, 1, chord.bass, at, 0.16, 1.65, 0, true)
    if (beat % 4 === 0) this.note(ctx, 2, chord.notes[beat / 4], at, 0.045, 1.5, 0.25)
    if (beat % 2 === 1) this.note(ctx, 3, chord.notes[(beat >> 1) % 4] + 12, at, 0.035, 0.75, -0.35)
    if (beat === 6 || beat === 14) this.note(ctx, 4, chord.notes[2] + 12, at, 0.045, 1.1, 0.35)
    if (beat === 0) for (const m of chord.notes) this.note(ctx, 5, m, at, 0.025, 4.5, 0, true)
  }

  private note(ctx: AudioContext, stem: number, midi: number, at: number, peak: number, length: number, pan: number, soft = false): void {
    const osc = ctx.createOscillator()
    osc.type = soft ? 'sine' : 'triangle'
    osc.frequency.value = hz(midi)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 0.45
    filter.frequency.setValueAtTime(soft ? 650 : 2300, at)
    filter.frequency.exponentialRampToValueAtTime(soft ? 350 : 700, at + length)
    const gain = ctx.createGain()
    const attack = soft ? 0.14 : 0.012
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(peak, at + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
    const stereo = ctx.createStereoPanner()
    stereo.pan.value = pan
    osc.connect(filter).connect(gain).connect(stereo).connect(this.stems[stem])
    this.sources.add(osc)
    osc.onended = () => {
      this.sources.delete(osc)
      osc.disconnect(); filter.disconnect(); gain.disconnect(); stereo.disconnect()
    }
    osc.start(at)
    osc.stop(at + length + 0.02)
  }
}
