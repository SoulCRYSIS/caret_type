import type { LanguageId, Tier } from '../../words/languages'

export interface WaveConfig {
  wave: number
  /** Normal enemies in this wave. */
  count: number
  /** Heavy (shielded) enemies, spawned mid-wave. */
  heavies: number
  /** Seconds between spawns (randomized ±25%). */
  spawnEvery: number
  maxActive: number
  /** Seconds for a short word to reach the margin. */
  travel: number
  minLen: number
  maxLen: number
}

const BASE_LEN: Record<Tier, [number, number]> = {
  easy: [2, 3],
  medium: [3, 4],
  hard: [7, 8],
  expert: [4, 6],
}

const SPEED: Record<Tier, number> = {
  easy: 1.15,
  medium: 1,
  hard: 1.05,
  expert: 0.95,
}

export const HEAVY_EVERY = 5

/**
 * Difficulty curve. Kept as data so later challenges (bosses, modifiers)
 * can extend it without touching the mode logic.
 */
export function waveConfig(wave: number, tier: Tier, lang: LanguageId): WaveConfig {
  const n = Math.max(1, wave)
  const [minBase, maxBase] = BASE_LEN[tier]
  // Thai words carry more code points (marks) per visual letter.
  const langScale = lang === 'th' ? 1.35 : 1
  return {
    wave: n,
    count: Math.min(32, 5 + (n - 1) * 2),
    heavies: n % HEAVY_EVERY === 0 ? n / HEAVY_EVERY : 0,
    spawnEvery: Math.max(0.45, 2.0 - (n - 1) * 0.13),
    maxActive: Math.min(10, 2 + Math.ceil(n * 0.7)),
    travel: Math.max(3.6, 11.5 - (n - 1) * 0.6) * SPEED[tier],
    minLen: Math.round(minBase * langScale),
    maxLen: Math.round((maxBase + n) * langScale),
  }
}

/** Longer words get proportionally more time to be typed. */
export function travelTime(cfg: WaveConfig, units: number, heavy: boolean, rng: () => number = Math.random): number {
  const t = cfg.travel * (1 + rng() * 0.3) + units * 0.22
  return heavy ? t * 1.7 : t
}
