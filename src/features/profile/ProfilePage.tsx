import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMode } from '../../game/modes/registry'
import type { RunResult } from '../../game/modes/types'
import { getLanguage } from '../../game/words/languages'
import { Rule, Select } from '../../ui'
import { Avatar, SignInButtons } from '../auth/AuthControls'
import { loadService, useAuth } from '../auth/authStore'
import { useProgress } from '../progress/progressStore'
import { formatDuration } from '../results/format'
import * as settingsCss from '../settings/settings.css'
import { Tally } from '../streak/StreakMark'
import { MAX_FREEZES, viewStreak } from '../streak/streak'
import * as streakCss from '../streak/streak.css'
import { useToday } from '../streak/useToday'
import { bestsBySet, calendarWeeks, mean, monthLabels, mostPlayedKey, niceScale, playsByDay, setKeyOf, trend } from './analysis'
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
    const seen = new Set<number>()
    const fresh = (r: RunResult) => !seen.has(r.startedAt) && (seen.add(r.startedAt), true)
    const runs = remote.runs.length ? [...remote.runs, ...unsynced, ...history].filter(fresh).sort((a, b) => b.endedAt - a.endedAt) : history
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

const dateLabel = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** Words per minute for each run in one set, oldest to newest. */
function SpeedChart({ runs }: { runs: RunResult[] }) {
  const series = runs.slice(0, 40).reverse()
  if (series.length < 2) return <span className={css.caption}>Play this set twice or more and your speed over time shows up here.</span>
  const W = 640
  const H = 190
  const pad = { l: 36, r: 12, t: 12, b: 26 }
  const values = series.map((r) => r.wpm)
  const { top, step } = niceScale(Math.max(...values))
  const x = (i: number) => pad.l + (i / (series.length - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / top) * (H - pad.t - pad.b)
  const avg = mean(values)
  const best = values.indexOf(Math.max(...values))
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step)
  const bestAnchor = best > series.length * 0.8 ? 'end' : best < series.length * 0.2 ? 'start' : 'middle'
  return (
    <svg className={css.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`words per minute across your last ${series.length} runs, average ${avg.toFixed(0)}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line className={t === 0 ? css.chartAxis : css.chartGrid} x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
          <text className={css.chartLabel} x={pad.l - 6} y={y(t) + 3.5} textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      <line className={css.chartAvg} x1={pad.l} x2={W - pad.r} y1={y(avg)} y2={y(avg)} />
      <text className={css.chartAvgLabel} x={W - pad.r} y={y(avg) - 5} textAnchor="end">
        average {avg.toFixed(1)}
      </text>
      <polyline className={css.chartLine} points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      {series.map((r, i) => (
        <circle key={r.startedAt} className={i === best ? css.chartBest : css.chartDot} cx={x(i)} cy={y(r.wpm)} r={i === best ? 5 : 3}>
          <title>{`${dateLabel(r.endedAt)} · ${r.wpm.toFixed(1)} wpm · score ${r.score.toLocaleString()}`}</title>
        </circle>
      ))}
      <text className={css.chartBestLabel} x={x(best)} y={y(values[best]) - 10} textAnchor={bestAnchor}>
        best {values[best].toFixed(1)}
      </text>
      <text className={css.chartLabel} x={pad.l} y={H - 6}>
        {dateLabel(series[0].endedAt)}
      </text>
      <text className={css.chartLabel} x={W - pad.r} y={H - 6} textAnchor="end">
        {dateLabel(series[series.length - 1].endedAt)}
      </text>
    </svg>
  )
}

const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleDateString(undefined, { month: 'short' })

function Calendar({ runs, today }: { runs: RunResult[]; today: string }) {
  const days = useMemo(() => playsByDay(runs), [runs])
  const weeks = useMemo(() => calendarWeeks(new Date(`${today}T12:00:00`), 20), [today])
  const months = useMemo(() => monthLabels(weeks, monthName), [weeks])
  const active = weeks.flat().filter((d) => d && days.has(d)).length
  return (
    <div className={settingsCss.stack}>
      <div className={css.calendarWrap}>
        <div className={css.calCol} aria-hidden>
          <span className={css.calHead} />
          {WEEKDAYS.map((d, i) => (
            <span key={i} className={css.calWeekday}>
              {d}
            </span>
          ))}
        </div>
        <div className={css.calendar} role="img" aria-label={`days played over the last 20 weeks: ${active} days`}>
          {weeks.map((col, i) => (
            <div key={i} className={css.calCol}>
              <span className={css.calHead}>{months[i]}</span>
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
      </div>
      <div className={css.legend}>
        <span className={css.legendWord}>less</span>
        {[0, 1, 2, 3].map((l) => (
          <span key={l} className={css.calDay} data-level={l} />
        ))}
        <span className={css.legendWord}>more</span>
      </div>
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
  const [picked, setPicked] = useState<string | null>(null)
  const chartKey = picked && bests.some((b) => b.key === picked) ? picked : mostPlayedKey(bests)
  const chartRuns = useMemo(() => runs.filter((r) => setKeyOf(r) === chartKey), [runs, chartKey])
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
        <h2 className={settingsCss.sectionTitle}>speed over time</h2>
        <div className={settingsCss.stack}>
          {bests.length > 1 && (
            <div className={css.chartPick}>
              <span>showing</span>
              <Select
                ariaLabel="set to chart"
                value={chartKey ?? ''}
                onChange={setPicked}
                options={bests.map((b) => ({ value: b.key, label: `${getMode(b.modeId).name} · ${getLanguage(b.language).name.toLowerCase()} · ${b.tier}`, hint: `${b.runs} ${b.runs === 1 ? 'run' : 'runs'}` }))}
              />
            </div>
          )}
          <SpeedChart runs={chartRuns} />
          <span className={css.caption}>Each dot is one run, oldest to newest, in words per minute. The dashed line is your average and the filled dot your best.</span>
        </div>
      </section>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>days played</h2>
        <div className={settingsCss.stack}>
          <Calendar runs={runs} today={today} />
          <span className={css.caption}>One square per day for the last 20 weeks; darker means more runs. Today is outlined.</span>
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
