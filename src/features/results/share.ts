import type { AnyGameMode, CardInput } from '../../game/modes/types'
import { FONT_DISPLAY, FONT_MONO } from '../../theme/fonts'
import { readCssColor } from '../../theme/palettes'

const FONT_FACES = [
  `400 40px 'Fraunces Variable'`,
  `italic 400 40px 'Fraunces Variable'`,
  `600 40px 'Fraunces Variable'`,
  `400 40px 'JetBrains Mono Variable'`,
  `700 40px 'JetBrains Mono Variable'`,
]
const THAI_FACES = [`400 40px 'IBM Plex Sans Thai Looped'`, `500 40px 'IBM Plex Sans Thai Looped'`, `400 40px 'Noto Serif Thai'`]
/** The brush face ships in unicode-range slices, so ask for the glyphs the cards actually draw. */
const BRUSH_FACE = `400 40px 'Shojumaru'`
const BRUSH_GLYPHS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#'

async function fontsReady(thai: boolean): Promise<void> {
  const faces = thai ? [...FONT_FACES, ...THAI_FACES] : FONT_FACES
  await Promise.all([
    ...faces.map((f) => document.fonts.load(f, thai ? 'กขค abc' : 'abc').catch(() => null)),
    document.fonts.load(BRUSH_FACE, BRUSH_GLYPHS).catch(() => null),
  ])
}

export function cardColors(): CardInput<unknown>['colors'] {
  return {
    paper: readCssColor('paper'),
    ink: readCssColor('ink'),
    muted: readCssColor('muted'),
    accent: readCssColor('accent'),
    error: readCssColor('error'),
  }
}

export const CARD_FONTS = { display: FONT_DISPLAY, mono: FONT_MONO }

export async function paintCard(canvas: HTMLCanvasElement, mode: AnyGameMode, input: CardInput<unknown>): Promise<void> {
  await fontsReady(input.run.language === 'th')
  canvas.width = mode.card.width
  canvas.height = mode.card.height
  const g = canvas.getContext('2d')
  if (!g) return
  g.clearRect(0, 0, canvas.width, canvas.height)
  mode.card.draw(g, input)
}

export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('empty card'))), 'image/png'))
}

export function cardFileName(input: CardInput<unknown>): string {
  return `caret-${input.run.modeId}-${input.run.score}.png`
}

export async function saveCard(canvas: HTMLCanvasElement, name: string): Promise<void> {
  const blob = await canvasBlob(canvas)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const canCopyImage = typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write

export async function copyCard(canvas: HTMLCanvasElement): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': canvasBlob(canvas) })])
}
