/** Sumi-e brush helpers: ensō, brush strokes, hanko seals, washi paper. */

import { drawMark } from '../../theme/mark'
import type { Rand } from './print'

/** Vermilion seal ink (shuniku) — the same on every palette. */
export const SEAL_RED = '#c8402e'

interface Bristle {
  off: number
  dryAt: number
  alpha: number
  w: number
}

function bristles(rand: Rand, count: number): Bristle[] {
  return Array.from({ length: count }, (_, i) => {
    const off = (i / (count - 1)) * 2 - 1
    const edge = Math.abs(off)
    return {
      off: off + (rand() - 0.5) * 0.04,
      // outer hairs run dry first, which gives the stroke its frayed tail
      dryAt: 0.98 - edge * edge * (0.35 + rand() * 0.3) - rand() * 0.08,
      alpha: 0.35 + rand() * 0.5,
      w: 0.6 + rand() * 1.1,
    }
  })
}

/** Low-frequency wobble so a stroke never looks machine-drawn. */
function wobble(rand: Rand): (t: number) => number {
  const a = [rand() * 6.28, rand() * 6.28, rand() * 6.28]
  return (t) => Math.sin(t * 5.1 + a[0]) * 0.5 + Math.sin(t * 9.7 + a[1]) * 0.3 + Math.sin(t * 17.3 + a[2]) * 0.2
}

interface StrokePath {
  /** Point on the stroke's spine and the unit normal at parameter t in 0..1. */
  at(t: number): { x: number; y: number; nx: number; ny: number }
  /** Full brush width at t. */
  width(t: number): number
}

function paintStroke(g: CanvasRenderingContext2D, path: StrokePath, color: string, rand: Rand, progress: number, hairs = 54, steps = 220) {
  const end = Math.max(0, Math.min(1, progress))
  if (end <= 0) return
  g.save()
  g.strokeStyle = color
  g.fillStyle = color
  g.lineCap = 'round'
  g.lineJoin = 'round'

  // solid body where the brush is still loaded
  g.globalAlpha = 0.92
  g.beginPath()
  const bodyEnd = Math.min(end, 0.78)
  const n = Math.max(2, Math.round(steps * bodyEnd))
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * bodyEnd
    const p = path.at(t)
    const w = path.width(t) * 0.36
    if (i === 0) g.moveTo(p.x + p.nx * w, p.y + p.ny * w)
    else g.lineTo(p.x + p.nx * w, p.y + p.ny * w)
  }
  for (let i = n; i >= 0; i--) {
    const t = (i / n) * bodyEnd
    const p = path.at(t)
    const w = path.width(t) * 0.36
    g.lineTo(p.x - p.nx * w, p.y - p.ny * w)
  }
  g.closePath()
  g.fill()

  // individual hairs, breaking up as they dry
  for (const b of bristles(rand, hairs)) {
    const stop = Math.min(end, b.dryAt)
    if (stop <= 0.02) continue
    g.globalAlpha = b.alpha
    g.lineWidth = b.w * (path.width(0.2) / hairs) * 2.4
    g.beginPath()
    let drawing = false
    const m = Math.max(2, Math.round(steps * stop))
    for (let i = 0; i <= m; i++) {
      const t = (i / m) * stop
      // dry-brush gaps near the end of each hair
      const dry = t > b.dryAt - 0.22 && rand() < (t - (b.dryAt - 0.22)) * 2.4
      const p = path.at(t)
      const half = path.width(t) / 2
      const x = p.x + p.nx * b.off * half
      const y = p.y + p.ny * b.off * half
      if (dry) {
        drawing = false
        continue
      }
      if (!drawing) {
        g.moveTo(x, y)
        drawing = true
      } else g.lineTo(x, y)
    }
    g.stroke()
  }

  // ink pools where the brush first touches down
  const s = path.at(0)
  g.globalAlpha = 0.9
  g.beginPath()
  g.ellipse(s.x, s.y, path.width(0) * 0.42, path.width(0) * 0.34, Math.atan2(s.ny, s.nx), 0, Math.PI * 2)
  g.fill()
  g.restore()
}

export interface EnsoSpec {
  cx: number
  cy: number
  r: number
  width: number
  color: string
  /** 0..1, for drawing it on over time. */
  progress?: number
}

/** The zen circle: one breath, one stroke, left open. */
export function enso(g: CanvasRenderingContext2D, spec: EnsoSpec, rand: Rand): void {
  const start = -Math.PI * 0.62 + (rand() - 0.5) * 0.3
  const sweep = Math.PI * 2 * (0.84 + rand() * 0.07)
  const wob = wobble(rand)
  const squash = 1 + (rand() - 0.5) * 0.06
  const path: StrokePath = {
    at(t) {
      const a = start + sweep * t
      const r = spec.r * (1 + wob(t) * 0.022 + t * 0.03)
      const nx = Math.cos(a)
      const ny = Math.sin(a)
      return { x: spec.cx + nx * r * squash, y: spec.cy + ny * r, nx, ny }
    },
    width(t) {
      const press = Math.min(1, t * 7)
      return spec.width * (0.55 + 0.45 * press) * (1 - 0.62 * t * t) * (1 + wob(t * 1.7) * 0.08)
    },
  }
  paintStroke(g, path, spec.color, rand, spec.progress ?? 1)
}

