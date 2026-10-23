/** The caret mark from the favicon, on a 32×32 grid: an ink chevron with a red dot. */
export const MARK_VIEWBOX = 32
export const MARK_CHEVRON = 'M9 21 L16 10 L23 21'
export const MARK_STROKE = 3.2
export const MARK_DOT = { cx: 24, cy: 25, r: 2.4 }

/** Paints the mark centred on (cx, cy), `size` px square. */
export function drawMark(g: CanvasRenderingContext2D, cx: number, cy: number, size: number, ink: string, dot: string): void {
  const k = size / MARK_VIEWBOX
  g.save()
  g.translate(cx - size / 2, cy - size / 2)
  g.scale(k, k)
  g.strokeStyle = ink
  g.lineWidth = MARK_STROKE
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.stroke(new Path2D(MARK_CHEVRON))
  g.fillStyle = dot
  g.beginPath()
  g.arc(MARK_DOT.cx, MARK_DOT.cy, MARK_DOT.r, 0, Math.PI * 2)
  g.fill()
  g.restore()
}
