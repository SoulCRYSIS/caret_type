import { getLanguage, type LanguageId, type Tier } from '../../words/languages'

export interface WaveConfig {
  wave: number
  /** Normal enemies in this wave. */
  count: number
  /** Heavy (shielded) enemies, mixed through the wave. */
  heavies: number
  /** Seconds between spawns (randomized ±25%). */
  spawnEvery: number
  maxActive: number
  /** Seconds for a word to cross the page, before the per-letter allowance. */
  travel: number
  /** Extra seconds of travel per letter, so long words stay fair. */
  perChar: number
  /** Share of the page each correct key knocks the word being typed back up. */
  pushBack: number
  /** Typing speed (wpm) this wave asks for. */
  demandWpm: number
  /** Words a player keeping pace has on the page at once. */
  onScreen: number
  minLen: number
  maxLen: number
}

export const MAX_LIVES = 5

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

/** A player typing at the tier's target speed should run out of ink during this wave. */
export const DEATH_WAVE = 10
/** After that, the speed asked for doubles every this many waves. */
export const DOUBLING_WAVES = 10

/** Words on the page at once for a player keeping pace; harder tiers are busier. */
const ON_SCREEN: Record<Tier, number> = { easy: 4.5, medium: 5, hard: 5.5, expert: 6 }

/** Harder tiers open with a fuller page and armour from the start. */
const EXTRA_WORDS: Record<Tier, number> = { easy: 0, medium: 1, hard: 3, expert: 5 }
const EXTRA_HEAVY: Record<Tier, number> = { easy: 0, medium: 0, hard: 0.6, expert: 1 }

/** Same on every wave so late waves don't lose their breathing room; only the tier sets it. */
const PUSH_BACK: Record<Tier, number> = { easy: 0.0065, medium: 0.0045, hard: 0.0035, expert: 0.0028 }

/**
 * Demand grows exponentially: ×2 every DOUBLING_WAVES. `crossover` is the wave
 * where it equals the tier's target; it sits a little before DEATH_WAVE because
 * the lives give a few waves of slack once a player falls behind.
 */
function buildConfig(wave: number, tier: Tier, lang: LanguageId, crossover: number): WaveConfig {
  const n = Math.max(1, wave)
  const ln = Math.log(n)
  // Word length belongs to the language ("English" vs "English advanced"), never the tier.
  const language = getLanguage(lang)
  const [minLen, maxBase] = language.len
  // Thai words carry more code points (marks) per visual letter, so they stretch a little faster.
  const growth = language.script === 'thai' ? 1.6 * 1.35 : 1.6
  // log growth with a soft start, so words never lengthen faster than the pace rises
  const maxLenExact = maxBase + growth * Math.log(1 + (n - 1) / 3)
  const maxLen = Math.round(maxLenExact)

  const demandWpm = TARGET_WPM[tier] * 2 ** ((n - crossover) / DOUBLING_WAVES)
  // a typed word is its letters plus the beat spent finding the next target
  const avgChars = (minLen + maxLenExact) / 2 + 1
  const spawnEvery = (avgChars * 12) / demandWpm
  // A word's fall = onScreen spawn intervals. One of those is the per-letter allowance
  // (time to type it at the demanded speed); the rest is the base travel. Words drop
  // faster exactly as fast as the pace rises, and the page holds a steady crowd.
  const onScreen = ON_SCREEN[tier]
  const perChar = 12 / demandWpm
  const travel = (onScreen - 1) * spawnEvery

  return {
    wave: n,
    count: Math.round(5 + EXTRA_WORDS[tier] + 5 * ln),
    heavies: Math.max(0, Math.round(1.25 * ln - 0.7 + EXTRA_HEAVY[tier])),
    spawnEvery,
    maxActive: Math.min(12, Math.ceil(onScreen) + 2),
    travel,
    perChar,
    pushBack: PUSH_BACK[tier],
    demandWpm,
    onScreen,
    minLen,
    maxLen,
  }
}

/**
 * Expected wave a player of `playerWpm` runs out of lives in, as a continuous
 * number (10.4 = 40% into wave 10). Model: once a wave asks for more than the
 * player can type, the shortfall share of its words reach the margin; normal
 * words cost one life, heavies two.
 */
function deathWave(config: (wave: number) => WaveConfig, playerWpm: number): number {
  let lives = MAX_LIVES
  for (let n = 1; n <= 200; n++) {
    const cfg = config(n)
    const missed = Math.max(0, 1 - playerWpm / cfg.demandWpm)
    const lost = missed * (cfg.count + 2 * cfg.heavies)
    if (lost >= lives) return n + lives / lost
    lives -= lost
  }
  return Infinity
}

const crossovers = new Map<string, number>()

/** The crossover that makes a target-speed player die midway through DEATH_WAVE. */
function crossoverFor(tier: Tier, lang: LanguageId): number {
  const key = `${tier}:${lang}`
  const cached = crossovers.get(key)
  if (cached !== undefined) return cached
  let lo = 1 - DOUBLING_WAVES
  let hi = DEATH_WAVE + 1
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const dies = deathWave((n) => buildConfig(n, tier, lang, mid), TARGET_WPM[tier])
    if (dies < DEATH_WAVE + 0.5) lo = mid
    else hi = mid
  }
  const crossover = (lo + hi) / 2
  crossovers.set(key, crossover)
  return crossover
}

/** Difficulty curve for one wave. Kept as data so later challenges can extend it. */
export function waveConfig(wave: number, tier: Tier, lang: LanguageId): WaveConfig {
  return buildConfig(wave, tier, lang, crossoverFor(tier, lang))
}

/** Expected wave a player of the given speed runs out of lives in (continuous). */
export function expectedDeathWave(tier: Tier, lang: LanguageId, playerWpm: number): number {
  return deathWave((n) => waveConfig(n, tier, lang), playerWpm)
}

/** Longer words get proportionally more time to be typed. */
export function travelTime(cfg: WaveConfig, units: number, heavy: boolean, rng: () => number = Math.random): number {
  const t = cfg.travel * (1 + rng() * 0.25) + units * cfg.perChar
  return heavy ? t * 1.5 : t
}
