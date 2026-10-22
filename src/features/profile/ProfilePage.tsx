import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMode } from '../../game/modes/registry'
import type { RunResult } from '../../game/modes/types'
import { getLanguage } from '../../game/words/languages'
import { Rule } from '../../ui'
import { Avatar, SignInButtons } from '../auth/AuthControls'
import { loadService, useAuth } from '../auth/authStore'
import { useProgress } from '../progress/progressStore'
import { formatDuration } from '../results/format'
import * as settingsCss from '../settings/settings.css'
import { Tally } from '../streak/StreakMark'
import { MAX_FREEZES, viewStreak } from '../streak/streak'
import * as streakCss from '../streak/streak.css'
import { useToday } from '../streak/useToday'
import { bestsBySet, calendarWeeks, mean, playsByDay, trend } from './analysis'
import * as css from './profile.css'

function StreakTally({ count }: { count: number }) {
  const groups = Math.floor(count / 5)
  const rest = count % 5
  const shownGroups = Math.min(groups, 12)
  return (
    <div className={streakCss.bigTally} aria-hidden>
      {Array.from({ length: shownGroups }, (_, i) => (
        <Tally key={i} count={5} />
      ))}
      {rest > 0 && <Tally count={rest} />}
      {groups > shownGroups && <span className={css.caption}>+{(groups - shownGroups) * 5}</span>}
    </div>
  )
}

/** Account runs from Firestore when signed in (plus anything still queued), local history otherwise. */
function useRuns(): { runs: RunResult[]; loading: boolean } {
  const user = useAuth((s) => s.user)
  const syncing = useAuth((s) => s.syncing)
  const history = useProgress((s) => s.history)
  const unsynced = useProgress((s) => s.unsynced)
  const played = useProgress((s) => s.stats.gamesPlayed)
  const [remote, setRemote] = useState<{ uid: string; runs: RunResult[] } | null>(null)

  useEffect(() => {
    if (!user || syncing) return
    let alive = true
    loadService()
      .then((svc) => svc.fetchRuns(user.uid))
      .then((runs) => alive && setRemote({ uid: user.uid, runs }))
      .catch((err) => {
        console.error(err)
        if (alive) setRemote({ uid: user.uid, runs: [] })
      })
    return () => {
      alive = false
    }
  }, [user, syncing, played])

  return useMemo(() => {
    if (!user) return { runs: history, loading: false }
    if (!remote || remote.uid !== user.uid) return { runs: history, loading: true }
    const seen = new Set(remote.runs.map((r) => r.startedAt))
    const extra = [...unsynced, ...history].filter((r) => !seen.has(r.startedAt) && (seen.add(r.startedAt), true))
    const runs = remote.runs.length ? [...remote.runs, ...extra].sort((a, b) => b.endedAt - a.endedAt) : history
    return { runs, loading: false }
  }, [user, remote, history, unsynced])
}

function Figure({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className={css.figure}>
      <span className={css.figureValue}>
        {value} {children}
      </span>
      <span className={css.figureLabel}>{label}</span>
    </div>
  )
}

function FormChart({ runs }: { runs: RunResult[] }) {
  const series = runs.slice(0, 40).reverse()
  if (series.length < 2) return <span className={css.caption}>Play a few more runs to see your form.</span>
  const w = 600
  const h = 120
  const values = series.map((r) => r.wpm)
  const max = Math.max(20, ...values) * 1.1
  const step = w / (series.length - 1)
  const y = (v: number) => h - (v / max) * h
  const avg = mean(values)
  const best = values.indexOf(Math.max(...values))
  return (
    <svg className={css.chart} viewBox={`0 -10 ${w} ${h + 30}`} preserveAspectRatio="none" aria-label="words per minute over recent runs">
      <line className={css.chartAvg} x1={0} x2={w} y1={y(avg)} y2={y(avg)} />
      <polyline className={css.chartLine} points={values.map((v, i) => `${i * step},${y(v)}`).join(' ')} />
      {values.map((v, i) => (
        <circle key={i} className={i === best ? css.chartBest : css.chartDot} cx={i * step} cy={y(v)} r={i === best ? 4 : 2.2} />
      ))}
      <text className={css.chartLabel} x={0} y={h + 22}>
        {series.length} runs ago
      </text>
      <text className={css.chartLabel} x={w} y={h + 22} textAnchor="end">
        latest · avg {avg.toFixed(1)} wpm
      </text>
    </svg>
  )
}

