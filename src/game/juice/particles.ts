const MAX_DROPS = 700
const MAX_STAINS = 140
const GRAVITY = 1500

interface Drop {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  max: number
  color: string
  stains: boolean
}

interface Stain {
  x: number
  y: number
  r: number
  radii: number[]
  life: number
  max: number
  color: string
  alpha: number
}

interface Ring {
  x: number
  y: number
  r: number
  maxR: number
  life: number
  max: number
  color: string
  width: number
}

interface Txt {
  text: string
  x: number
  y: number
  sx: number
  sy: number
  tx: number
  ty: number
  life: number
  max: number
  color: string
  font: string
  size: number
  kind: 'float' | 'fly' | 'ghost'
  onArrive?: () => void
  rot: number
}

export interface SplatterOptions {
  color: string
  count: number
  power: number
  /** Leave lasting stains where drops land. */
  stains?: boolean
  /** Bias direction in radians; undefined means radial. */
  angle?: number
  spread?: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export class Particles {
  private canvas: HTMLCanvasElement
  private g: CanvasRenderingContext2D
  private dpr = 1
  private w = 0
  private h = 0
  private drops: Drop[] = []
  private stains: Stain[] = []
  private rings: Ring[] = []
  private texts: Txt[] = []
  enabled = true

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const g = canvas.getContext('2d')
    if (!g) throw new Error('2d canvas unsupported')
    this.g = g
  }