/** A single horizontal brush stroke, thick to thin. */
export function brushStroke(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, width: number, color: string, rand: Rand, progress = 1): void {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const wob = wobble(rand)
  const bow = (rand() - 0.5) * width * 0.8
  const path: StrokePath = {
    at(t) {
      const lift = Math.sin(t * Math.PI) * bow + wob(t) * width * 0.08
      return { x: x0 + dx * t + nx * lift, y: y0 + dy * t + ny * lift, nx, ny }
    },
    width(t) {
      return width * (0.6 + 0.4 * Math.min(1, t * 6)) * (1 - 0.7 * t * t)
    },
  }
  paintStroke(g, path, color, rand, progress, 28, Math.max(40, Math.round(len / 4)))
}

/** Washi: long faint fibres over the sheet. */
export function washi(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, rand: Rand, count = 1100): void {
  g.save()
  g.strokeStyle = color
  g.lineCap = 'round'
  for (let i = 0; i < count; i++) {
    const px = x + rand() * w
    const py = y + rand() * h
    const len = 6 + rand() * rand() * 46
    const a = rand() * Math.PI * 2
    const bend = (rand() - 0.5) * len * 0.6
    g.globalAlpha = 0.025 + rand() * 0.06
    g.lineWidth = 0.6 + rand() * 1.1
    g.beginPath()
    g.moveTo(px, py)
    g.quadraticCurveTo(px + Math.cos(a) * len * 0.5 - Math.sin(a) * bend, py + Math.sin(a) * len * 0.5 + Math.cos(a) * bend, px + Math.cos(a) * len, py + Math.sin(a) * len)
    g.stroke()
  }
  g.restore()
}

export interface HankoSpec {
  /** Lines of text, top to bottom; each is fitted to the seal's width. */
  lines?: string[]
  /** Carve the caret mark instead of text. */
  mark?: boolean
  size: number
  color: string
  font: string
  angle?: number
  /** Carve the characters out of a filled block (shubun) instead of raising them (hakubun-style outline). */
  filled?: boolean
}

/** A red name seal: square, rough-edged, unevenly inked. */
export function hanko(g: CanvasRenderingContext2D, cx: number, cy: number, spec: HankoSpec, rand: Rand): void {
  const pad = Math.round(spec.size * 0.12)
  const c = document.createElement('canvas')
  c.width = c.height = spec.size + pad * 2
  const s = c.getContext('2d')
  if (!s) return
  const x0 = pad
  const size = spec.size
  const filled = spec.filled ?? true
  s.fillStyle = spec.color
  s.strokeStyle = spec.color

  const corner = size * 0.08
  s.beginPath()
  s.roundRect(x0, x0, size, size, corner)
  if (filled) s.fill()
  else {
    s.lineWidth = size * 0.07
    s.stroke()
  }

  const lines = spec.lines ?? []
  const rows = lines.length
  const inner = size * 0.76
  const rowH = inner / Math.max(1, rows)
  s.textAlign = 'center'
  s.textBaseline = 'middle'
  s.globalCompositeOperation = filled ? 'destination-out' : 'source-over'
  if (spec.mark) drawMark(s, x0 + size / 2, x0 + size / 2, size * 0.92, spec.color, spec.color)
  lines.forEach((line, i) => {
    let px = rowH * 0.92
    s.font = spec.font.replace(/\d+px/, `${Math.round(px)}px`)
    const w = s.measureText(line).width
    if (w > inner) {
      px *= inner / w
      s.font = spec.font.replace(/\d+px/, `${Math.round(px)}px`)
    }
    s.fillText(line, x0 + size / 2, x0 + size / 2 + (i - (rows - 1) / 2) * rowH + px * 0.06)
  })

  // worn stone: erode edges and speckle the ink
  s.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < size * 1.6; i++) {
    const side = Math.floor(rand() * 4)
    const t = rand() * size
    const px = side === 0 ? x0 + t : side === 1 ? x0 + size : side === 2 ? x0 + t : x0
    const py = side === 0 ? x0 : side === 1 ? x0 + t : side === 2 ? x0 + size : x0 + t
    s.globalAlpha = 0.5 + rand() * 0.5
    s.beginPath()
    s.arc(px, py, 0.5 + rand() * size * 0.025, 0, Math.PI * 2)
    s.fill()
  }
  for (let i = 0; i < size * size * 0.012; i++) {
    s.globalAlpha = 0.15 + rand() * 0.6
    s.beginPath()
    s.arc(x0 + rand() * size, x0 + rand() * size, 0.4 + rand() * 1.4, 0, Math.PI * 2)
    s.fill()
  }

  g.save()
  g.translate(cx, cy)
  g.rotate(spec.angle ?? 0)
  g.globalAlpha = 0.9
  g.drawImage(c, -c.width / 2, -c.height / 2)
  g.restore()
}

/** Text running down the page like a scroll's spine (rotated a quarter turn); returns the y where it ends. */
export function spineText(g: CanvasRenderingContext2D, text: string, x: number, y: number): number {
  const width = g.measureText(text).width
  g.save()
  g.translate(x, y)
  g.rotate(Math.PI / 2)
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  g.fillText(text, 0, 0)
  g.restore()
  return y + width
}
