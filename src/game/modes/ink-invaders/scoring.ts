import type { Tier } from '../../words/languages'

/** Combo needed for ×1 … ×6; each step roughly doubles the one before. */
export const COMBO_TIERS = [0, 5, 10, 15, 20, 25] as const

/** Combo lost on a mistype; harder tiers punish sloppiness more. A breach still clears it entirely. */
export const MISS_COMBO_PENALTY: Record<Tier, number> = { easy: 5, medium: 10, hard: 20, expert: 30 }

export function comboAfterMiss(combo: number, tier: Tier): number {
  return Math.max(0, combo - MISS_COMBO_PENALTY[tier])
}

/** Progress (0..1) from the current tier toward the next; 1 at the cap. */
export function tierProgress(combo: number): number {
  const m = multiplier(combo)
  if (m >= COMBO_TIERS.length) return 1
  const lo = COMBO_TIERS[m - 1]
  const hi = COMBO_TIERS[m]
  return (combo - lo) / (hi - lo)
}

/** ×1 … ×6 based on the running combo. */
export function multiplier(combo: number): number {
  let m = 1
  for (let i = 1; i < COMBO_TIERS.length; i++) if (combo >= COMBO_TIERS[i]) m = i + 1
  return m
}

export function killScore(units: number, combo: number, heavy: boolean): number {
  return units * 10 * multiplier(combo) * (heavy ? 2 : 1)
}

export function waveBonus(wave: number, flawless: boolean): number {
  return 50 * wave * (flawless ? 2 : 1)
}

export function wpm(correctChars: number, seconds: number): number {
  if (seconds <= 0) return 0
  return Math.round((correctChars / 5 / (seconds / 60)) * 10) / 10
}

export function accuracy(correct: number, errors: number): number {
  const total = correct + errors
  return total === 0 ? 0 : correct / total
}

/** Upper bound used by security rules: every char at the top multiplier and doubled, plus all flawless wave bonuses. */
export function maxPlausibleScore(chars: number, wave: number): number {
  return chars * 10 * COMBO_TIERS.length * 2 + 100 * wave * (wave + 1)
}
