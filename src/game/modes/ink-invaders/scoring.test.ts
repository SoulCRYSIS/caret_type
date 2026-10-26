import { describe, expect, it } from 'vitest'
import { accuracy, comboAfterMiss, killScore, maxPlausibleScore, MISS_COMBO_PENALTY, multiplier, tierProgress, waveBonus, wpm } from './scoring'
import { LANGUAGES, type LanguageId } from '../../words/languages'
import { DEATH_WAVE, DOUBLING_WAVES, expectedDeathWave, TARGET_WPM, travelTime, waveConfig } from './waves'

describe('scoring', () => {
  it('steps multiplier at combo tiers', () => {
    expect(multiplier(0)).toBe(1)
    expect(multiplier(19)).toBe(1)
    expect(multiplier(20)).toBe(2)
    expect(multiplier(50)).toBe(3)
    expect(multiplier(150)).toBe(4)
    expect(multiplier(400)).toBe(5)
    expect(multiplier(999)).toBe(5)
    expect(multiplier(1000)).toBe(6)
    expect(multiplier(5000)).toBe(6)
  })

  it('takes a bite out of the combo on a miss instead of clearing it', () => {
    expect(comboAfterMiss(85, 'medium')).toBe(85 - MISS_COMBO_PENALTY.medium)
    expect(comboAfterMiss(MISS_COMBO_PENALTY.medium - 1, 'medium')).toBe(0)
  })

  it('takes a bigger bite on harder tiers', () => {
    const tiers = ['easy', 'medium', 'hard', 'expert'] as const
    for (let i = 1; i < tiers.length; i++) {
      expect(comboAfterMiss(100, tiers[i])).toBeLessThan(comboAfterMiss(100, tiers[i - 1]))
    }
  })

  it('reports progress toward the next tier', () => {
    expect(tierProgress(0)).toBe(0)
    expect(tierProgress(10)).toBeCloseTo(0.5)
    expect(tierProgress(1000)).toBe(1)
  })

  it('scores kills by length, combo and heaviness', () => {
    expect(killScore(4, 0, false)).toBe(40)
    expect(killScore(4, 50, false)).toBe(120)
    expect(killScore(4, 50, true)).toBe(240)
    expect(killScore(4, 1000, false)).toBe(240)
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
    const realisticMax = killScore(chars, 99999, true) + Array.from({ length: wave }, (_, i) => waveBonus(i + 1, true)).reduce((a, b) => a + b)
    expect(maxPlausibleScore(chars, wave)).toBeGreaterThanOrEqual(realisticMax)
  })
})

const TIER_IDS = ['easy', 'medium', 'hard', 'expert'] as const

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
      expect(tiers[i].perChar).toBeLessThan(tiers[i - 1].perChar)
      expect(tiers[i].demandWpm).toBeGreaterThan(tiers[i - 1].demandWpm)
    }
  })

  it('drops words faster every wave', () => {
    for (const t of ['easy', 'medium', 'hard', 'expert'] as const) {
      for (let w = 1; w < 30; w++) expect(waveConfig(w + 1, t, 'en').travel).toBeLessThan(waveConfig(w, t, 'en').travel)
    }
  })

  it('ends a target-speed run in wave 10, and each doubling of speed buys ten more waves', () => {
    for (const t of ['easy', 'medium', 'hard', 'expert'] as const) {
      for (const lang of LANGUAGES.map((l) => l.id)) {
        const T = TARGET_WPM[t]
        expect(Math.floor(expectedDeathWave(t, lang, T))).toBe(DEATH_WAVE)
        expect(expectedDeathWave(t, lang, 2 * T)).toBeCloseTo(DEATH_WAVE + DOUBLING_WAVES, -0.5)
        expect(expectedDeathWave(t, lang, 4 * T)).toBeCloseTo(DEATH_WAVE + 2 * DOUBLING_WAVES, -0.5)
      }
    }
  })

  it('doubles the pace every ten waves', () => {
    const d = (w: number) => waveConfig(w, 'medium', 'en').demandWpm
    expect(d(20) / d(10)).toBeCloseTo(2, 5)
    expect(d(30) / d(20)).toBeCloseTo(2, 5)
  })

  it('gives longer words and heavies more time', () => {
    const cfg = waveConfig(3, 'medium', 'en')
    const fixed = () => 0.5
    expect(travelTime(cfg, 10, false, fixed)).toBeGreaterThan(travelTime(cfg, 3, false, fixed))
    expect(travelTime(cfg, 5, true, fixed)).toBeGreaterThan(travelTime(cfg, 5, false, fixed))
  })

  it('takes word length from the language, never the tier', () => {
    for (const lang of LANGUAGES) {
      for (const w of [1, 8, 25]) {
        const lens = TIER_IDS.map((t) => waveConfig(w, t, lang.id)).map((c) => [c.minLen, c.maxLen])
        for (const l of lens) expect(l).toEqual(lens[0])
      }
    }
  })

  it('gives each step up in language longer words', () => {
    const max = (id: LanguageId) => waveConfig(1, 'medium', id).maxLen
    const min = (id: LanguageId) => waveConfig(1, 'medium', id).minLen
    expect(max('en-mid')).toBeGreaterThan(max('en'))
    expect(max('en-adv')).toBeGreaterThan(max('en-mid'))
    expect(min('en-adv')).toBeGreaterThan(min('en-mid'))
    expect(max('th-mid')).toBeGreaterThan(max('th'))
    expect(max('numbers')).toBeLessThanOrEqual(max('en'))
  })

  it('keeps word-length bounds sane in every language', () => {
    for (const lang of LANGUAGES) {
      for (const w of [1, 10, 40]) {
        const c = waveConfig(w, 'medium', lang.id)
        expect(c.minLen).toBeGreaterThanOrEqual(1)
        expect(c.maxLen).toBeGreaterThanOrEqual(c.minLen)
      }
    }
  })
})
