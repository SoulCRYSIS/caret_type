import type { RunResult } from '../../game/modes/types'
import { currentFirebaseUser, loadService, useAuth } from '../auth/authStore'
import type { SubmitResult } from '../leaderboard/api'
import { useProgress, type RecordOutcome } from '../progress/progressStore'

export type BoardStatus =
  | { kind: 'guest' }
  | { kind: 'offline' }
  | { kind: 'pending' }
  | { kind: 'done'; result: SubmitResult }
  | { kind: 'error' }

export interface Recorded extends RecordOutcome {
  board: Promise<BoardStatus>
}

/** Store the run locally, then (if signed in) persist it and post it to the leaderboards. */
export function recordRun(run: RunResult): Recorded {
  const outcome = useProgress.getState().record(run)
  const { status } = useAuth.getState()
  const user = currentFirebaseUser()

  let board: Promise<BoardStatus>
  if (status === 'unavailable') board = Promise.resolve({ kind: 'offline' })
  else if (!user) board = Promise.resolve({ kind: 'guest' })
  else
    board = loadService()
      .then((svc) => svc.saveRun(user, run))
      .then((result): BoardStatus => ({ kind: 'done', result }))
      .catch((err): BoardStatus => {
        console.error(err)
        return { kind: 'error' }
      })

  return { ...outcome, board }
}
