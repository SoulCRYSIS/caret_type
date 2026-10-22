import type { FC } from 'react'
import type { KeyInput } from '../engine/input'
import type { Juice } from '../juice/juice'
import type { WordPicker } from '../words/picker'
import type { LanguageId, Tier } from '../words/languages'

export interface RunResult {
  modeId: string
  language: LanguageId
  tier: Tier
  score: number
  wpm: number
  accuracy: number
  wave: number
  kills: number
  chars: number
  maxCombo: number
  durationMs: number
  wpmByWave: number[]
  startedAt: number
  endedAt: number
}

export interface ModeContext {
  width: number
  height: number
  language: LanguageId
  tier: Tier
  words: WordPicker
  juice: Juice
  /** Unpaused wall-clock seconds since the run started. */
  elapsed(): number
  /** Ask React to re-render the mode view (structural changes, HUD values). */
  invalidate(): void
}

export interface ModeViewProps<S> {
  state: S
  ctx: ModeContext
  version: number
}

export interface CardColors {
  paper: string
  ink: string
  muted: string
  accent: string
  error: string
}

export interface CardFonts {
  display: string
  mono: string
}

/** Everything a mode needs to print its end-of-run card. */
export interface CardInput<D> {
  run: RunResult
  details: D
  colors: CardColors
  fonts: CardFonts
  player: string | null
  personalBest: boolean
  streak: number | null
  rank: number | null
  issue: number
  site: string
}

/** A mode's shareable end-of-run card, drawn on a canvas so it can be saved as an image. */
export interface ModeCard<D> {
  width: number
  height: number
  draw(g: CanvasRenderingContext2D, input: CardInput<D>): void
}

export interface IntroProps {
  ready: boolean
  error: boolean
}

export interface GameMode<S, D = unknown> {
  id: string
  name: string
  blurb: string
  /** A short word carved into the mode's seal on the result panel. */
  seal?: string
  init(ctx: ModeContext): S
  update(state: S, dt: number, ctx: ModeContext): void
  /** Return true if the key was consumed (e.g. Escape releasing a target). */
  onKey(state: S, key: KeyInput, ctx: ModeContext): boolean | void
  /** Per-frame imperative DOM writes (positions, transforms). */
  draw?(state: S, ctx: ModeContext, realDt: number): void
  render: FC<ModeViewProps<S>>
  /** The mode's own start screen, shown before the first key. */
  Intro?: FC<IntroProps>
  isOver(state: S): boolean
  result(state: S, ctx: ModeContext): RunResult
  /** Mode-specific facts about the run, used only for the result card (never stored). */
  details(state: S, ctx: ModeContext): D
  card: ModeCard<D>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameMode = GameMode<any, any>
