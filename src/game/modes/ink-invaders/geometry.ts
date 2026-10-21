import type { ModeContext } from '../types'
import type { Enemy } from './state'

export const TOP = 92
export const BOTTOM = 76
export const SIDE = 40

export function marginY(ctx: Pick<ModeContext, 'height'>): number {
  return ctx.height - BOTTOM
}

export function enemyPos(e: Enemy, ctx: Pick<ModeContext, 'width' | 'height'>, time: number): { x: number; y: number } {
  const w = e.w || 90
  const h = e.h || 40
  const usable = Math.max(0, ctx.width - SIDE * 2 - w)
  const sway = Math.sin(time * e.swayFreq + e.swayPhase) * e.swayAmp
  return {
    x: SIDE + e.x * usable + sway,
    y: TOP + e.y * Math.max(0, marginY(ctx) - TOP - h),
  }
}
