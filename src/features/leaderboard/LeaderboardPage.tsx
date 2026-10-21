import * as Tabs from '@radix-ui/react-tabs'
import { useEffect, useState } from 'react'
import { MODES } from '../../game/modes/registry'
import { LANGUAGES, TIERS, type LanguageId, type Tier } from '../../game/words/languages'
import { Select } from '../../ui'
import { Avatar, SignInButtons } from '../auth/AuthControls'
import { useAuth } from '../auth/authStore'
import { useSettings } from '../settings/settingsStore'
import * as settingsCss from '../settings/settings.css'
import type { LeaderboardEntry } from './api'
import { boardId, PERIODS, type Period } from './periods'
import * as css from './leaderboard.css'

type BoardState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; entries: LeaderboardEntry[]; own: { entry: LeaderboardEntry; rank: number } | null }

function Row({ entry, rank, self }: { entry: LeaderboardEntry; rank: number; self: boolean }) {
  return (
    <li className={css.row} data-self={self}>
      <span className={css.rank} data-top={rank <= 3}>
        {rank}
      </span>
      <Avatar user={{ uid: entry.uid, displayName: entry.name, photoURL: entry.photoURL }} />
      <span className={css.name}>{entry.name}</span>
      <span className={css.score}>{entry.score.toLocaleString()}</span>
      <span className={css.metric}>{entry.wpm.toFixed(0)} wpm</span>
      <span className={`${css.metric} ${css.hideSmall}`}>{(entry.accuracy * 100).toFixed(0)}%</span>
      <span className={`${css.metric} ${css.hideSmall}`}>w{entry.wave}</span>
    </li>
  )
}

function Board({ id, uid }: { id: string; uid: string }) {
  const [state, setState] = useState<BoardState>({ kind: 'loading' })

  useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    import('./api')
      .then(async (api) => {
        const [entries, own] = await Promise.all([api.fetchBoard(id), api.fetchOwnEntry(id, uid)])
        if (alive) setState({ kind: 'ready', entries, own })
      })
      .catch((err) => {
        console.error(err)
        if (alive) setState({ kind: 'error' })
      })
    return () => {
      alive = false
    }
  }, [id, uid])

  if (state.kind === 'loading') return <p className={css.empty}>reading the ledger…</p>
  if (state.kind === 'error') return <p className={css.empty}>The standings could not be loaded. Try again in a moment.</p>
  if (state.entries.length === 0) return <p className={css.empty}>Nobody has signed this page yet. Be the first.</p>

  const ownInList = state.entries.some((e) => e.uid === uid)
  return (
    <ol className={css.list}>
      <li className={css.header} aria-hidden>
        <span>#</span>
        <span />
        <span>typist</span>
        <span style={{ textAlign: 'right' }}>score</span>
        <span style={{ textAlign: 'right' }}>speed</span>
        <span className={css.hideSmall} style={{ textAlign: 'right' }}>
          acc
        </span>
        <span className={css.hideSmall} style={{ textAlign: 'right' }}>
          wave
        </span>
      </li>
      {state.entries.map((e, i) => (
        <Row key={e.uid} entry={e} rank={i + 1} self={e.uid === uid} />
      ))}
      {!ownInList && state.own && <Row entry={state.own.entry} rank={state.own.rank} self />}
    </ol>
  )
}

export default function LeaderboardPage() {
  const user = useAuth((s) => s.user)
  const status = useAuth((s) => s.status)
  const defaults = useSettings()
  const [mode, setMode] = useState(defaults.modeId)
  const [lang, setLang] = useState<LanguageId>(defaults.language)
  const [tier, setTier] = useState<Tier>(defaults.tier)
  const [period, setPeriod] = useState<Period>('week')

  return (
    <div className={settingsCss.page}>
      <h1 className={settingsCss.heading}>standings</h1>
      <p className={settingsCss.sub}>Best run per typist. Days and weeks roll over in UTC.</p>

      {!user ? (
        <div className={css.gate}>
          <p>{status === 'unavailable' ? 'Standings need an account, and accounts are not configured for this build.' : 'Sign in to see the standings and post your runs. You can keep playing as a guest.'}</p>
          {status !== 'unavailable' && <SignInButtons />}
        </div>
      ) : (
        <>
          <div className={css.filters}>
            <span>for</span>
            <Select ariaLabel="mode" value={mode} onChange={setMode} options={MODES.map((m) => ({ value: m.id, label: m.name }))} />
            <span>in</span>
            <Select<LanguageId> ariaLabel="language" value={lang} onChange={setLang} options={LANGUAGES.map((l) => ({ value: l.id, label: l.name.toLowerCase() }))} />
            <span>at</span>
            <Select<Tier> ariaLabel="difficulty" value={tier} onChange={setTier} options={TIERS.map((t) => ({ value: t.id, label: t.name }))} />
          </div>
          <Tabs.Root value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <Tabs.List className={css.tabs} aria-label="period">
              {PERIODS.map((p) => (
                <Tabs.Trigger key={p.id} value={p.id} className={css.tab}>
                  {p.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {PERIODS.map((p) => (
              <Tabs.Content key={p.id} value={p.id}>
                {period === p.id && <Board id={boardId(mode, lang, tier, p.id)} uid={user.uid} />}
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </>
      )}
    </div>
  )
}
