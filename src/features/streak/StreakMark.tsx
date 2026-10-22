import { Tip } from '../../ui'
import { useAuth } from '../auth/authStore'
import { useProgress } from '../progress/progressStore'
import { viewStreak, type StreakEvent } from './streak'
import * as css from './streak.css'
import { useToday } from './useToday'

/** Tally marks: four uprights and a diagonal strike per group of five. */
export function Tally({ count, max = 5, className }: { count: number; max?: number; className?: string }) {
  const n = Math.min(count, max)
  const groups = Math.ceil(n / 5)
  const width = groups * 30
  return (
    <svg className={[css.tally, className].filter(Boolean).join(' ')} width={Math.max(width, 6)} height="16" viewBox={`0 0 ${Math.max(width, 6)} 16`} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const g = Math.floor(i / 5)
        const k = i % 5
        const ox = g * 30
        if (k === 4) return <line key={i} className={css.stroke} x1={ox - 2} y1={12} x2={ox + 22} y2={4} />
        const wobble = ((i * 7) % 3) - 1
        return <line key={i} className={css.stroke} x1={ox + 2 + k * 5} y1={2 + wobble * 0.4} x2={ox + 2 + k * 5 + wobble * 0.6} y2={14} />
      })}
    </svg>
  )
}

const STATUS_TEXT = {
  'done-today': 'streak kept today',
  'at-risk': 'play a run today to keep your streak',
  frozen: 'a freeze is covering yesterday — play to keep it',
  broken: 'streak lost — start a new one',
  none: 'finish a run (60s or wave 3) to start a streak',
} as const

export function StreakMark() {
  const streak = useProgress((s) => s.streak)
  const authStatus = useAuth((s) => s.status)
  const today = useToday()
  const { count, status } = viewStreak(streak, today)
  if (authStatus === 'guest') {
    return (
      <Tip content="sign in to keep a daily streak — today's runs will count">
        <span className={css.mark} data-status="none" tabIndex={0} aria-label="streak needs an account">
          <Tally count={0} />
          <span className={css.note}>streak</span>
        </span>
      </Tip>
    )
  }
  if (authStatus === 'loading') return null
  return (
    <Tip content={STATUS_TEXT[status]}>
      <span className={css.mark} data-status={status} tabIndex={0} aria-label={`${count} day streak. ${STATUS_TEXT[status]}`}>
        <Tally count={count === 0 ? 0 : ((count - 1) % 5) + 1} />
        <span className={css.count}>{count}</span>
        {status === 'frozen' && <span className={css.note}>frozen</span>}
      </span>
    </Tip>
  )
}

const EVENT_TEXT: Partial<Record<StreakEvent, string>> = {
  started: 'streak started',
  extended: 'streak extended',
  'saved-by-freeze': 'saved by a freeze',
  reset: 'new streak',
}

/** Stamp shown on the result sheet after the first qualifying run of the day. */
export function StreakStamp({ event, count }: { event: StreakEvent; count: number }) {
  const text = EVENT_TEXT[event]
  if (!text) return null
  return (
    <div className={css.extended} role="status">
      <span className={css.extendedFrame} aria-hidden />
      <span className={css.extendedBig}>day {count}</span>
      <span className={css.extendedSmall}>{text}</span>
    </div>
  )
}
