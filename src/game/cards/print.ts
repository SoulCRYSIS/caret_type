/** Canvas helpers for printing paper-and-ink result cards. */

export type Rand = () => number

/** Deterministic PRNG so a run always prints the same card. */
export function seeded(seed: number): Rand {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function font(size: number, family: string, weight = 400, italic = false): string {
  return `${italic ? 'italic ' : ''}${weight} ${Math.round(size)}px ${family}`
}

export function tracking(g: CanvasRenderingContext2D, px: number): void {
  if ('letterSpacing' in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`
}

export function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (line && g.measureText(next).width > maxW) {
      lines.push(line)
      line = w
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** Largest size (stepping down) at which `text` wraps into at most `maxLines` lines of `maxW`. */
export function fitWrapped(
  g: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxLines: number,
  start: number,
  min: number,
  make: (size: number) => string,
): { size: number; lines: string[] } {
  for (let size = start; size > min; size -= 2) {
    g.font = make(size)
    const lines = wrap(g, text, maxW)
    if (lines.length <= maxLines && lines.every((l) => g.measureText(l).width <= maxW)) return { size, lines }
  }
  g.font = make(min)
  return { size: min, lines: wrap(g, text, maxW).slice(0, maxLines) }
}

export function fitSize(g: CanvasRenderingContext2D, text: string, maxW: number, start: number, make: (size: number) => string): number {
  let size = start
  g.font = make(size)
  while (size > 10 && g.measureText(text).width > maxW) {
    size -= 2
    g.font = make(size)
  }
  return size
}

/** Fine speckle over the sheet, like uncoated stock. */
export function grain(g: CanvasRenderingContext2D, w: number, h: number, color: string, rand: Rand, count = 5200): void {
  g.save()
  g.fillStyle = color
  for (let i = 0; i < count; i++) {
    g.globalAlpha = 0.03 + rand() * 0.07
    const s = rand() < 0.9 ? 1 : 2
    g.fillRect(rand() * w, rand() * h, s, s)
  }
  g.restore()
}

function blob(g: CanvasRenderingContext2D, x: number, y: number, r: number, rand: Rand, wobble = 0.28): void {
  const n = 18 + Math.floor(rand() * 10)
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const rr = r * (1 - wobble / 2 + rand() * wobble)
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr])
  }
  g.beginPath()
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[(i + 1) % n]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    if (i === 0) g.moveTo(mx, my)
    else g.quadraticCurveTo(x0, y0, mx, my)
  }
  const [x0, y0] = pts[0]
  const [x1, y1] = pts[1]
  g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
  g.closePath()
  g.fill()
}

/** An ink blot with satellite drops and a couple of thrown streaks. */
export function blot(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rand: Rand, alpha = 1): void {
  g.save()
  g.fillStyle = color
  g.globalAlpha = alpha
  blob(g, x, y, r, rand)
  for (let i = 0; i < 5; i++) {
    const a = rand() * Math.PI * 2
    blob(g, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * (0.25 + rand() * 0.3), rand, 0.4)
  }
  const drops = 22 + Math.floor(rand() * 14)
  for (let i = 0; i < drops; i++) {
    const a = rand() * Math.PI * 2
    const d = r * (1.05 + rand() * rand() * 2.4)
    const dr = Math.max(1.5, r * 0.11 * (1 - (d - r) / (r * 2.6)) * (0.4 + rand()))
    g.beginPath()
    g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, dr, 0, Math.PI * 2)
    g.fill()
  }
  g.lineCap = 'round'
  g.strokeStyle = color
  for (let i = 0; i < 3; i++) {
    const a = rand() * Math.PI * 2
    const d0 = r * 0.9
    const d1 = r * (1.4 + rand() * 1.1)
    g.lineWidth = 2 + rand() * r * 0.06
    g.beginPath()
    g.moveTo(x + Math.cos(a) * d0, y + Math.sin(a) * d0)
    g.lineTo(x + Math.cos(a) * d1, y + Math.sin(a) * d1)
    g.stroke()
  }
  g.restore()
}

/** A small fan of drops, for flicks of colour around a figure. */
export function flick(g: CanvasRenderingContext2D, x: number, y: number, spread: number, color: string, rand: Rand, count = 14): void {
  g.save()
  g.fillStyle = color
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2
    const d = spread * Math.sqrt(rand())
    g.globalAlpha = 0.5 + rand() * 0.5
    g.beginPath()
    g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.2 + rand() * 4.5 * (1 - d / spread), 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}

/** A wobbly hand-ruled line. */
export function roughLine(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, rand: Rand, jitter = 1.2): void {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const steps = Math.max(2, Math.round(len / 40))
  g.beginPath()
  g.moveTo(x0, y0)
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    g.lineTo(x0 + (x1 - x0) * t + (rand() - 0.5) * jitter, y0 + (y1 - y0) * t + (rand() - 0.5) * jitter)
  }
  g.stroke()
}

export function roughRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rand: Rand, jitter = 2): void {
  roughLine(g, x, y, x + w, y, rand, jitter)
  roughLine(g, x + w, y, x + w, y + h, rand, jitter)
  roughLine(g, x + w, y + h, x, y + h, rand, jitter)
  roughLine(g, x, y + h, x, y, rand, jitter)
}

export interface StampSpec {
  lines: { text: string; font: string }[]
  color: string
  angle: number
  pad?: number
  round?: boolean
}

/** A rubber stamp: framed text, slightly rotated, with uneven ink (speckle knocked out). */
export function stamp(g: CanvasRenderingContext2D, cx: number, cy: number, spec: StampSpec, rand: Rand): void {
  const pad = spec.pad ?? 22
  const scratch = document.createElement('canvas').getContext('2d')
  if (!scratch) return
  const metrics = spec.lines.map((l) => {
    scratch.font = l.font
    const m = scratch.measureText(l.text)
    return { w: m.width, h: (m.actualBoundingBoxAscent || 20) + (m.actualBoundingBoxDescent || 4) }
  })
  const gap = 8
  const innerW = Math.max(...metrics.map((m) => m.w))
  const innerH = metrics.reduce((s, m) => s + m.h, 0) + gap * (metrics.length - 1)
  let w = innerW + pad * 2
  let h = innerH + pad * 1.6
  if (spec.round) w = h = Math.max(w, h) + 10
  const margin = 12
  const c = scratch.canvas
  c.width = Math.ceil(w + margin * 2)
  c.height = Math.ceil(h + margin * 2)
  const s = scratch
  s.strokeStyle = spec.color
  s.fillStyle = spec.color
  s.lineWidth = 5
  if (spec.round) {
    const r = w / 2
    s.beginPath()
    s.arc(c.width / 2, c.height / 2, r, 0, Math.PI * 2)
    s.stroke()
    s.lineWidth = 1.6
    s.beginPath()
    s.arc(c.width / 2, c.height / 2, r - 9, 0, Math.PI * 2)
    s.stroke()
  } else {
    roughRect(s, margin, margin, w, h, rand, 2.4)
    s.lineWidth = 1.6
    roughRect(s, margin + 7, margin + 7, w - 14, h - 14, rand, 1.6)
  }
  s.textAlign = 'center'
  s.textBaseline = 'alphabetic'
  let y = margin + (h - innerH) / 2
  spec.lines.forEach((l, i) => {
    s.font = l.font
    const m = s.measureText(l.text)
    y += m.actualBoundingBoxAscent || metrics[i].h * 0.8
    s.fillText(l.text, c.width / 2, y)
    y += (m.actualBoundingBoxDescent || 4) + gap
  })
  s.globalCompositeOperation = 'destination-out'
  const holes = Math.round((c.width * c.height) / 90)
  for (let i = 0; i < holes; i++) {
    s.globalAlpha = 0.25 + rand() * 0.75
    s.beginPath()
    s.arc(rand() * c.width, rand() * c.height, 0.4 + rand() * 1.6, 0, Math.PI * 2)
    s.fill()
  }
  g.save()
  g.translate(cx, cy)
  g.rotate(spec.angle)
  g.globalAlpha = 0.92
  g.drawImage(c, -c.width / 2, -c.height / 2)
  g.restore()
}

/** "label ........ value" row. */
export function leaderRow(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  opts: { labelFont: string; valueFont: string; ink: string; rule: string },
): void {
  g.save()
  g.fillStyle = opts.ink
  g.textBaseline = 'alphabetic'
  g.font = opts.labelFont
  g.textAlign = 'left'
  g.fillText(label, x, y)
  const lw = g.measureText(label).width
  g.font = opts.valueFont
  g.textAlign = 'right'
  g.fillText(value, x + w, y)
  const vw = g.measureText(value).width
  g.fillStyle = opts.rule
  for (let dx = x + lw + 10; dx < x + w - vw - 10; dx += 9) g.fillRect(dx, y - 5, 2.4, 2.4)
  g.restore()
}

/** Fill a rect with diagonal engraving hatch. */
export function hatch(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, gap = 7, lw = 2): void {
  g.save()
  g.beginPath()
  g.rect(x, y, w, h)
  g.clip()
  g.strokeStyle = color
  g.lineWidth = lw
  g.beginPath()
  for (let d = -h; d < w + h; d += gap) {
    g.moveTo(x + d, y + h)
    g.lineTo(x + d + h, y)
  }
  g.stroke()
  g.restore()
}

export function mix(a: string, b: string, t: number): string {
  const pa = parseColor(a)
  const pb = parseColor(b)
  if (!pa || !pb) return a
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

/** Accepts `#rrggbb` and `rgb(r, g, b)` — the latter so mixes can be mixed again. */
function parseColor(color: string): [number, number, number] | null {
  const s = color.trim()
  const hex = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(s)
  if (hex) return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)]
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(s)
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null
}
