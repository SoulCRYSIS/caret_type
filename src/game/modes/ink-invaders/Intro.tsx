import { useEffect, useRef } from 'react'
import { useSettings } from '../../../features/settings/settingsStore'
import { CaretMark } from '../../../ui/CaretMark'
import { readCssColor } from '../../../theme/palettes'
import { seeded } from '../../cards/print'
import { enso } from '../../cards/sumi'
import { prefersReducedMotion } from '../../juice/juice'
import { getLanguage } from '../../words/languages'
import type { IntroProps } from '../types'
import * as css from './intro.css'
import * as enemyCss from './view.css'

const SIZE = 400
const DRAW_MS = 1100

function EnsoCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const paletteId = useSettings((s) => s.paletteId)
  const custom = useSettings((s) => s.customPalette)

  useEffect(() => {
    const canvas = ref.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    const ink = readCssColor('ink')
    const paint = (progress: number) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, SIZE, SIZE)
      enso(g, { cx: SIZE / 2, cy: SIZE / 2, r: SIZE * 0.38, width: SIZE * 0.085, color: ink, progress }, seeded(20240607))
    }
    if (prefersReducedMotion()) {
      paint(1)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DRAW_MS)
      paint(1 - (1 - t) ** 3)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paletteId, custom])

  return <canvas ref={ref} className={css.enso} aria-hidden />
}

export function InkIntro({ ready, error }: IntroProps) {
  const language = useSettings((s) => s.language)
  const lang = getLanguage(language)

  return (
    <div className={css.intro}>
      <div className={css.scene}>
        <EnsoCanvas />
        <div className={css.word}>
          <span className={enemyCss.stamp} lang={language} style={{ fontSize: 30, padding: '10px 20px 12px', animation: 'none' }}>
            <span className={enemyCss.frame} aria-hidden />
            {lang.startWord}
          </span>
        </div>
        <div className={css.title} aria-label="ink invaders">
          <span className={css.titleSpine} aria-hidden>
            Ink Invaders
          </span>
          <span className={css.seal} aria-hidden>
            <CaretMark className={css.sealMark} dot="currentColor" />
          </span>
        </div>
      </div>

      <h1 className={css.prompt}>
        type any key to begin
        <span className={css.caret} aria-hidden />
      </h1>
      <p className={css.blurb}>
        Words drift toward the margin like falling ink. Type each one before it spills. Combo climbs to ×5; a mistype costs 20 of it, a spill costs it all.
      </p>
      {(error || !ready) && <div className={css.hints}>{error ? "couldn't load the word list — check your connection" : 'grinding the ink…'}</div>}
    </div>
  )
}
