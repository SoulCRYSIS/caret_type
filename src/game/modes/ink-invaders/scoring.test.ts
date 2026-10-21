import { describe, expect, it } from 'vitest'
import { accuracy, killScore, maxPlausibleScore, multiplier, waveBonus, wpm } from './scoring'
import { travelTime, waveConfig } from './waves'

describe('scoring', () => {
  it('steps multiplier at combo tiers', () => {
    expect(multiplier(0)).toBe(1)
    expect(multiplier(11)).toBe(1)
    expect(multiplier(12)).toBe(2)
    expect(multiplier(30)).toBe(3)
    expect(multiplier(500)).toBe(4)
  })

  it('scores kills by length, combo and heaviness', () => {
    expect(killScore(4, 0, false)).toBe(40)
    expect(killScore(4, 30, false)).toBe(120)
    expect(killScore(4, 30, true)).toBe(240)
  })

  it('doubles flawless wave bonus', () => {
    expect(waveBonus(3, false)).toBe(150)
    expect(waveBonus(3, true)).toBe(300)
  })

  it('computes wpm and accuracy', () => {
    expect(wpm(300, 60)).toBe(60)
    expect(wpm(10, 0)).toBe(0)
    expect(accuracy(9, 1)).toBeCloseTo(0.9)
    expect(accuracy(0, 0)).toBe(0)
  })

  it('bounds plausible score above any real run', () => {
    const chars = 400
    const wave = 8
    const realisticMax = killScore(chars, 999, true) + Array.from({ length: wave }, (_, i) => waveBonus(i + 1, true)).reduce((a, b) => a + b)
    expect(maxPlausibleScore(chars, wave)).toBeGreaterThanOrEqual(realisticMax)
  })
})

describe('waves', () => {
  it('gets harder every wave', () => {
    for (let w = 1; w < 20; w++) {
      const a = waveConfig(w, 'medium', 'en')
      const b = waveConfig(w + 1, 'medium', 'en')
      expect(b.count).toBeGreaterThanOrEqual(a.count)
      expect(b.travel).toBeLessThanOrEqual(a.travel)
      expect(b.spawnEvery).toBeLessThanOrEqual(a.spawnEvery)
      expect(b.maxLen).toBeGreaterThanOrEqual(a.maxLen)
    }
  })

  it('adds heavies every fifth wave', () => {
    expect(waveConfig(4, 'easy', 'en').heavies).toBe(0)
    expect(waveConfig(5, 'easy', 'en').heavies).toBe(1)
    expect(waveConfig(10, 'easy', 'en').heavies).toBe(2)
  })

  it('gives longer words and heavies more time', () => {
    const cfg = waveConfig(3, 'medium', 'en')
    const fixed = () => 0.5
    expect(travelTime(cfg, 10, false, fixed)).toBeGreaterThan(travelTime(cfg, 3, false, fixed))
    expect(travelTime(cfg, 5, true, fixed)).toBeGreaterThan(travelTime(cfg, 5, false, fixed))
  })

  it('scales Thai length bounds', () => {
    expect(waveConfig(1, 'medium', 'th').maxLen).toBeGreaterThan(waveConfig(1, 'medium', 'en').maxLen)
  })
})
