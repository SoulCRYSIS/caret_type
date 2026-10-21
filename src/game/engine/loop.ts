export const STEP = 1 / 120
const MAX_FRAME = 0.1
const MAX_STEPS = 12

export interface LoopCallbacks {
  /** Fixed-step simulation, dt in scaled game seconds. */
  update(dt: number): void
  /** Once per animation frame. realDt is wall-clock seconds, gameDt is time-scaled. */
  frame(realDt: number, gameDt: number): void
}

/**
 * Fixed-timestep loop with time-scale effects:
 * hitstop freezes simulation for a few ms, slowmo scales time and eases back to 1.
 */
export class GameLoop {
  private cb: LoopCallbacks
  private raf = 0
  private last = 0
  private acc = 0
  private running = false
  private paused = false
  private realNow = 0
  private freezeUntil = 0
  private slowScale = 1
  private slowUntil = 0
  private slowRelease = 0.25
  /** Unpaused wall-clock seconds since start. */
  elapsed = 0

  constructor(cb: LoopCallbacks) {
    this.cb = cb
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.tick)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    if (!this.paused) return
    this.paused = false
    this.last = performance.now()
  }

  get isPaused(): boolean {
    return this.paused
  }

  hitstop(ms: number): void {
    this.freezeUntil = Math.max(this.freezeUntil, this.realNow + ms / 1000)
  }

  slowmo(scale: number, ms: number, releaseMs = 250): void {
    this.slowScale = Math.min(this.slowScale, scale)
    this.slowUntil = Math.max(this.slowUntil, this.realNow + ms / 1000)
    this.slowRelease = releaseMs / 1000
  }

  timeScale(): number {
    if (this.realNow < this.freezeUntil) return 0
    if (this.slowScale >= 1) return 1
    if (this.realNow < this.slowUntil) return this.slowScale
    const t = Math.min(1, (this.realNow - this.slowUntil) / this.slowRelease)
    const scale = this.slowScale + (1 - this.slowScale) * t * t
    if (t >= 1) this.slowScale = 1
    return scale
  }

  private tick = (t: number) => {
    if (!this.running) return
    const realDt = Math.min(MAX_FRAME, Math.max(0, (t - this.last) / 1000))
    this.last = t
    if (!this.paused) {
      this.realNow += realDt
      this.elapsed += realDt
      const gameDt = realDt * this.timeScale()
      this.acc += gameDt
      let steps = 0
      while (this.acc >= STEP && steps < MAX_STEPS) {
        this.cb.update(STEP)
        this.acc -= STEP
        steps++
      }
      if (steps === MAX_STEPS) this.acc = 0
      this.cb.frame(realDt, gameDt)
    }
    this.raf = requestAnimationFrame(this.tick)
  }
}
