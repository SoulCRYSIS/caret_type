/** Shallow pools of pigment at the paper's corners. The centre stays clear for reading. */
const SPOTS = [
  { x: -0.02, y: 1.02, tier: 1, size: 1, phase: 0.4 },
  { x: 1.02, y: 1.02, tier: 1, size: 0.85, phase: 2.1 },
  { x: -0.03, y: -0.04, tier: 3, size: 0.7, phase: 4.2 },
  { x: 1.03, y: -0.03, tier: 4, size: 0.8, phase: 1.2 },
]
const clamp = (v: number) => Math.min(1, Math.max(0, v))
export interface BloomOptions {
  reduced: boolean
  colors: () => { ink: string; accent: string }
}

export class BloomRenderer {
  private g: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private dpr = 1
  private cur = 0
  private goal = 0
  private last = 0
  private raf = 0
  private time = 0

  private canvas: HTMLCanvasElement
  private opts: BloomOptions

  constructor(canvas: HTMLCanvasElement, opts: BloomOptions) {
    this.canvas = canvas
    this.opts = opts
    const g = canvas.getContext('2d')
    if (!g) throw new Error('2d canvas unsupported')
    this.g = g
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.w = r.width
    this.h = r.height
    this.canvas.width = Math.max(1, Math.round(r.width * this.dpr))
    this.canvas.height = Math.max(1, Math.round(r.height * this.dpr))
    this.draw()
  }

  /** 0 clear, 1…9 corresponds to ×2…×10. Keep the pigment flowing while a combo is active. */
  setLevel(level: number): void {
    this.goal = Math.min(9, Math.max(0, level))
    if (this.opts.reduced) { this.cur = this.goal; this.draw(); return }
    if (!this.raf) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.frame)
    }
  }

  dispose(): void { cancelAnimationFrame(this.raf); this.raf = 0 }

  private frame = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000))
    this.last = now
    this.time += dt
    this.cur += (this.goal - this.cur) * (1 - Math.exp(-4 * dt))
    if (Math.abs(this.goal - this.cur) < 0.008) this.cur = this.goal
    this.draw()
    this.raf = this.cur === 0 && this.goal === 0 ? 0 : requestAnimationFrame(this.frame)
  }

  private pool(x: number, y: number, r: number, phase: number): void {
    const g = this.g
    const points = Array.from({ length: 64 }, (_, i) => {
      const angle = i / 64 * Math.PI * 2
      const radius = r * (1 + Math.sin(angle * 3 + phase) * 0.065 + Math.sin(angle * 7 - phase) * 0.025)
      return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]
    })
    g.beginPath()
    for (let i = 0; i < points.length; i++) {
      const p = points[i], next = points[(i + 1) % points.length]
      const prev = points[(i + 63) % points.length]
      if (i === 0) g.moveTo((prev[0] + p[0]) / 2, (prev[1] + p[1]) / 2)
      g.quadraticCurveTo(p[0], p[1], (p[0] + next[0]) / 2, (p[1] + next[1]) / 2)
    }
    g.closePath()
  }

  private draw(): void {
    const { g, w, h } = this
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    if (this.cur <= 0) return
    const { ink, accent } = this.opts.colors()
    for (const s of SPOTS) {
      const presence = clamp(this.cur - s.tier + 1)
      if (!presence) continue
      const time = this.opts.reduced ? 0 : this.time
      const flow = time * (0.38 + this.cur * 0.07)
      const phase = s.phase + flow
      const tide = 1 + Math.sin(flow * 1.7 + s.phase) * 0.055
      const r = Math.min(w, h) * (0.14 + this.cur * 0.018) * s.size * (0.5 + presence * 0.5) * tide
      const x = s.x * w + Math.sin(flow + s.phase) * 4
      const y = s.y * h + Math.cos(flow * 0.8 + s.phase) * 4
      // Several translucent pigment edges suggest wet paper without a foggy vignette.
      for (let layer = 0; layer < 3; layer++) {
        this.pool(x, y, r * (1 - layer * 0.13), phase + layer * 0.35 + Math.sin(flow + layer) * 0.2)
        g.fillStyle = layer === 1 ? accent : ink
        g.globalAlpha = presence * (layer === 0 ? 0.035 : 0.045)
        g.fill()
      }
      this.pool(x, y, r, phase)
      g.strokeStyle = ink
      g.globalAlpha = presence * 0.045
      g.lineWidth = 0.8
      g.stroke()
      if (!this.opts.reduced) {
        // Two offset rings spread and dissolve, like a drop landing in wet pigment.
        for (let ring = 0; ring < 2; ring++) {
          const travel = (time * (0.14 + this.cur * 0.018) + s.phase / 7 + ring * 0.5) % 1
          this.pool(x, y, r * (0.65 + travel * 0.65), phase + ring * 0.6)
          g.strokeStyle = ring === 0 ? ink : accent
          g.globalAlpha = presence * Math.sin(travel * Math.PI) * (0.07 + this.cur * 0.009)
          g.lineWidth = 1.1
          g.stroke()
        }
        // Small round droplets lift from each pool, then dissolve before reaching the text.
        const inward = Math.atan2(h / 2 - y, w / 2 - x)
        for (let drop = 0; drop < 2 + Math.ceil(this.cur); drop++) {
          const travel = (time * (0.12 + this.cur * 0.015) + drop * 0.37 + s.phase / 8) % 1
          const angle = inward + Math.sin(drop * 2.4 + s.phase) * 0.7 + Math.sin(flow + drop) * 0.08
          const distance = r * (0.6 + travel * 0.65)
          const radius = (1.6 + (drop % 3) * 1.2) * Math.sin(travel * Math.PI)
          g.beginPath()
          g.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, radius, 0, Math.PI * 2)
          g.fillStyle = drop % 3 === 0 ? accent : ink
          g.globalAlpha = presence * Math.sin(travel * Math.PI) * 0.18
          g.fill()
        }
      }
    }
    g.globalAlpha = 1
  }
}
