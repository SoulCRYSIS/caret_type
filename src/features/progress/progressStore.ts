import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RunResult } from '../../game/modes/types'
import { dayKey, EMPTY_STREAK, qualifies, registerPlay, type StreakEvent, type StreakState } from '../streak/streak'

export interface Stats {
  gamesPlayed: number
  totalChars: number
  totalKills: number
  bestScore: number
  bestWpm: number
  timePlayedMs: number
}

export const EMPTY_STATS: Stats = { gamesPlayed: 0, totalChars: 0, totalKills: 0, bestScore: 0, bestWpm: 0, timePlayedMs: 0 }

const HISTORY = 50

export function addRunToStats(stats: Stats, run: RunResult): Stats {
  return {
    gamesPlayed: stats.gamesPlayed + 1,
    totalChars: stats.totalChars + run.chars,
    totalKills: stats.totalKills + run.kills,
    bestScore: Math.max(stats.bestScore, run.score),
    bestWpm: Math.max(stats.bestWpm, run.wpm),
    timePlayedMs: stats.timePlayedMs + run.durationMs,
  }
}

export function mergeStats(a: Stats, b: Stats): Stats {
  return {
    gamesPlayed: a.gamesPlayed + b.gamesPlayed,
    totalChars: a.totalChars + b.totalChars,
    totalKills: a.totalKills + b.totalKills,
    bestScore: Math.max(a.bestScore, b.bestScore),
    bestWpm: Math.max(a.bestWpm, b.bestWpm),
    timePlayedMs: a.timePlayedMs + b.timePlayedMs,
  }
}

export interface RecordOutcome {
  streakEvent: StreakEvent | null
  streak: StreakState
  qualified: boolean
  personalBest: boolean
}

interface ProgressStore {
  /** uid whose data this is; null for a guest. */
  ownerUid: string | null
  streak: StreakState
  stats: Stats
  history: RunResult[]
  /** Guest runs not yet uploaded to an account. */
  unsynced: RunResult[]
  record: (run: RunResult) => RecordOutcome
  adopt: (uid: string, streak: StreakState, stats: Stats) => void
  clearUnsynced: () => void
  reset: () => void
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ownerUid: null,
      streak: EMPTY_STREAK,
      stats: EMPTY_STATS,
      history: [],
      unsynced: [],

      record(run) {
        const st = get()
        const qualified = qualifies(run)
        let streak = st.streak
        let streakEvent: StreakEvent | null = null
        if (qualified) {
          const r = registerPlay(st.streak, dayKey(new Date(run.endedAt)))
          streak = r.state
          streakEvent = r.event
        }
        const personalBest = run.score > st.stats.bestScore && st.stats.gamesPlayed > 0
        set({
          streak,
          stats: addRunToStats(st.stats, run),
          history: [run, ...st.history].slice(0, HISTORY),
          unsynced: st.ownerUid ? st.unsynced : [...st.unsynced, run].slice(-HISTORY),
        })
        return { streakEvent, streak, qualified, personalBest }
      },

      adopt(uid, streak, stats) {
        set({ ownerUid: uid, streak, stats })
      },

      clearUnsynced() {
        set({ unsynced: [] })
      },

      reset() {
        set({ ownerUid: null, streak: EMPTY_STREAK, stats: EMPTY_STATS, history: [], unsynced: [] })
      },
    }),
    { name: 'caret.progress', version: 1 },
  ),
)
