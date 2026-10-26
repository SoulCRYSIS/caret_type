/**
 * Ink fire: when the combo gets hot, tongues of ink rise from the page edges the way sumi ink
 * blooms in water. Each tongue is a ragged brush stroke that is dense at the root and dissolves
 * toward the tip, drawn in the palette's own ink and accent colours, with a few flecks of ink
 * flicked upward. Everything comes from a few sine waves, so there is no per-tongue state.
 */

interface Fleck {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  r: number
  seed: number
  accent: boolean
}

interface Layer {
  /** Height relative to the tallest tongue. */
  size: number
  /** Tongue width relative to the spacing. */
  wide: number
  /** Opacity at the root; the tip is always clear. */
  alpha: number
  tone: 'ink' | 'accent'
  phase: number
}

const LAYERS: Layer[] = [
  { size: 1, wide: 2.8, alpha: 0.34, tone: 'ink', phase: 0 },
  { size: 0.7, wide: 2.2, alpha: 0.5, tone: 'accent', phase: 2.1 },
  { size: 0.4, wide: 1.6, alpha: 0.68, tone: 'ink', phase: 4.2 },
]

const STEPS = 12
const MAX_FLECKS = 80
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** `#rgb` / `#rrggbb` with an alpha; anything else comes back untouched. */
function withAlpha(color: string, a: number): string {
  const m = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color.trim())
  if (!m) return color
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`
}

export interface FireOptions {
  /** Slower, calmer ink and no flecks. */
  reduced: boolean
  /** Whether to flick ink flecks (follows the particles setting). */
  flecks: () => boolean
  /** The palette's current ink and accent. */
  colors: () => { ink: string; accent: string }
}

export class FireRenderer {
  private g: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private dpr = 1
  private cur = 0
  private goal = 0
  private t = 0
  private last = 0
  private raf = 0
  private flecks: Fleck[] = []
  private fleckDebt = 0
  private canvas: HTMLCanvasElement
  private opts: FireOptions

  constructor(canvas: HTMLCanvasElement, opts: FireOptions) {
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
  }

  /** 0 = out, 1…4 = combo ×3…×6. */
  setLevel(level: number): void {
    this.goal = level
    if (!this.raf) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.frame)
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private frame = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000))
    this.last = now
    // Ink blooms quickly and drains slowly.
    const rate = this.goal > this.cur ? 3.2 : 1.6
    this.cur += (this.goal - this.cur) * (1 - Math.exp(-rate * dt))
    if (this.goal === 0 && this.cur < 0.015) this.cur = 0
    this.t += dt * (this.opts.reduced ? 0.3 : 1)
    this.stepFlecks(dt)
    this.draw()
    if (this.cur === 0 && this.goal === 0 && this.flecks.length === 0) {
      this.raf = 0
      return
    }
    this.raf = requestAnimationFrame(this.frame)
  }

  private stepFlecks(dt: number): void {
    const f = clamp01(this.cur / 4)
    if (f > 0.05 && this.goal > 0 && !this.opts.reduced && this.opts.flecks()) {
      this.fleckDebt += (3 + 26 * f * f) * dt
      while (this.fleckDebt >= 1 && this.flecks.length < MAX_FLECKS) {
        this.fleckDebt -= 1
        const side = this.cur > 2.5 && Math.random() < 0.3 * clamp01((this.cur - 2) / 2)
        const fromLeft = Math.random() < 0.5
        this.flecks.push({
          x: side ? (fromLeft ? rand(0, 22) : this.w - rand(0, 22)) : rand(0, this.w),
          y: side ? rand(this.h * 0.4, this.h) : this.h - rand(0, this.h * 0.04),
          vx: side ? (fromLeft ? 1 : -1) * rand(10, 34) : rand(-20, 20),
          vy: -rand(70, 170) * (0.7 + f * 0.8),
          life: 0,
          max: rand(0.7, 1.5),
          r: rand(1.4, 3.6),
          seed: Math.random() * 6.28,
          accent: Math.random() < 0.4,
        })
      }
    }
    this.fleckDebt = Math.min(this.fleckDebt, 2)
    for (let i = this.flecks.length - 1; i >= 0; i--) {
      const e = this.flecks[i]
      e.life += dt
      e.x += (e.vx + Math.sin(e.life * 3.6 + e.seed) * 10) * dt
      e.y += e.vy * dt
      // Flicked ink slows as it rises, then hangs.
      e.vy *= 0.985
      if (e.life >= e.max || e.y < -10) this.flecks.splice(i, 1)
    }
  }

  private draw(): void {
    const { g, w, h } = this
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    const f = clamp01(this.cur / 4)
    const { ink, accent } = this.opts.colors()
    if (f > 0.01) {
      const tall = h * 0.21 * f ** 0.9
      const sideF = clamp01((this.cur - 1.5) / 2.5)
      const sideTall = Math.min(w, h) * 0.11 * sideF

      g.save()
      g.translate(0, h)
      this.edge(w, tall, f, ink, accent, 0)
      g.restore()
      if (sideF > 0.02) {
        g.save()
        g.rotate(Math.PI / 2)
        this.edge(h, sideTall, f * sideF, ink, accent, 3.7)
        g.restore()
        g.save()
        g.translate(w, h)
        g.rotate(-Math.PI / 2)
        this.edge(h, sideTall, f * sideF, ink, accent, 7.9)
        g.restore()
      }
    }

    for (const e of this.flecks) {
      const k = e.life / e.max
      const a = (1 - k) ** 0.8
      const r = e.r * (1 - k * 0.4)
      const color = e.accent ? accent : ink
      // A drop with a short trail behind it, like ink flicked off a brush.
      g.globalAlpha = a * 0.55
      g.strokeStyle = color
      g.lineWidth = r * 1.3
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(e.x, e.y)
      g.lineTo(e.x - e.vx * 0.05, e.y - e.vy * 0.05)
      g.stroke()
      g.globalAlpha = a * 0.9
      g.fillStyle = color
      g.beginPath()
      g.arc(e.x, e.y, r, 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1
  }

  /** One row of ink tongues. Local space: x runs along the edge, tongues grow toward −y. */
  private edge(len: number, height: number, heat: number, ink: string, accent: string, seed: number): void {
    const { g, t } = this
    if (height < 1) return

    // A wash of ink bleeding in from the margin.
    const wash = g.createLinearGradient(0, 0, 0, -height * 0.9)
    wash.addColorStop(0, withAlpha(ink, 0.34))
    wash.addColorStop(1, withAlpha(ink, 0))
    g.globalAlpha = 0.55 * heat
    g.fillStyle = wash
    g.fillRect(0, -height * 0.9, len, height * 0.9)

    const count = Math.max(4, Math.ceil(len / 46))
    const gap = len / count
    for (const layer of LAYERS) {
      const color = layer.tone === 'ink' ? ink : accent
      const grad = g.createLinearGradient(0, 0, 0, -1)
      grad.addColorStop(0, withAlpha(color, 1))
      grad.addColorStop(0.55, withAlpha(color, 0.55))
      grad.addColorStop(1, withAlpha(color, 0))
      g.fillStyle = grad
      g.globalAlpha = layer.alpha * (0.55 + 0.45 * heat)
      const wide = gap * layer.wide
      for (let i = -1; i <= count + 1; i++) {
        const p = i + layer.phase + seed
        // A slow wave travelling along the edge, a flicker, and a sideways lean.
        const n = 0.5 + 0.5 * (0.6 * Math.sin(t * 1.6 + p * 1.1) + 0.3 * Math.sin(t * 3.1 - p * 1.9) + 0.1 * Math.sin(t * 5.7 + p * 3.1))
        const hh = height * layer.size * (0.4 + 0.6 * n)
        if (hh < 1) continue
        const lean = (Math.sin(t * 1.9 + p * 1.7) * gap * 0.6) / wide
        this.stroke(i * gap, hh, wide, lean, p)
      }
    }
  }

  /** A ragged brush-stroke tongue: broad at the root, tapering and curling to a point. */
  private stroke(x: number, hh: number, wide: number, lean: number, seed: number): void {
    const { g, t } = this
    g.save()
    g.translate(x, hh * 0.16)
    g.scale(wide, hh * 1.16)
    g.beginPath()
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k <= STEPS; k++) {
        const u = side === 0 ? k / STEPS : 1 - k / STEPS
        const half = 0.5 * (1 - u) ** 1.25 * (1 + 0.5 * Math.sin(u * Math.PI))
        // Ragged edge: ink feathering where it meets the paper, fading out toward the tip.
        const rag = (0.55 * Math.sin(u * 19 + seed * 2.3 + t * 2.4 + side * 1.7) + 0.45 * Math.sin(u * 37 + seed * 5.1 - t * 1.7)) * 0.07 * (1 - u * 0.6)
        const cx = lean * u ** 1.7
        const px = cx + (side === 0 ? -half : half) + rag
        const py = -u
        if (k === 0 && side === 0) g.moveTo(px, py)
        else g.lineTo(px, py)
      }
    }
    g.closePath()
    g.fill()
    g.restore()
  }
}
