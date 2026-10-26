import { memo, useEffect, useRef } from 'react'
import type { Juice } from '../../juice/juice'
import { FireRenderer } from './flames'
import * as css from './view.css'

/** Ink tongues along the page edges. `level` is 0 (out) to 4 (combo ×6). */
export const FireLayer = memo(function FireLayer({ level, juice }: { level: number; juice: Juice }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const fire = useRef<FireRenderer | null>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const renderer = new FireRenderer(el, {
      reduced: juice.reducedMotion,
      flecks: () => juice.particles.enabled,
      colors: () => {
        const c = juice.colors()
        return { ink: c.ink, accent: c.accent }
      },
    })
    renderer.resize()
    const ro = new ResizeObserver(() => renderer.resize())
    ro.observe(el)
    fire.current = renderer
    return () => {
      ro.disconnect()
      renderer.dispose()
      fire.current = null
    }
  }, [juice])

  useEffect(() => {
    fire.current?.setLevel(level)
  }, [level, juice])

  return <canvas ref={canvas} className={css.fire} aria-hidden />
})
