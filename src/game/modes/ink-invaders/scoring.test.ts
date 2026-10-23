import { describe, expect, it } from 'vitest'
import { accuracy, comboAfterMiss, killScore, maxPlausibleScore, multiplier, tierProgress, waveBonus, wpm } from './scoring'
import { TARGET_WPM, travelTime, waveConfig } from './waves'

describe('scoring', () => {
  it('steps multiplier at combo tiers', () => {
    expect(multiplier(0)).toBe(1)
    expect(multiplier(9)).toBe(1)
    expect(multiplier(10)).toBe(2)
    expect(multiplier(30)).toBe(3)
    expect(multiplier(70)).toBe(4)
    expect(multiplier(149)).toBe(4)
    expect(multiplier(150)).toBe(5)
    expect(multiplier(5000)).toBe(5)
  })

  it('takes a bite out of the combo on a miss instead of clearing it', () => {
    expect(comboAfterMiss(85)).toBe(65)
    expect(multiplier(comboAfterMiss(160))).toBe(4)
    expect(comboAfterMiss(7)).toBe(0)
  })

  it('reports progress toward the next tier', () => {
    expect(tierProgress(0)).toBe(0)
    expect(tierProgress(20)).toBeCloseTo(0.5)
    expect(tierProgress(150)).toBe(1)
  })

  it('scores kills by length, combo and heaviness', () => {
    expect(killScore(4, 0, false)).toBe(40)
    expect(killScore(4, 30, false)).toBe(120)
    expect(killScore(4, 30, true)).toBe(240)
    expect(killScore(4, 150, false)).toBe(200)
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

  it('grows on a log curve, flattening late', () => {
    const c = (w: number) => waveConfig(w, 'medium', 'en').count
    expect(c(20) - c(10)).toBeLessThan(c(10) - c(1))
    expect(c(30)).toBeLessThan(30)
  })

  it('brings heavies in early and keeps adding them', () => {
    expect(waveConfig(1, 'easy', 'en').heavies).toBe(0)
    expect(waveConfig(3, 'easy', 'en').heavies).toBeGreaterThanOrEqual(1)
    expect(waveConfig(20, 'easy', 'en').heavies).toBeGreaterThan(waveConfig(5, 'easy', 'en').heavies)
  })

  it('starts harder tiers fuller and faster', () => {
    const tiers = (['easy', 'medium', 'hard', 'expert'] as const).map((t) => waveConfig(1, t, 'en'))
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].count).toBeGreaterThan(tiers[i - 1].count)
      expect(tiers[i].travel).toBeLessThan(tiers[i - 1].travel)
      expect(tiers[i].demandWpm).toBeGreaterThan(tiers[i - 1].demandWpm)
    }
  })

  it('asks each tier for its target speed around wave 10', () => {
    for (const t of ['easy', 'medium', 'hard', 'expert'] as const) {
      const ratio = waveConfig(10, t, 'en').demandWpm / TARGET_WPM[t]
      expect(ratio).toBeGreaterThan(0.9)
      expect(ratio).toBeLessThan(1.1)
    }
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
