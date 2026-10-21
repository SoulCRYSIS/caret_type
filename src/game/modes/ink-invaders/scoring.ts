export const COMBO_TIERS = [0, 12, 30, 60] as const

/** ×1 … ×4 based on consecutive correct keystrokes. */
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

/** Upper bound used by security rules: every char at ×4 and doubled, plus all flawless wave bonuses. */
export function maxPlausibleScore(chars: number, wave: number): number {
  return chars * 10 * 4 * 2 + 100 * wave * (wave + 1)
}
