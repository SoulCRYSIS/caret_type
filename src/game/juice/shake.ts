const MAX_OFFSET = 16
const MAX_ANGLE = 1.4
const DECAY = 1.7

/** Trauma-based screen shake: offset grows with trauma squared, using smooth pseudo-noise. */
export class Shake {
  private el: HTMLElement
  private trauma = 0
  private t = 0
  private seeds = [Math.random() * 100, Math.random() * 100, Math.random() * 100]
  enabled = true

  constructor(el: HTMLElement) {
    this.el = el
  }

  add(amount: number): void {
    if (!this.enabled) return
    this.trauma = Math.min(1, this.trauma + amount)
  }

  get level(): number {
    return this.trauma
  }

  frame(realDt: number): void {
    if (this.trauma <= 0) return
    this.t += realDt
    this.trauma = Math.max(0, this.trauma - DECAY * realDt)
    const s = this.trauma * this.trauma
    const n = (seed: number) => Math.sin(this.t * 37 + seed) * 0.6 + Math.sin(this.t * 61 + seed * 1.7) * 0.4
    const x = MAX_OFFSET * s * n(this.seeds[0])
    const y = MAX_OFFSET * s * n(this.seeds[1])
    const r = MAX_ANGLE * s * n(this.seeds[2])
    this.el.style.transform = this.trauma > 0 ? `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${r.toFixed(3)}deg)` : ''
  }

  reset(): void {
    this.trauma = 0
    this.el.style.transform = ''
  }
}