  resize(w: number, h: number): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.w = w
    this.h = h
    this.canvas.width = Math.round(w * this.dpr)
    this.canvas.height = Math.round(h * this.dpr)
    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`
  }

  splatter(x: number, y: number, o: SplatterOptions): void {
    if (!this.enabled) return
    const n = Math.min(o.count, MAX_DROPS - this.drops.length)
    for (let i = 0; i < n; i++) {
      const a = o.angle === undefined ? Math.random() * Math.PI * 2 : o.angle + rand(-1, 1) * (o.spread ?? 0.8)
      const speed = o.power * rand(0.25, 1) ** 1.6
      this.drops.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - o.power * 0.25,
        r: rand(1.2, 4.2) * (speed < o.power * 0.4 ? 1.4 : 1),
        life: 0,
        max: rand(0.35, 0.8),
        color: o.color,
        stains: o.stains ?? true,
      })
    }
  }

  stain(x: number, y: number, r: number, color: string, alpha = 0.16, life = 7): void {
    if (!this.enabled) return
    if (this.stains.length >= MAX_STAINS) this.stains.shift()
    const pts = 11
    const radii = Array.from({ length: pts }, () => rand(0.7, 1.15))
    this.stains.push({ x, y, r, radii, life: 0, max: life, color, alpha })
  }

  ring(x: number, y: number, color: string, maxR = 60, width = 2.5): void {
    if (!this.enabled) return
    this.rings.push({ x, y, r: 4, maxR, life: 0, max: 0.38, color, width })
  }

  floatText(text: string, x: number, y: number, color: string, font: string, size = 16): void {
    this.texts.push({ text, x, y, sx: x, sy: y, tx: x, ty: y - 46, life: 0, max: 0.8, color, font, size, kind: 'float', rot: rand(-0.12, 0.12) })
  }

  flyText(text: string, x: number, y: number, tx: number, ty: number, color: string, font: string, onArrive?: () => void): void {
    this.texts.push({ text, x, y, sx: x, sy: y, tx, ty, life: 0, max: 0.75, color, font, size: 18, kind: 'fly', onArrive, rot: rand(-0.2, 0.2) })
  }

  ghost(text: string, x: number, y: number, color: string, font: string, size: number): void {
    if (!this.enabled) return
    this.texts.push({ text, x, y, sx: x, sy: y, tx: x, ty: y, life: 0, max: 0.32, color, font, size, kind: 'ghost', rot: 0 })
  }

  clear(): void {
    this.drops = []
    this.stains = []
    this.rings = []
    for (const t of this.texts) t.onArrive?.()
    this.texts = []
  }

  update(dt: number): void {
    if (dt <= 0) return
    const drag = Math.exp(-2.6 * dt)
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i]
      d.life += dt
      d.vx *= drag
      d.vy = d.vy * drag + GRAVITY * dt
      d.x += d.vx * dt
      d.y += d.vy * dt
      if (d.life >= d.max) {
        if (d.stains && d.r > 3 && Math.random() < 0.6) this.stain(d.x, d.y, d.r * rand(1, 1.8), d.color, 0.38, rand(3, 6))
        this.drops.splice(i, 1)
      }
    }
    for (let i = this.stains.length - 1; i >= 0; i--) {
      const s = this.stains[i]
      s.life += dt
      if (s.life >= s.max) this.stains.splice(i, 1)
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]
      r.life += dt
      const t = r.life / r.max
      r.r = 4 + (r.maxR - 4) * (1 - (1 - t) ** 3)
      if (t >= 1) this.rings.splice(i, 1)
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i]
      t.life += dt
      const k = Math.min(1, t.life / t.max)
      if (t.kind === 'float') {
        const e = 1 - (1 - k) ** 3
        t.x = t.sx
        t.y = t.sy + (t.ty - t.sy) * e
      } else if (t.kind === 'fly') {
        const hold = 0.22
        if (k < hold) {
          const e = k / hold
          t.x = t.sx
          t.y = t.sy - 22 * (1 - (1 - e) ** 2)
        } else {
          const e = ((k - hold) / (1 - hold)) ** 2.4
          t.x = t.sx + (t.tx - t.sx) * e
          t.y = t.sy - 22 + (t.ty - t.sy + 22) * e
        }
      }
      if (k >= 1) {
        t.onArrive?.()
        this.texts.splice(i, 1)
      }
    }
  }

  draw(): void {
    const g = this.g
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    g.clearRect(0, 0, this.w, this.h)

    for (const s of this.stains) {
      const fadeIn = Math.min(1, s.life / 0.12)
      const fadeOut = 1 - Math.max(0, (s.life - s.max * 0.6) / (s.max * 0.4))
      g.globalAlpha = s.alpha * fadeIn * fadeOut
      g.fillStyle = s.color
      g.beginPath()
      const n = s.radii.length
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2
        const rr = s.r * s.radii[i % n] * (0.85 + 0.15 * fadeIn)
        const px = s.x + Math.cos(a) * rr
        const py = s.y + Math.sin(a) * rr
        if (i === 0) g.moveTo(px, py)
        else {
          const pa = ((i - 0.5) / n) * Math.PI * 2
          const pr = s.r * ((s.radii[(i - 1) % n] + s.radii[i % n]) / 2) * 1.08
          g.quadraticCurveTo(s.x + Math.cos(pa) * pr, s.y + Math.sin(pa) * pr, px, py)
        }
      }
      g.fill()
    }

    g.lineCap = 'round'
    for (const d of this.drops) {
      const t = d.life / d.max
      g.globalAlpha = 1 - t * t
      g.strokeStyle = d.color
      g.lineWidth = d.r * 2 * (1 - t * 0.5)
      g.beginPath()
      g.moveTo(d.x, d.y)
      g.lineTo(d.x - d.vx * 0.018, d.y - d.vy * 0.018)
      g.stroke()
    }

    for (const r of this.rings) {
      const t = r.life / r.max
      g.globalAlpha = (1 - t) * 0.8
      g.strokeStyle = r.color
      g.lineWidth = r.width * (1 - t) + 0.5
      g.beginPath()
      g.arc(r.x, r.y, r.r, 0, Math.PI * 2)
      g.stroke()
    }

    g.textAlign = 'center'
    g.textBaseline = 'middle'
    for (const t of this.texts) {
      const k = Math.min(1, t.life / t.max)
      let scale = 1
      if (t.kind === 'ghost') {
        scale = 1 + k * 0.6
        g.globalAlpha = (1 - k) * 0.7
      } else if (t.kind === 'float') {
        scale = k < 0.15 ? 0.6 + (k / 0.15) * 0.6 : 1.2 - Math.min(0.2, (k - 0.15) * 0.6)
        g.globalAlpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1
      } else {
        scale = k < 0.22 ? 0.7 + (k / 0.22) * 0.5 : 1.2 - (k - 0.22) * 0.6
        g.globalAlpha = 1
      }
      g.save()
      g.translate(t.x, t.y)
      g.rotate(t.rot * (1 - k))
      g.scale(scale, scale)
      g.fillStyle = t.color
      g.font = `600 ${t.size}px ${t.font}`
      g.fillText(t.text, 0, 0)
      g.restore()
    }
    g.globalAlpha = 1
  }
}
