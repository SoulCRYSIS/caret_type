import { readCssColor, type PaletteColors } from '../../theme/palettes'
import type { GameLoop } from '../engine/loop'
import { Synth } from './audio'
import { Particles, type SplatterOptions } from './particles'
import { Shake } from './shake'

export interface JuiceSettings {
  sound: boolean
  volume: number
  shake: boolean
  particles: boolean
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

const sharedSynth = new Synth()
/** The app-wide synth, for UI sounds outside a run (result stamps, streak chime). */
export const synth = sharedSynth

/** Facade over every feedback system so game modes don't care which ones are enabled. */
export class Juice {
  readonly particles: Particles
  readonly shake: Shake
  readonly audio: Synth = sharedSynth
  private loop: GameLoop
  private reduced = prefersReducedMotion()
  private palette: PaletteColors | null = null
  private paletteAt = -1

  constructor(opts: { canvas: HTMLCanvasElement; shakeEl: HTMLElement; loop: GameLoop; settings: JuiceSettings }) {
    this.particles = new Particles(opts.canvas)
    this.shake = new Shake(opts.shakeEl)
    this.loop = opts.loop
    this.apply(opts.settings)
  }

  apply(s: JuiceSettings): void {
    this.audio.enabled = s.sound
    this.audio.setVolume(s.volume)
    this.shake.enabled = s.shake && !this.reduced
    this.particles.enabled = s.particles
    if (!this.shake.enabled) this.shake.reset()
  }

  get reducedMotion(): boolean {
    return this.reduced
  }

  colors(): PaletteColors {
    const now = performance.now()
    if (!this.palette || now - this.paletteAt > 500) {
      this.palette = {
        paper: readCssColor('paper'),
        ink: readCssColor('ink'),
        muted: readCssColor('muted'),
        accent: readCssColor('accent'),
        error: readCssColor('error'),
      }
      this.paletteAt = now
    }
    return this.palette
  }

  hitstop(ms: number): void {
    this.loop.hitstop(this.reduced ? ms * 0.5 : ms)
  }

  slowmo(scale: number, ms: number, releaseMs?: number): void {
    if (this.reduced) return
    this.loop.slowmo(scale, ms, releaseMs)
  }

  trauma(amount: number): void {
    this.shake.add(amount)
  }

  splatter(x: number, y: number, o: SplatterOptions): void {
    this.particles.splatter(x, y, this.reduced ? { ...o, count: Math.ceil(o.count / 3) } : o)
  }

  resize(w: number, h: number): void {
    this.particles.resize(w, h)
  }

  frame(realDt: number, gameDt: number): void {
    this.particles.update(gameDt)
    this.particles.draw()
    this.shake.frame(realDt)
  }

  destroy(): void {
    this.particles.clear()
    this.shake.reset()
  }
}