function Calendar({ runs, today }: { runs: RunResult[]; today: string }) {
  const days = useMemo(() => playsByDay(runs), [runs])
  const weeks = useMemo(() => calendarWeeks(new Date(`${today}T12:00:00`), 20), [today])
  return (
    <div className={css.calendar} aria-label="days played, last 20 weeks">
      {weeks.map((col, i) => (
        <div key={i} className={css.calCol}>
          {col.map((day, j) => {
            const n = day ? (days.get(day) ?? 0) : 0
            return (
              <span
                key={j}
                className={css.calDay}
                data-empty={!day}
                data-today={day === today}
                data-level={n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : 3}
                title={day ? `${day}: ${n} ${n === 1 ? 'run' : 'runs'}` : undefined}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const user = useAuth((s) => s.user)
  const status = useAuth((s) => s.status)
  const syncing = useAuth((s) => s.syncing)
  const authError = useAuth((s) => s.error)
  const { streak, stats } = useProgress()
  const today = useToday()
  const view = viewStreak(streak, today)
  const { runs, loading } = useRuns()
  const bests = useMemo(() => bestsBySet(runs), [runs])
  const form = useMemo(() => trend(runs), [runs])
  const avgAcc = useMemo(() => mean(runs.slice(0, 20).map((r) => r.accuracy)), [runs])
  const signedIn = !!user

  return (
    <div className={settingsCss.page}>
      <h1 className={settingsCss.heading}>your record</h1>
      <p className={settingsCss.sub}>
        {user ? (syncing ? 'syncing with your account…' : loading ? 'fetching your runs…' : 'kept with your account') : 'playing as a guest — kept on this device only'}
      </p>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>typist</h2>
        {user ? (
          <div className={css.who}>
            <Avatar user={user} />
            <span style={{ fontStyle: 'italic', fontSize: 20 }}>{user.displayName ?? 'typist'}</span>
          </div>
        ) : (
          <div className={css.gate}>
            {status !== 'unavailable' && (
              <span>Sign in to save your runs, post to the standings and keep a daily streak. Runs you play now come with you.</span>
            )}
            <SignInButtons note={false} />
          </div>
        )}
        {authError && <p className={css.caption}>{authError}</p>}
      </section>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>streak</h2>
        {signedIn ? (
          <div className={settingsCss.stack}>
            <div className={css.streakRow}>
              <span className={css.bigNum}>{view.count}</span>
              <span className={css.caption}>
                {view.count === 1 ? 'day' : 'days'}
                {view.status === 'at-risk' && ' — play today to keep it'}
                {view.status === 'frozen' && ' — held by a freeze'}
                {view.status === 'done-today' && ' — kept today'}
              </span>
            </div>
            {view.count > 0 && <StreakTally count={view.count} />}
            <span className={css.caption}>
              longest: {streak.longest} {streak.longest === 1 ? 'day' : 'days'}
            </span>
            <span className={streakCss.freezeChip}>
              {streak.freezes}/{MAX_FREEZES} freezes saved · earn one every 7 days
            </span>
          </div>
        ) : (
          <span className={css.caption}>Streaks need an account. Sign in and today's runs count as day one.</span>
        )}
      </section>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>at a glance</h2>
        <div className={css.figures}>
          <Figure label="runs" value={stats.gamesPlayed.toLocaleString()} />
          <Figure label="words inked" value={stats.totalKills.toLocaleString()} />
          <Figure label="at the keys" value={formatDuration(stats.timePlayedMs)} />
          <Figure label="best score" value={stats.bestScore.toLocaleString()} />
          <Figure label="best speed" value={`${stats.bestWpm.toFixed(1)}`} />
          <Figure label="recent speed" value={form.recent ? form.recent.toFixed(1) : '—'}>
            {form.before !== null && form.recent > 0 && (
              <span className={form.recent >= form.before ? css.up : css.down}>
                {form.recent >= form.before ? '▲' : '▼'} {Math.abs(form.recent - form.before).toFixed(1)}
              </span>
            )}
          </Figure>
          <Figure label="recent accuracy" value={avgAcc ? `${(avgAcc * 100).toFixed(1)}%` : '—'} />
        </div>
      </section>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>form</h2>
        <div className={settingsCss.stack}>
          <FormChart runs={runs} />
          <Calendar runs={runs} today={today} />
        </div>
      </section>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>personal bests</h2>
        {bests.length === 0 ? (
          <span className={css.caption}>No runs yet. Press any key on the play page.</span>
        ) : (
          <table className={css.runs}>
            <thead>
              <tr>
                <th className={css.th}>set</th>
                <th className={css.th}>score</th>
                <th className={css.th}>wpm</th>
                <th className={css.th}>wave</th>
                <th className={css.th}>runs</th>
              </tr>
            </thead>
            <tbody>
              {bests.map((b) => (
                <tr key={b.key}>
                  <td className={css.td}>
                    {getMode(b.modeId).name} · {getLanguage(b.language).name.toLowerCase()} · {b.tier}
                  </td>
                  <td className={css.tdScore}>{b.bestScore.toLocaleString()}</td>
                  <td className={css.td}>{b.bestWpm.toFixed(1)}</td>
                  <td className={css.td}>{b.bestWave}</td>
                  <td className={css.td}>{b.runs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>recent runs</h2>
        {runs.length === 0 ? (
          <span className={css.caption}>No runs yet.</span>
        ) : (
          <table className={css.runs}>
            <thead>
              <tr>
                <th className={css.th}>score</th>
                <th className={css.th}>wpm</th>
                <th className={css.th}>acc</th>
                <th className={css.th}>wave</th>
                <th className={css.th}>set</th>
                <th className={css.th}>when</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 15).map((r) => (
                <tr key={r.startedAt}>
                  <td className={css.tdScore}>{r.score.toLocaleString()}</td>
                  <td className={css.td}>{r.wpm.toFixed(1)}</td>
                  <td className={css.td}>{(r.accuracy * 100).toFixed(0)}%</td>
                  <td className={css.td}>{r.wave}</td>
                  <td className={css.td}>
                    {getLanguage(r.language).id} · {r.tier}
                  </td>
                  <td className={css.td}>{new Date(r.endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <Rule />
    </div>
  )
}
