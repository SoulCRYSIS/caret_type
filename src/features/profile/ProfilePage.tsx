import { getLanguage } from '../../game/words/languages'
import { Rule } from '../../ui'
import { Avatar, SignInButtons } from '../auth/AuthControls'
import { useAuth } from '../auth/authStore'
import { useProgress } from '../progress/progressStore'
import { formatDuration } from '../results/ResultSheet'
import * as settingsCss from '../settings/settings.css'
import { Tally } from '../streak/StreakMark'
import { MAX_FREEZES, viewStreak } from '../streak/streak'
import * as streakCss from '../streak/streak.css'
import { useToday } from '../streak/useToday'
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

export default function ProfilePage() {
  const user = useAuth((s) => s.user)
  const status = useAuth((s) => s.status)
  const syncing = useAuth((s) => s.syncing)
  const authError = useAuth((s) => s.error)
  const { streak, stats, history } = useProgress()
  const today = useToday()
  const view = viewStreak(streak, today)

  return (
    <div className={settingsCss.page}>
      <h1 className={settingsCss.heading}>your record</h1>
      <p className={settingsCss.sub}>
        {user ? (syncing ? 'syncing with your account…' : 'kept with your account') : 'playing as a guest — kept on this device'}
      </p>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>typist</h2>
        {user ? (
          <div className={css.who}>
            <Avatar user={user} />
            <span style={{ fontStyle: 'italic', fontSize: 20 }}>{user.displayName ?? 'typist'}</span>
          </div>
        ) : (
          <div className={settingsCss.stack}>
            {status !== 'unavailable' && <span className={css.caption}>Sign in to post to the standings and keep your streak across devices.</span>}
            <SignInButtons />
          </div>
        )}
        {authError && <p className={css.caption}>{authError}</p>}
      </section>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>streak</h2>
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
      </section>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>totals</h2>
        <div className={settingsCss.stack}>
          <span>
            <b>{stats.gamesPlayed}</b> runs · <b>{stats.totalKills}</b> words inked · <b>{formatDuration(stats.timePlayedMs)}</b> at the keys
          </span>
          <span>
            best score <b>{stats.bestScore.toLocaleString()}</b> · best speed <b>{stats.bestWpm.toFixed(1)}</b> wpm
          </span>
        </div>
      </section>

      <section className={settingsCss.section}>
        <h2 className={settingsCss.sectionTitle}>recent runs</h2>
        {history.length === 0 ? (
          <span className={css.caption}>No runs yet. Press any key on the play page.</span>
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
              {history.slice(0, 15).map((r) => (
                <tr key={r.endedAt}>
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
