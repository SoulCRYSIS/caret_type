import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { isUiTarget } from '../../game/engine/input'
import { synth } from '../../game/juice/juice'
import type { AnyGameMode, CardInput, RunResult } from '../../game/modes/types'
import { Button, Kbd } from '../../ui'
import { SignInButtons } from '../auth/AuthControls'
import { useAuth } from '../auth/authStore'
import { useProgress } from '../progress/progressStore'
import { StreakStamp } from '../streak/StreakMark'
import { formatDuration } from './format'
import { claimBoard, type BoardStatus, type Recorded } from './recordRun'
import { CARD_FONTS, canCopyImage, cardColors, cardFileName, copyCard, paintCard, saveCard } from './share'
import * as css from './results.css'

const SITE = typeof window === 'undefined' ? 'caret' : window.location.host

function BoardLine({ status }: { status: BoardStatus | null }) {
  if (!status || status.kind === 'pending') return <p className={css.boardNote}>posting to the standings…</p>
  if (status.kind === 'offline') return <p className={css.boardNote}>saved on this device</p>
  if (status.kind === 'error') return <p className={css.boardNote}>couldn't reach the standings — the run is kept and will be posted next time you sign in</p>
  if (status.kind === 'guest') return null
  const { improved, rankAllTime } = status.result
  const anyBetter = Object.values(improved).some(Boolean)
  return (
    <p className={css.boardNote}>
      {rankAllTime && <span className={css.rank}>#{rankAllTime}</span>}
      <span>{anyBetter ? 'all-time on this board' : 'saved — your best still stands'}</span>
      <Link to="/leaderboard">standings</Link>
    </p>
  )
}

function Claim({ run, qualified, syncing }: { run: RunResult; qualified: boolean; syncing: boolean }) {
  if (syncing) return <p className={css.boardNote}>signing you in and saving this run…</p>
  return (
    <div className={css.claim} data-no-game-keys>
      <span className={css.claimMark} aria-hidden>
        unsaved
      </span>
      <span className={css.claimTitle}>this run isn't saved yet</span>
      <p className={css.claimText}>
        Sign in to post <b>{run.score.toLocaleString()}</b> to the standings, {qualified ? 'count today toward a daily streak' : 'keep a daily streak'}, and
        keep your record on every device.
      </p>
      <SignInButtons note={false} compact />
    </div>
  )
}

type ShareState = 'idle' | 'saved' | 'copied' | 'failed'

function ShareBar({ canvas, input }: { canvas: HTMLCanvasElement | null; input: CardInput<unknown> | null }) {
  const [state, setState] = useState<ShareState>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), 2200)
    return () => clearTimeout(t)
  }, [state])

  const act = (fn: () => Promise<unknown>, done: ShareState) => async (e?: { currentTarget: HTMLElement }) => {
    e?.currentTarget.blur()
    if (!canvas || !input) return
    try {
      const ok = await fn()
      if (ok !== false) setState(done)
    } catch (err) {
      console.error(err)
      setState('failed')
    }
  }
  const save = act(() => saveCard(canvas!, cardFileName(input!)), 'saved')
  const copy = act(() => copyCard(canvas!), 'copied')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isUiTarget(e.target)) return
      if (e.key === 's') void save()
      else if (e.key === 'c' && canCopyImage) void copy()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const note = { idle: '', saved: 'saved to your downloads', copied: 'image copied', failed: "that didn't work — try saving instead" }[state]

  return (
    <div className={css.share}>
      <span className={css.panelLabel}>keep the scroll</span>
      <div className={css.shareButtons}>
        <Button variant="stamp" onClick={save} disabled={!input}>
          save image <Kbd>s</Kbd>
        </Button>
        {canCopyImage && (
          <Button variant="stamp" onClick={copy} disabled={!input}>
            copy image <Kbd>c</Kbd>
          </Button>
        )}
      </div>
      <span className={css.shareNote} role="status">
        {note}
      </span>
    </div>
  )
}

