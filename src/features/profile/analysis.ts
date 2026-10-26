import type { RunResult } from '../../game/modes/types'
import type { LanguageId, Tier } from '../../game/words/languages'
import { dayKey } from '../streak/streak'

export interface SetBest {
  key: string
  modeId: string
  language: LanguageId
  tier: Tier
  runs: number
  bestScore: number
  bestWpm: number
  bestWave: number
}

export function bestsBySet(runs: RunResult[]): SetBest[] {
  const map = new Map<string, SetBest>()
  for (const r of runs) {
    const key = setKeyOf(r)
    const b = map.get(key) ?? { key, modeId: r.modeId, language: r.language, tier: r.tier, runs: 0, bestScore: 0, bestWpm: 0, bestWave: 0 }
    b.runs++
    b.bestScore = Math.max(b.bestScore, r.score)
    b.bestWpm = Math.max(b.bestWpm, r.wpm)
    b.bestWave = Math.max(b.bestWave, r.wave)
    map.set(key, b)
  }
  return [...map.values()].sort((a, b) => b.bestScore - a.bestScore)
}

export const setKeyOf = (r: Pick<RunResult, 'modeId' | 'language' | 'tier'>) => `${r.modeId}_${r.language}_${r.tier}`

/** The set (mode · language · tier) played most; ties go to the highest score. */
export function mostPlayedKey(bests: SetBest[]): string | null {
  let top: SetBest | null = null
  for (const b of bests) if (!top || b.runs > top.runs) top = b
  return top?.key ?? null
}

/** A round axis top and step for values up to `max`, giving 3–5 gridlines. */
export function niceScale(max: number): { top: number; step: number } {
  const target = Math.max(max, 10)
  const step = [5, 10, 20, 25, 50, 100, 200].find((s) => target / s <= 4) ?? 500
  return { top: Math.ceil(target / step) * step, step }
}

/** Month label above the first week column of each month; the first column drops its label if the next month starts right after. */
export function monthLabels(weeks: string[][], nameOf: (month: number) => string): (string | null)[] {
  const labels = weeks.map((col, i) => {
    const first = col.find(Boolean)
    if (!first) return null
    const month = Number(first.slice(5, 7))
    const prev = i > 0 ? weeks[i - 1].find(Boolean) : undefined
    return !prev || Number(prev.slice(5, 7)) !== month ? nameOf(month) : null
  })
  const next = labels.findIndex((l, i) => i > 0 && l)
  if (labels[0] && next !== -1 && next < 3) labels[0] = null
  return labels
}

export function mean(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
}

/** Average wpm of the latest `n` runs vs the `n` before that. */
export function trend(runs: RunResult[], n = 10): { recent: number; before: number | null } {
  const recent = runs.slice(0, n).map((r) => r.wpm)
  const before = runs.slice(n, n * 2).map((r) => r.wpm)
  return { recent: mean(recent), before: before.length >= 3 ? mean(before) : null }
}

/** Runs per local day. */
export function playsByDay(runs: RunResult[]): Map<string, number> {
  const days = new Map<string, number>()
  for (const r of runs) {
    const k = dayKey(new Date(r.endedAt))
    days.set(k, (days.get(k) ?? 0) + 1)
  }
  return days
}

/** The last `weeks` weeks as columns of 7 local days (Mon..Sun), oldest first. */
export function calendarWeeks(today: Date, weeks: number): string[][] {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const weekday = (end.getDay() + 6) % 7
  const start = new Date(end)
  start.setDate(end.getDate() - weekday - (weeks - 1) * 7)
  const cols: string[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: string[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(start)
      day.setDate(start.getDate() + w * 7 + d)
      col.push(day > end ? '' : dayKey(day))
    }
    cols.push(col)
  }
  return cols
}
