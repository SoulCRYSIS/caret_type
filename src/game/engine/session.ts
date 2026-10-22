import { Juice, type JuiceSettings } from '../juice/juice'
import type { AnyGameMode, ModeContext, RunResult } from '../modes/types'
import type { LanguageId, Tier } from '../words/languages'
import type { WordPicker } from '../words/picker'
import type { KeyInput } from './input'
import { GameLoop } from './loop'

export interface SessionOptions {
  mode: AnyGameMode
  words: WordPicker
  language: LanguageId
  tier: Tier
  playfield: HTMLElement
  canvas: HTMLCanvasElement
  shakeEl: HTMLElement
  juice: JuiceSettings
  onOver: (result: RunResult, details: unknown) => void
}

/** Owns one run: the loop, the mode state and the juice systems. Lives outside React. */
export class GameSession {
  readonly mode: AnyGameMode
  readonly ctx: ModeContext
  readonly loop: GameLoop
  readonly juice: Juice
  state: unknown
  private version = 0
  private dirty = false
  private listeners = new Set<() => void>()
  private simulating = true
  private resizeObserver: ResizeObserver
  private onOver: (result: RunResult, details: unknown) => void

  constructor(opts: SessionOptions) {
    this.mode = opts.mode
    this.onOver = opts.onOver
    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      frame: (realDt, gameDt) => this.frame(realDt, gameDt),
    })
    this.juice = new Juice({ canvas: opts.canvas, shakeEl: opts.shakeEl, loop: this.loop, settings: opts.juice })
    const rect = opts.playfield.getBoundingClientRect()
    this.ctx = {
      width: rect.width,
      height: rect.height,
      language: opts.language,
      tier: opts.tier,
      words: opts.words,
      juice: this.juice,
      elapsed: () => this.loop.elapsed,
      invalidate: () => {
        this.dirty = true
      },
    }
    this.juice.resize(rect.width, rect.height)
    this.resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      this.ctx.width = width
      this.ctx.height = height
      this.juice.resize(width, height)
      this.dirty = true
    })
    this.resizeObserver.observe(opts.playfield)
    this.state = this.mode.init(this.ctx)
  }

  start(): void {
    this.loop.start()
  }

  pause(): void {
    this.loop.pause()
  }

  resume(): void {
    this.loop.resume()
  }

  get paused(): boolean {
    return this.loop.isPaused
  }

  destroy(): void {
    this.loop.stop()
    this.resizeObserver.disconnect()
    this.juice.destroy()
    this.listeners.clear()
  }

  key(input: KeyInput): boolean {
    if (!this.simulating || this.loop.isPaused) return false
    this.juice.audio.unlock()
    const handled = this.mode.onKey(this.state, input, this.ctx)
    this.notify()
    return handled === true
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  getVersion = () => this.version

  private notify() {
    this.dirty = false
    this.version++
    for (const fn of this.listeners) fn()
  }

  private update(dt: number) {
    if (!this.simulating) return
    this.mode.update(this.state, dt, this.ctx)
    if (this.mode.isOver(this.state)) {
      this.simulating = false
      const result = this.mode.result(this.state, this.ctx)
      const details = this.mode.details(this.state, this.ctx)
      this.dirty = true
      queueMicrotask(() => this.onOver(result, details))
    }
  }

  private frame(realDt: number, gameDt: number) {
    this.mode.draw?.(this.state, this.ctx, realDt)
    this.juice.frame(realDt, gameDt)
    if (this.dirty) this.notify()
  }
}
