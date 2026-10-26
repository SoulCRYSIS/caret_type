import { memo, useEffect, useRef } from 'react'
import type { Juice } from '../../juice/juice'
import { BloomRenderer } from './bloom'
import * as css from './view.css'

/** Ink spreading in from the page edges. `level` is 0 (clear) to 5 (combo ×6). */
export const BloomLayer = memo(function BloomLayer({ level, juice }: { level: number; juice: Juice }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const bloom = useRef<BloomRenderer | null>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const renderer = new BloomRenderer(el, {
      reduced: juice.reducedMotion,
      colors: () => {
        const c = juice.colors()
        return { ink: c.ink, accent: c.accent }
      },
    })
    renderer.resize()
    const ro = new ResizeObserver(() => renderer.resize())
    ro.observe(el)
    bloom.current = renderer
    return () => {
      ro.disconnect()
      renderer.dispose()
      bloom.current = null
    }
  }, [juice])

  useEffect(() => {
    bloom.current?.setLevel(level)
  }, [level, juice])

  return <canvas ref={canvas} className={css.bloom} aria-hidden />
})
