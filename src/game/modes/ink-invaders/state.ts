import type { WordMatcher } from '../../words/graphemes'
import type { WaveConfig } from './waves'

export interface Enemy {
  id: number
  word: string
  matcher: WordMatcher
  /** Leading clusters that form the shield of a heavy enemy. */
  shieldClusters: number
  heavy: boolean
  /** Horizontal slot, 0..1 of usable width. */
  x: number
  /** Progress toward the margin, 0..1. */
  y: number
  /** Progress per second. */
  speed: number
  swayAmp: number
  swayFreq: number
  swayPhase: number
  rot: number
  rotNow: number
  jitter: number
  danger: boolean
  landed: boolean
  /** Elapsed seconds when the player locked onto this word. */
  lockedAt: number
  el: HTMLElement | null
  w: number
  h: number
}

export interface Banner {
  id: number
  text: string
  sub?: string
  tone: 'ink' | 'accent' | 'error'
}

export type Phase = 'intro' | 'wave' | 'intermission' | 'dying' | 'over'

export interface InkedWord {
  word: string
  /** Seconds from first keystroke on the word to the kill. */
  secs: number
  heavy: boolean
  wave: number
}

/** What the result card reports about an Ink Invaders run. */
export interface InkDetails {
  inked: InkedWord[]
  spilled: string[]
  flawlessWaves: number
  wavesCleared: number
}

export interface InkState {
  phase: Phase
  phaseTimer: number
  dyingUntil: number
  time: number
  enemies: Enemy[]
  target: Enemy | null
  nextId: number
  fxId: number

  wave: number
  cfg: WaveConfig
  toSpawn: number
  heaviesLeft: number
  spawnTimer: number
  waveTotal: number
  waveDone: number
  waveStart: number
  waveChars: number
  damagedThisWave: boolean

  lives: number
  maxLives: number
  score: number
  displayScore: number
  combo: number
  maxCombo: number
  correct: number
  errors: number
  kills: number
  wpmByWave: number[]
  inked: InkedWord[]
  spilled: string[]
  flawlessWaves: number
  wavesCleared: number
  startedAt: number
  endedAt: number

  banner: Banner | null
  /** A tier just reached. The view stamps it in the center, then the animation fades it. */
  comboCallout: { id: number; mult: number } | null
  comboBreak: { id: number; value: number } | null
  scoreBump: number
  errorFlash: number
  lifeLost: number

  rootEl: HTMLElement | null
  hudScoreEl: HTMLElement | null
}
