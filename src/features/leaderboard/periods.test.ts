import { describe, expect, it } from 'vitest'
import { boardId, isoWeek, periodKey } from './periods'

describe('leaderboard periods', () => {
  it('computes ISO weeks, including year edges', () => {
    expect(isoWeek(new Date(Date.UTC(2026, 9, 21)))).toBe('2026-W43')
    expect(isoWeek(new Date(Date.UTC(2021, 0, 3)))).toBe('2020-W53')
    expect(isoWeek(new Date(Date.UTC(2024, 11, 30)))).toBe('2025-W01')
  })

  it('builds stable board ids', () => {
    const d = new Date(Date.UTC(2026, 9, 21, 23, 59))
    expect(periodKey('day', d)).toBe('day-2026-10-21')
    expect(boardId('ink-invaders', 'th', 'hard', 'all', d)).toBe('ink-invaders_th_hard_all')
    expect(boardId('ink-invaders', 'en', 'easy', 'week', d)).toBe('ink-invaders_en_easy_week-2026-W43')
  })
})
