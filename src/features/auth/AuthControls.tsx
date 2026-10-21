import { useState } from 'react'
import { Link } from 'react-router'
import { Button, Popover, Rule } from '../../ui'
import { signIn, signOut, useAuth, type AuthUser } from './authStore'
import { PROVIDERS } from './providers'
import * as css from './auth.css'

export function Avatar({ user }: { user: AuthUser }) {
  const [broken, setBroken] = useState(false)
  if (user.photoURL && !broken) {
    return <img className={css.avatar} src={user.photoURL} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
  }
  const initial = (user.displayName ?? '?').trim().charAt(0).toUpperCase()
  return <span className={css.initials}>{initial}</span>
}

export function SignInButtons({ note = true }: { note?: boolean }) {
  const error = useAuth((s) => s.error)
  const status = useAuth((s) => s.status)
  const [busy, setBusy] = useState(false)

  if (status === 'unavailable') {
    return <p className={css.note}>Accounts are not configured for this build. You can still play as a guest; progress stays on this device.</p>
  }

  return (
    <div className={css.providers}>
      {PROVIDERS.map((p) => (
        <Button
          key={p.id}
          variant="stamp"
          disabled={busy || status === 'loading'}
          onClick={async () => {
            setBusy(true)
            await signIn(p.id)
            setBusy(false)
          }}
        >
          <span className={css.providerGlyph} aria-hidden>
            {p.label[0]}
          </span>
          continue with {p.label}
        </Button>
      ))}
      {note && <p className={css.note}>Your guest streak and best runs come with you.</p>}
      {error && <p className={css.error}>{error}</p>}
    </div>
  )
}

export function AccountMenu() {
  const status = useAuth((s) => s.status)
  const user = useAuth((s) => s.user)
  const [open, setOpen] = useState(false)

  if (status === 'unavailable') return null

  if (!user) {
    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger={
          <Button variant="link" disabled={status === 'loading'}>
            sign in
          </Button>
        }
      >
        <SignInButtons />
      </Popover>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="link" aria-label="account">
          <Avatar user={user} />
        </Button>
      }
    >
      <div className={css.menuHead}>
        <span className={css.menuName}>{user.displayName ?? 'typist'}</span>
      </div>
      <div className={css.menuList}>
        <Link to="/profile" onClick={() => setOpen(false)} className={css.note}>
          your record
        </Link>
        <Link to="/leaderboard" onClick={() => setOpen(false)} className={css.note}>
          standings
        </Link>
      </div>
      <Rule />
      <Button
        variant="quiet"
        onClick={() => {
          setOpen(false)
          void signOut()
        }}
      >
        sign out
      </Button>
    </Popover>
  )
}
