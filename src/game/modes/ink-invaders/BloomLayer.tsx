import { memo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Juice } from '../../juice/juice'
import { BloomRenderer } from './bloom'
import * as css from './view.css'

/** Ink spreading in from the page corners, outside the play port. `level` is 0 (clear) to 9 (combo ×10). */
export const BloomLayer = memo(function BloomLayer({ level, juice }: { level: number; juice: Juice }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const bloom = useRef<BloomRenderer | null>(null)
  const host = document.querySelector<HTMLElement>('[data-puddles]')

  useEffect(() => {
    const el = canvas.current
    if (!el || !host) return
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
  }, [juice, host])

  useEffect(() => {
    bloom.current?.setLevel(level)
  }, [level, juice])

  if (!host) return null
  return createPortal(<canvas ref={canvas} className={css.bloom} aria-hidden />, host)
})
