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

export interface GameMode<S> {
  id: string
  name: string
  blurb: string
  init(ctx: ModeContext): S
  update(state: S, dt: number, ctx: ModeContext): void
  /** Return true if the key was consumed (e.g. Escape releasing a target). */
  onKey(state: S, key: KeyInput, ctx: ModeContext): boolean | void
  /** Per-frame imperative DOM writes (positions, transforms). */
  draw?(state: S, ctx: ModeContext, realDt: number): void
  render: FC<ModeViewProps<S>>
  isOver(state: S): boolean
  result(state: S, ctx: ModeContext): RunResult
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameMode = GameMode<any>
