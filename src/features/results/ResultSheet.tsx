import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { RunResult } from '../../game/modes/types'
import { synth } from '../../game/juice/juice'
import { getLanguage } from '../../game/words/languages'
import { Kbd, Popover, Button } from '../../ui'
import { SignInButtons } from '../auth/AuthControls'
import { useProgress } from '../progress/progressStore'
import { StreakStamp } from '../streak/StreakMark'
import type { BoardStatus, Recorded } from './recordRun'
import * as css from './results.css'

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <li className={css.line}>
      <span>{label}</span>
      <span className={css.leader} aria-hidden />
      <span className={css.value}>{value}</span>
    </li>
  )
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const w = 480
  const h = 52
  const max = Math.max(...values, 10)
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => [i * step, h - (v / max) * h] as const)
  const best = values.indexOf(Math.max(...values))
  return (
    <svg className={css.chart} viewBox={`0 -8 ${w} ${h + 20}`} preserveAspectRatio="none" aria-label="words per minute by wave">
      <polyline className={css.chartLine} points={pts.map(([x, y]) => `${x},${y}`).join(' ')} />
      <circle className={css.chartDot} cx={pts[best][0]} cy={pts[best][1]} r={3.5} />
      <text className={css.chartLabel} x={0} y={h + 12}>
        wave 1
      </text>
      <text className={css.chartLabel} x={w} y={h + 12} textAnchor="end">
        wave {values.length}
      </text>
    </svg>
  )
}

function BoardLine({ status }: { status: BoardStatus | null }) {
  if (!status || status.kind === 'pending') return <span className={css.boardNote}>posting to the standings…</span>
  if (status.kind === 'offline') return <span className={css.boardNote}>saved on this device</span>
  if (status.kind === 'error') return <span className={css.boardNote}>couldn't reach the standings — run saved locally</span>
  if (status.kind === 'guest') {
    return (
      <span className={css.boardNote}>
        sign in to post this to the standings
        <Popover side="top" align="start" trigger={<Button variant="link">sign in</Button>}>
          <SignInButtons />
        </Popover>
      </span>
    )
  }
  const { improved, rankAllTime } = status.result
  const anyBetter = Object.values(improved).some(Boolean)
  return (
    <span className={css.boardNote}>
      {rankAllTime && <span className={css.rank}>#{rankAllTime}</span>}
      {anyBetter ? 'all-time on this board' : 'your best still stands'}
      <Link to="/leaderboard">see standings</Link>
    </span>
  )
}

export function ResultSheet({ run, recorded }: { run: RunResult; recorded: Recorded }) {
  const gamesPlayed = useProgress((s) => s.stats.gamesPlayed)
  const [board, setBoard] = useState<BoardStatus | null>(null)

  useEffect(() => {
    let alive = true
    recorded.board.then((b) => alive && setBoard(b))
    return () => {
      alive = false
    }
  }, [recorded])

  const streakNew = recorded.streakEvent !== null && recorded.streakEvent !== 'already'
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    if (recorded.personalBest) timers.push(setTimeout(() => synth.stamp(), 250))
    if (streakNew) {
      timers.push(setTimeout(() => synth.stamp(), 470))
      timers.push(setTimeout(() => synth.chime(4, 587.33), 620))
    }
    return () => timers.forEach(clearTimeout)
  }, [recorded, streakNew])

  const lang = getLanguage(run.language)

  return (
    <section className={css.sheet} aria-label="run report">
      <div className={css.head}>
        <span>run report · no. {String(gamesPlayed).padStart(4, '0')}</span>
        <span>
          {lang.name.toLowerCase()} · {run.tier}
        </span>
      </div>

      <div className={css.scoreRow}>
        <div>
          <span className={css.scoreLabel}>score</span>
          <span className={css.score}>{run.score.toLocaleString()}</span>
        </div>
        <div className={css.stamps}>{recorded.personalBest && <span className={css.pb}>personal best</span>}</div>
      </div>

      <ul className={css.ledger}>
        <Line label="words per minute" value={run.wpm.toFixed(1)} />
        <Line label="accuracy" value={`${(run.accuracy * 100).toFixed(1)}%`} />
        <Line label="reached wave" value={String(run.wave)} />
        <Line label="longest combo" value={String(run.maxCombo)} />
        <Line label="words inked" value={String(run.kills)} />
        <Line label="time" value={formatDuration(run.durationMs)} />
      </ul>

      <Sparkline values={run.wpmByWave} />

      {streakNew && recorded.streakEvent && (
        <div className={css.streakSlot}>
          <StreakStamp event={recorded.streakEvent} count={recorded.streak.current} />
        </div>
      )}

      <div className={css.footer}>
        <BoardLine status={board} />
        <span className={css.retry}>
          <span className={css.retryMain}>
            <Kbd>tab</Kbd> again
          </span>
          <span>
            <Kbd>esc</Kbd> menu
          </span>
        </span>
      </div>
    </section>
  )
}