export function ResultSheet({ run, details, mode, recorded }: { run: RunResult; details: unknown; mode: AnyGameMode; recorded: Recorded }) {
  const gamesPlayed = useProgress((s) => s.stats.gamesPlayed)
  const streak = useProgress((s) => s.streak)
  const user = useAuth((s) => s.user)
  const syncing = useAuth((s) => s.syncing)
  const [board, setBoard] = useState<BoardStatus | null>(null)
  const [claimed, setClaimed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [painted, setPainted] = useState<CardInput<unknown> | null>(null)

  useEffect(() => {
    let alive = true
    recorded.board.then((b) => alive && setBoard(b))
    return () => {
      alive = false
    }
  }, [recorded])

  // A guest who signs in from this sheet: the sign-in sync uploads the run, then we report where it landed.
  const waitingForClaim = board?.kind === 'guest' && !!user && !syncing
  useEffect(() => {
    if (!waitingForClaim) return
    let alive = true
    setBoard({ kind: 'pending' })
    setClaimed(true)
    claimBoard(run).then((b) => alive && setBoard(b))
    return () => {
      alive = false
    }
  }, [waitingForClaim, run])

  const streakNew = !!user && recorded.qualified && (claimed || (recorded.streakEvent !== null && recorded.streakEvent !== 'already'))
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    if (recorded.personalBest) timers.push(setTimeout(() => synth.stamp(), 450))
    if (streakNew) {
      timers.push(setTimeout(() => synth.stamp(), 650))
      timers.push(setTimeout(() => synth.chime(4, 587.33), 800))
    }
    return () => timers.forEach(clearTimeout)
  }, [recorded, streakNew])

  const rank = board?.kind === 'done' ? board.result.rankAllTime : null
  const input = useMemo<CardInput<unknown>>(
    () => ({
      run,
      details,
      colors: cardColors(),
      fonts: CARD_FONTS,
      player: user?.displayName ?? null,
      personalBest: recorded.personalBest,
      streak: user && streak.current > 0 ? streak.current : null,
      rank,
      issue: gamesPlayed,
      site: SITE,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, details, user, recorded, streak.current, rank],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let alive = true
    paintCard(canvas, mode, input).then(() => alive && setPainted(input))
    return () => {
      alive = false
    }
  }, [mode, input])

  return (
    <section className={css.report} aria-label="run report">
      <figure className={css.print} data-ready={!!painted}>
        <canvas
          ref={canvasRef}
          className={css.card}
          width={mode.card.width}
          height={mode.card.height}
          role="img"
          aria-label={`${mode.name}: ${run.score} points, ${run.wpm.toFixed(1)} words per minute, wave ${run.wave}`}
        />
      </figure>

      <aside className={css.panel}>
        <div className={css.head}>
          {mode.seal && (
            <span className={css.seal} aria-hidden>
              {mode.seal}
            </span>
          )}
          <span className={css.headText}>
            <span className={css.modeName}>{mode.name}</span>
            <span className={css.issue}>run no. {String(gamesPlayed).padStart(4, '0')}</span>
          </span>
        </div>

        <div className={css.headline}>
          <span className={css.score}>{run.score.toLocaleString()}</span>
          {recorded.personalBest && (
            <span className={css.pb} title="personal best">
              <span className={css.pbSeal} aria-hidden>
                NEW
                <br />
                BEST
              </span>
              personal best
            </span>
          )}
          <span className={css.brushRule} aria-hidden />
          <span className={css.scoreMeta}>
            {run.wpm.toFixed(1)} wpm · {(run.accuracy * 100).toFixed(1)}% · {formatDuration(run.durationMs)}
          </span>
        </div>

        {board?.kind === 'guest' ? <Claim run={run} qualified={recorded.qualified} syncing={!!user && syncing} /> : <BoardLine status={board} />}

        {streakNew && (
          <div className={css.streakSlot}>
            <StreakStamp event={recorded.streakEvent && recorded.streakEvent !== 'already' ? recorded.streakEvent : 'extended'} count={streak.current} />
          </div>
        )}

        <ShareBar canvas={canvasRef.current} input={painted} />

        <div className={css.retry}>
          <span className={css.retryMain}>
            <Kbd>enter</Kbd> again
          </span>
          <span>
            <Kbd>esc</Kbd> menu
          </span>
        </div>
      </aside>
    </section>
  )
}
