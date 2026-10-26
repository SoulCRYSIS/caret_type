import { describe, expect, it } from 'vitest'
import { monthLabels, mostPlayedKey, niceScale, type SetBest } from './analysis'

const best = (key: string, runs: number): SetBest => ({ key, modeId: 'm', language: 'en', tier: 'easy', runs, bestScore: 0, bestWpm: 0, bestWave: 0 })

describe('niceScale', () => {
  it('gives a round top above the data with at most 4 steps', () => {
    for (const max of [3, 12, 37, 54.2, 88, 140, 260, 900]) {
      const { top, step } = niceScale(max)
      expect(top).toBeGreaterThanOrEqual(max)
      expect(top / step).toBeLessThanOrEqual(4)
      expect(top % step).toBe(0)
    }
  })
})

describe('mostPlayedKey', () => {
  it('picks the set with the most runs, first on ties, null when empty', () => {
    expect(mostPlayedKey([best('a', 2), best('b', 5), best('c', 5)])).toBe('b')
    expect(mostPlayedKey([])).toBeNull()
  })
})

describe('monthLabels', () => {
  const name = (m: number) => `m${m}`
  it('drops a first label that would collide with the next month', () => {
    const weeks = [['2026-06-22'], ['2026-06-29'], ['2026-07-06'], ['2026-07-13'], ['2026-07-20'], ['2026-07-27'], ['2026-08-03']]
    expect(monthLabels(weeks, name)).toEqual([null, null, 'm7', null, null, null, 'm8'])
  })
  it('keeps the first label when the month lasts a while', () => {
    const weeks = [['2026-07-06'], ['2026-07-13'], ['2026-07-20'], ['2026-07-27'], ['2026-08-03']]
    expect(monthLabels(weeks, name)).toEqual(['m7', null, null, null, 'm8'])
  })
})
