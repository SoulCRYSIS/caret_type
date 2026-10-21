import type { RunResult } from '../../game/modes/types'

export interface StreakState {
  current: number
  longest: number
  /** Local calendar day (YYYY-MM-DD) of the last qualifying run. */
  lastPlayedDay: string | null
  freezes: number
}

export type StreakEvent = 'started' | 'extended' | 'already' | 'saved-by-freeze' | 'reset'

export const EMPTY_STREAK: StreakState = { current: 0, longest: 0, lastPlayedDay: null, freezes: 0 }
export const MAX_FREEZES = 2
export const FREEZE_EVERY = 7
export const QUALIFY_SECONDS = 60
export const QUALIFY_WAVE = 3

export function qualifies(run: Pick<RunResult, 'durationMs' | 'wave'>): boolean {
  return run.durationMs >= QUALIFY_SECONDS * 1000 || run.wave >= QUALIFY_WAVE
}

/** Calendar day in the given (default: local) time zone, as YYYY-MM-DD. */
export function dayKey(date: Date = new Date(), timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

export function registerPlay(state: StreakState, today: string): { state: StreakState; event: StreakEvent; freezesUsed: number } {
  if (state.lastPlayedDay === today) return { state, event: 'already', freezesUsed: 0 }

  let { current, freezes } = state
  let event: StreakEvent
  let freezesUsed = 0

  if (!state.lastPlayedDay || current === 0) {
    current = 1
    event = 'started'
  } else {
    const gap = daysBetween(state.lastPlayedDay, today)
    if (gap <= 0) {
      // Clock moved backwards; count it as today without changing the streak.
      return { state: { ...state, lastPlayedDay: today }, event: 'already', freezesUsed: 0 }
    }
    const missed = gap - 1
    if (missed === 0) {
      current += 1
      event = 'extended'
    } else if (missed <= freezes) {
      freezes -= missed
      freezesUsed = missed
      current += 1
      event = 'saved-by-freeze'
    } else {
      current = 1
      event = 'reset'
    }
  }

  if (current > 0 && current % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1)

  return {
    state: { current, longest: Math.max(state.longest, current), lastPlayedDay: today, freezes },
    event,
    freezesUsed,
  }
}

export type StreakStatus = 'done-today' | 'at-risk' | 'frozen' | 'broken' | 'none'

/** What the streak looks like right now, without registering a play. */
export function viewStreak(state: StreakState, today: string): { count: number; status: StreakStatus } {
  if (!state.lastPlayedDay || state.current === 0) return { count: 0, status: 'none' }
  const gap = daysBetween(state.lastPlayedDay, today)
  if (gap <= 0) return { count: state.current, status: 'done-today' }
  if (gap === 1) return { count: state.current, status: 'at-risk' }
  if (gap - 1 <= state.freezes) return { count: state.current, status: 'frozen' }
  return { count: 0, status: 'broken' }
}

/** Combine two devices' streaks: the more recent one wins, longest is the max. */
export function mergeStreak(a: StreakState, b: StreakState | null | undefined): StreakState {
  if (!b) return a
  const aDay = a.lastPlayedDay ?? ''
  const bDay = b.lastPlayedDay ?? ''
  let winner: StreakState
  if (aDay === bDay) winner = a.current >= b.current ? a : b
  else winner = aDay > bDay ? a : b
  return { ...winner, longest: Math.max(a.longest, b.longest, winner.current) }
}
