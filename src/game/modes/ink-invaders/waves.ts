import type { LanguageId, Tier } from '../../words/languages'

export interface WaveConfig {
  wave: number
  /** Normal enemies in this wave. */
  count: number
  /** Heavy (shielded) enemies, spawned through the back half of the wave. */
  heavies: number
  /** Seconds between spawns (randomized ±25%). */
  spawnEvery: number
  maxActive: number
  /** Seconds for a word to cross the page, before the per-letter allowance. */
  travel: number
  /** Extra seconds of travel per letter, so long words stay fair. */
  perChar: number
  /** Typing speed (wpm) this wave asks for. */
  demandWpm: number
  minLen: number
  maxLen: number
}

/**
 * Who each tier is for, in sustained wpm. Typing-test surveys put the general
 * population around 40 wpm (most people 30–50), trained typists at 60–80, and
 * the top few percent of monkeytype/typeracer players past 100. Words in a game
 * cost more than a test (targeting, reading falling text), so these sit a little
 * under the test numbers for each group.
 */
export const TARGET_WPM: Record<Tier, number> = {
  easy: 25,
  medium: 42,
  hard: 65,
  expert: 90,
}

const BASE_LEN: Record<Tier, [number, number]> = {
  easy: [2, 3],
  medium: [3, 4],
  hard: [7, 8],
  expert: [4, 6],
}

/** Seconds for a wave-1 word to fall the full page. */
const BASE_TRAVEL: Record<Tier, number> = {
  easy: 11,
  medium: 9,
  hard: 7.5,
  expert: 6.5,
}

/** Harder tiers open with a fuller page and armour from the start. */
const EXTRA_WORDS: Record<Tier, number> = { easy: 0, medium: 1, hard: 3, expert: 5 }
const EXTRA_HEAVY: Record<Tier, number> = { easy: 0, medium: 0, hard: 0.6, expert: 1 }

/** Wave 1 asks for this share of the tier's target speed. */
const OPENING_PACE = 0.55
/** How hard the log curve bends: demand reaches the target around wave 10 and keeps climbing slowly. */
const PACE_GROWTH = 0.36
const TRAVEL_GROWTH = 0.42

/**
 * Difficulty curve. Every knob grows with ln(wave): steep early, flattening
 * late, so wave 20 is harder than wave 10 without being a wall of words.
 * Demand is set in wpm and converted back into a spawn interval, so the pace
 * stays tied to real typing speeds instead of hand-tuned numbers.
 */
export function waveConfig(wave: number, tier: Tier, lang: LanguageId): WaveConfig {
  const n = Math.max(1, wave)
  const ln = Math.log(n)
  // Thai words carry more code points (marks) per visual letter.
  const langScale = lang === 'th' ? 1.35 : 1
  const [minBase, maxBase] = BASE_LEN[tier]
  const minLen = Math.round(minBase * langScale)
  const maxLenExact = (maxBase + 1.6 * ln) * langScale
  const maxLen = Math.round(maxLenExact)

  const demandWpm = TARGET_WPM[tier] * OPENING_PACE * (1 + PACE_GROWTH * ln)
  // a typed word is its letters plus the beat spent finding the next target
  const avgChars = (minLen + maxLenExact) / 2 + 1
  const spawnEvery = (avgChars * 12) / demandWpm
  const travel = BASE_TRAVEL[tier] / (1 + TRAVEL_GROWTH * ln)
  const perChar = (12 / TARGET_WPM[tier]) * 1.25

  return {
    wave: n,
    count: Math.round(5 + EXTRA_WORDS[tier] + 5 * ln),
    heavies: Math.max(0, Math.round(1.25 * ln - 0.7 + EXTRA_HEAVY[tier])),
    spawnEvery,
    maxActive: Math.min(12, Math.ceil((travel + perChar * avgChars) / spawnEvery) + 2),
    travel,
    perChar,
    demandWpm,
    minLen,
    maxLen,
  }
}

/** Longer words get proportionally more time to be typed. */
export function travelTime(cfg: WaveConfig, units: number, heavy: boolean, rng: () => number = Math.random): number {
  const t = cfg.travel * (1 + rng() * 0.25) + units * cfg.perChar
  return heavy ? t * 1.5 : t
}
