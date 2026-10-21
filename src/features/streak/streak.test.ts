import { describe, expect, it } from 'vitest'
import { dayKey, daysBetween, EMPTY_STREAK, mergeStreak, qualifies, registerPlay, viewStreak, type StreakState } from './streak'

const s = (p: Partial<StreakState>): StreakState => ({ ...EMPTY_STREAK, ...p })

describe('dayKey', () => {
  it('uses the given time zone', () => {
    // 2026-10-21 20:00 UTC is already the 22nd in Bangkok, still the 21st in Los Angeles.
    const d = new Date(Date.UTC(2026, 9, 21, 20, 0))
    expect(dayKey(d, 'Asia/Bangkok')).toBe('2026-10-22')
    expect(dayKey(d, 'America/Los_Angeles')).toBe('2026-10-21')
    expect(dayKey(d, 'UTC')).toBe('2026-10-21')
  })

  it('counts days across month and DST boundaries', () => {
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1)
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
  })
})

describe('registerPlay', () => {
  it('starts a streak', () => {
    const r = registerPlay(EMPTY_STREAK, '2026-10-21')
    expect(r.event).toBe('started')
    expect(r.state).toMatchObject({ current: 1, longest: 1, lastPlayedDay: '2026-10-21' })
  })

  it('only counts once per day', () => {
    const st = s({ current: 3, longest: 3, lastPlayedDay: '2026-10-21' })
    const r = registerPlay(st, '2026-10-21')
    expect(r.event).toBe('already')
    expect(r.state).toBe(st)
  })

  it('extends on consecutive days', () => {
    const r = registerPlay(s({ current: 3, longest: 5, lastPlayedDay: '2026-10-20' }), '2026-10-21')
    expect(r.event).toBe('extended')
    expect(r.state.current).toBe(4)
    expect(r.state.longest).toBe(5)
  })

  it('uses freezes to cover missed days', () => {
    const r = registerPlay(s({ current: 9, longest: 9, lastPlayedDay: '2026-10-18', freezes: 2 }), '2026-10-21')
    expect(r.event).toBe('saved-by-freeze')
    expect(r.freezesUsed).toBe(2)
    expect(r.state).toMatchObject({ current: 10, freezes: 0 })
  })

  it('resets when freezes are not enough', () => {
    const r = registerPlay(s({ current: 9, longest: 9, lastPlayedDay: '2026-10-17', freezes: 2 }), '2026-10-21')
    expect(r.event).toBe('reset')
    expect(r.state).toMatchObject({ current: 1, longest: 9, freezes: 2 })
  })

  it('earns a freeze every 7 days, capped', () => {
    expect(registerPlay(s({ current: 6, lastPlayedDay: '2026-10-20' }), '2026-10-21').state.freezes).toBe(1)
    expect(registerPlay(s({ current: 13, lastPlayedDay: '2026-10-20', freezes: 2 }), '2026-10-21').state.freezes).toBe(2)
  })

  it('ignores clock moving backwards', () => {
    const r = registerPlay(s({ current: 4, lastPlayedDay: '2026-10-21' }), '2026-10-20')
    expect(r.event).toBe('already')
    expect(r.state.current).toBe(4)
  })
})

describe('viewStreak', () => {
  const st = s({ current: 5, lastPlayedDay: '2026-10-20', freezes: 1 })
  it('reports status by gap', () => {
    expect(viewStreak(st, '2026-10-20').status).toBe('done-today')
    expect(viewStreak(st, '2026-10-21').status).toBe('at-risk')
    expect(viewStreak(st, '2026-10-22').status).toBe('frozen')
    expect(viewStreak(st, '2026-10-23')).toEqual({ count: 0, status: 'broken' })
    expect(viewStreak(EMPTY_STREAK, '2026-10-23').status).toBe('none')
  })
})

describe('mergeStreak', () => {
  it('prefers the most recent play and keeps the longest', () => {
    const a = s({ current: 2, longest: 2, lastPlayedDay: '2026-10-21' })
    const b = s({ current: 30, longest: 40, lastPlayedDay: '2026-10-01' })
    expect(mergeStreak(a, b)).toMatchObject({ current: 2, longest: 40, lastPlayedDay: '2026-10-21' })
    expect(mergeStreak(a, null)).toBe(a)
  })

  it('breaks ties by current', () => {
    const a = s({ current: 2, lastPlayedDay: '2026-10-21' })
    const b = s({ current: 6, lastPlayedDay: '2026-10-21' })
    expect(mergeStreak(a, b).current).toBe(6)
  })
})

describe('qualifies', () => {
  it('needs a minute or wave 3', () => {
    expect(qualifies({ durationMs: 30_000, wave: 1 })).toBe(false)
    expect(qualifies({ durationMs: 61_000, wave: 1 })).toBe(true)
    expect(qualifies({ durationMs: 10_000, wave: 3 })).toBe(true)
  })
})
