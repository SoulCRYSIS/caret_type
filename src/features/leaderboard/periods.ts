import type { LanguageId, Tier } from '../../game/words/languages'

export type Period = 'day' | 'week' | 'all'

export const PERIODS: { id: Period; label: string }[] = [
  { id: 'day', label: 'today' },
  { id: 'week', label: 'this week' },
  { id: 'all', label: 'all time' },
]

/** ISO-8601 week (UTC) as YYYY-Www. */
export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Boards are bucketed in UTC so every player shares the same "today". */
export function periodKey(period: Period, date: Date = new Date()): string {
  if (period === 'all') return 'all'
  if (period === 'week') return `week-${isoWeek(date)}`
  return `day-${date.toISOString().slice(0, 10)}`
}

export function boardId(mode: string, lang: LanguageId, tier: Tier, period: Period, date: Date = new Date()): string {
  return `${mode}_${lang}_${tier}_${periodKey(period, date)}`
}
