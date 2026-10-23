import { FONT_BRUSH } from '../../../theme/fonts'
import { drawMark } from '../../../theme/mark'
import { fitSize, flick, font, grain, mix, seeded, tracking, type Rand } from '../../cards/print'
import { brushStroke, enso, hanko, SEAL_RED, spineText, washi } from '../../cards/sumi'
import { getLanguage } from '../../words/languages'
import type { CardInput, ModeCard } from '../types'
import type { InkDetails } from './state'

const W = 1080
const H = 1350
const BAND = 64

type Input = CardInput<InkDetails>

function pick<T>(rand: Rand, items: T[]): T {
  return items[Math.floor(rand() * items.length)]
}

function fmtTime(ms: number): string {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Three short lines about the run, in the spirit of a haiku (syllables not counted). */
function verse(input: Input, rand: Rand): [string, string, string] {
  const { run, details, personalBest } = input
  const first = pick(rand, ['ink on the margin', 'a quiet page fills', 'black rain on paper', 'the brush does not wait', 'words drift down like leaves'])
  const second = pick(rand, [
    `${run.kills} words fall at ${Math.round(run.wpm)} a minute`,
    `wave ${run.wave} breaks against the page`,
    `${run.kills} strokes, ${(run.accuracy * 100).toFixed(0)} in a hundred true`,
  ])
  const spilled = details.spilled.at(-1)
  let third: string
  if (personalBest) third = 'a new mark is pressed'
  else if (details.flawlessWaves >= 2) third = 'not one drop was spilled'
  else if (spilled) third = `“${spilled}” seeps through`
  else third = 'the ink is dry now'
  return [first, second, third]
}

function drawWaves(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, input: Input, rand: Rand) {
  const { colors, fonts } = input
  const all = input.run.wpmByWave
  const values = all.slice(-16)
  const offset = all.length - values.length
  const max = Math.max(10, ...values)
  const best = values.indexOf(Math.max(...values))

  g.fillStyle = colors.ink
  g.font = font(30, FONT_BRUSH)
  g.textAlign = 'left'
  g.textBaseline = 'alphabetic'
  g.fillText('waves', x, y + 40)
  g.fillStyle = colors.muted
  g.font = font(11, fonts.mono, 500)
  tracking(g, 2)
  g.fillText('WPM BY WAVE', x, y + 66)
  tracking(g, 0)

  const left = x + 150
  const slot = (w - 150) / Math.max(values.length, 8)
  values.forEach((v, i) => {
    const bh = Math.max(10, (v / max) * h)
    const bx = left + i * slot + slot / 2
    const color = i === best ? colors.accent : colors.ink
    brushStroke(g, bx, y + h, bx + (rand() - 0.5) * 4, y + h - bh, Math.min(22, slot * 0.55), color, rand)
    g.fillStyle = colors.muted
    g.font = font(14, fonts.mono, 400)
    g.textAlign = 'center'
    g.fillText(String(offset + i + 1), bx, y + h + 24)
    if (i === best) {
      g.fillStyle = colors.accent
      g.font = font(18, fonts.mono, 600)
      g.fillText(String(Math.round(v)), bx, y + h - bh - 14)
    }
  })
  g.textAlign = 'left'
}

export const inkCard: ModeCard<InkDetails> = {
  width: W,
  height: H,

  draw(g, input) {
    const { run, colors, fonts } = input
    const rand = seeded(run.startedAt ^ (run.score * 2654435761))
    const lang = getLanguage(run.language)
    const band = mix(colors.paper, colors.ink, 0.2)
    const seal = SEAL_RED

    // the mounting: silk bands top and bottom, paper between
    g.fillStyle = band
    g.fillRect(0, 0, W, H)
    g.fillStyle = colors.paper
    g.fillRect(28, BAND, W - 56, H - BAND * 2)
    washi(g, 28, BAND, W - 56, H - BAND * 2, colors.ink, rand)
    grain(g, W, H, colors.ink, rand, 2600)
    g.strokeStyle = mix(band, colors.ink, 0.3)
    g.lineWidth = 2
    g.strokeRect(28, BAND, W - 56, H - BAND * 2)
    g.fillStyle = mix(band, colors.ink, 0.25)
    g.fillRect(0, 0, W, 6)
    g.fillRect(0, H - 6, W, 6)

    // header line in the top band
    g.fillStyle = mix(band, colors.ink, 0.65)
    g.font = font(17, fonts.mono, 500)
    tracking(g, 3)
    g.textBaseline = 'middle'
    g.textAlign = 'left'
    g.fillText(`NO. ${String(input.issue).padStart(4, '0')}`, 52, BAND / 2)
    g.textAlign = 'right'
    g.fillText(
      `${new Date(run.endedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}  ·  ${lang.name.toUpperCase()} · ${run.tier.toUpperCase()}`,
      W - 52,
      BAND / 2,
    )
    tracking(g, 0)
    g.textBaseline = 'alphabetic'

    // title running down the right edge like a scroll's spine
    const colX = W - 118
    g.fillStyle = colors.ink
    const titleSize = fitSize(g, 'Ink Invaders', 600, 92, (s) => font(s, FONT_BRUSH))
    g.font = font(titleSize, FONT_BRUSH)
    const titleEnd = spineText(g, 'Ink Invaders', colX, BAND + 70)
    hanko(g, colX, titleEnd + 66, { mark: true, size: 74, color: seal, font: font(30, FONT_BRUSH) }, rand)

    // the ensō, holding the score
    const cx = 440
    const cy = 470
    const R = 286
    enso(g, { cx, cy, r: R, width: 74, color: colors.ink }, rand)
    flick(g, cx + R * 0.82, cy - R * 0.78, 60, colors.ink, rand, 18)

    g.fillStyle = colors.muted
    g.font = font(34, FONT_BRUSH)
    g.textAlign = 'center'
    g.fillText('score', cx, cy - 96)
    const scoreText = run.score.toLocaleString('en-US')
    const scoreSize = fitSize(g, scoreText, R * 1.36, 150, (s) => font(s, fonts.display, 500))
    g.font = font(scoreSize, fonts.display, 500)
    g.fillStyle = colors.ink
    g.fillText(scoreText, cx, cy + scoreSize * 0.34)
    g.fillStyle = colors.muted
    g.font = font(18, fonts.mono, 500)
    tracking(g, 4)
    g.fillText('POINTS', cx, cy + scoreSize * 0.34 + 46)
    tracking(g, 0)

    if (input.personalBest) {
      hanko(g, cx + R * 0.86, cy + R * 0.62, { lines: ['NEW', 'BEST'], size: 108, color: seal, font: font(46, FONT_BRUSH), angle: 0.08 }, rand)
    }

    // verse
    const lines = verse(input, rand)
    g.fillStyle = mix(colors.ink, colors.paper, 0.2)
    g.font = font(30, fonts.display, 400, true)
    g.textAlign = 'left'
    lines.forEach((line, i) => g.fillText(line, 96 + i * 46, 846 + i * 42))

    // ledger: brushed words over figures
    const stats: [string, string, string][] = [
      ['speed', 'wpm', `${run.wpm.toFixed(1)}`],
      ['aim', 'accuracy', `${(run.accuracy * 100).toFixed(1)}%`],
      ['wave', 'reached', `${run.wave}`],
      ['combo', 'best', `${run.maxCombo}`],
      ['words', 'inked', `${run.kills}`],
      ['time', 'held', fmtTime(run.durationMs)],
    ]
    const top = 1000
    const left = 70
    const colW = (W - 140) / stats.length
    stats.forEach(([word, label, value], i) => {
      const x = left + colW * i + colW / 2
      if (i > 0) brushStroke(g, left + colW * i, top - 40, left + colW * i + 2, top + 92, 3, mix(colors.paper, colors.ink, 0.35), rand)
      g.textAlign = 'center'
      g.fillStyle = colors.ink
      g.font = font(fitSize(g, word, colW - 30, 32, (s) => font(s, FONT_BRUSH)), FONT_BRUSH)
      g.fillText(word, x, top + 6)
      g.fillStyle = colors.muted
      g.font = font(10, fonts.mono, 500)
      tracking(g, 2)
      g.fillText(label.toUpperCase(), x, top + 34)
      tracking(g, 0)
      g.fillStyle = colors.ink
      const size = fitSize(g, value, colW - 14, 32, (s) => font(s, fonts.display, 500))
      g.font = font(size, fonts.display, 500)
      g.fillText(value, x, top + 80)
    })

    drawWaves(g, 78, 1140, 600, 80, input, rand)

    // signature: name in the corner with seals beneath, the way a painter signs
    const sigX = W - 150
    g.fillStyle = colors.ink
    g.textAlign = 'center'
    const name = input.player ?? 'a guest typist'
    const nameSize = fitSize(g, name, 260, 30, (s) => font(s, fonts.display, 400, true))
    g.font = font(nameSize, fonts.display, 400, true)
    g.fillText(name, sigX, 1150)
    const seals: string[][] = []
    if (input.streak && input.streak > 0) seals.push([String(input.streak), input.streak === 1 ? 'DAY' : 'DAYS'])
    if (input.rank) seals.push(['RANK', `#${input.rank}`])
    if (seals.length === 0) seals.push([])
    seals.forEach((lines, i) => {
      hanko(
        g,
        sigX - (seals.length - 1) * 48 + i * 96,
        1218,
        { lines, mark: lines.length === 0, size: 80, color: seal, font: font(30, FONT_BRUSH), angle: (rand() - 0.5) * 0.1, filled: i === 0 },
        rand,
      )
    })

    // foot band
    g.fillStyle = mix(band, colors.ink, 0.65)
    g.font = font(17, fonts.mono, 500)
    tracking(g, 3)
    g.textBaseline = 'middle'
    g.textAlign = 'left'
    drawMark(g, 66, H - BAND / 2, 34, mix(band, colors.ink, 0.8), colors.accent)
    g.fillText('TYPE IN INK', 92, H - BAND / 2)
    g.textAlign = 'right'
    g.fillText(input.site.toUpperCase(), W - 52, H - BAND / 2)
    tracking(g, 0)
    g.textBaseline = 'alphabetic'
  },
}
