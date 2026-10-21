import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { RunResult } from '../../game/modes/types'
import type { LanguageId, Tier } from '../../game/words/languages'
import { boardId, PERIODS, type Period } from './periods'

export interface BoardUser {
  uid: string
  displayName: string | null
  photoURL: string | null
}

export interface LeaderboardEntry {
  uid: string
  name: string
  photoURL: string | null
  score: number
  wpm: number
  accuracy: number
  wave: number
  chars: number
  durationMs: number
  mode: string
  lang: LanguageId
  tier: Tier
  createdAt: Timestamp | null
}

export interface SubmitResult {
  improved: Partial<Record<Period, boolean>>
  rankAllTime: number | null
}

const entriesOf = (board: string) => collection(db, 'leaderboards', board, 'entries')

function entryFor(user: BoardUser, run: RunResult) {
  return {
    uid: user.uid,
    name: (user.displayName || 'anonymous typist').slice(0, 60),
    photoURL: user.photoURL ?? null,
    score: Math.round(run.score),
    wpm: Math.round(run.wpm * 10) / 10,
    accuracy: run.accuracy,
    wave: run.wave,
    chars: run.chars,
    durationMs: run.durationMs,
    mode: run.modeId,
    lang: run.language,
    tier: run.tier,
    createdAt: serverTimestamp(),
  }
}

/** Write the run to the day, week and all-time boards if it beats the user's best there. */
export async function submitRun(user: BoardUser, run: RunResult): Promise<SubmitResult> {
  const when = new Date(run.endedAt)
  const improved: SubmitResult['improved'] = {}
  await Promise.all(
    PERIODS.map(async ({ id: period }) => {
      const ref = doc(entriesOf(boardId(run.modeId, run.language, run.tier, period, when)), user.uid)
      improved[period] = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref)
        if (snap.exists() && (snap.data().score as number) >= run.score) return false
        tx.set(ref, entryFor(user, run))
        return true
      })
    }),
  )
  const allTime = boardId(run.modeId, run.language, run.tier, 'all')
  const best = await getDoc(doc(entriesOf(allTime), user.uid))
  const rankAllTime = best.exists() ? await rankOf(allTime, best.data().score as number) : null
  return { improved, rankAllTime }
}

export async function fetchBoard(board: string, max = 50): Promise<LeaderboardEntry[]> {
  const snap = await getDocs(query(entriesOf(board), orderBy('score', 'desc'), limit(max)))
  return snap.docs.map((d) => d.data() as LeaderboardEntry)
}

export async function fetchOwnEntry(board: string, uid: string): Promise<{ entry: LeaderboardEntry; rank: number } | null> {
  const snap = await getDoc(doc(entriesOf(board), uid))
  if (!snap.exists()) return null
  const entry = snap.data() as LeaderboardEntry
  return { entry, rank: await rankOf(board, entry.score) }
}

async function rankOf(board: string, score: number): Promise<number> {
  const agg = await getCountFromServer(query(entriesOf(board), where('score', '>', score)))
  return agg.data().count + 1
}
