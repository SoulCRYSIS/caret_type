import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button, Popover, Rule } from '../../ui'
import { clearAuthError, resetPassword, signIn, signInWithEmail, signOut, signUpWithEmail, useAuth, type AuthUser } from './authStore'
import { FacebookIcon, GoogleIcon, MailIcon, MicrosoftIcon } from './icons'
import { PROVIDERS, type ProviderId } from './providers'
import * as css from './auth.css'

const PROVIDER_ICONS: Record<ProviderId, typeof GoogleIcon> = { google: GoogleIcon, microsoft: MicrosoftIcon, facebook: FacebookIcon }

export function Avatar({ user }: { user: AuthUser }) {
  const [broken, setBroken] = useState(false)
  if (user.photoURL && !broken) {
    return <img className={css.avatar} src={user.photoURL} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
  }
  const initial = (user.displayName ?? '?').trim().charAt(0).toUpperCase()
  return <span className={css.initials}>{initial}</span>
}

type EmailView = 'signin' | 'signup' | 'reset'

function EmailForm({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<EmailView>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const go = (next: EmailView) => {
    clearAuthError()
    setSent(false)
    setView(next)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    if (view === 'signin') await signInWithEmail(email, password)
    else if (view === 'signup') await signUpWithEmail(name, email, password)
    else setSent(await resetPassword(email))
    setBusy(false)
  }

  const action = { signin: 'sign in', signup: 'create account', reset: 'send reset link' }[view]

  return (
    <form className={css.form} onSubmit={submit}>
      <span className={css.formTitle}>{{ signin: 'sign in with email', signup: 'make an account', reset: 'reset your password' }[view]}</span>
      {view === 'signup' && (
        <label className={css.field}>
          <span className={css.fieldLabel}>name on the standings</span>
          <input className={css.input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" maxLength={40} placeholder="typist" />
        </label>
      )}
      <label className={css.field}>
        <span className={css.fieldLabel}>email</span>
        <input className={css.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
      </label>
      {view !== 'reset' && (
        <label className={css.field}>
          <span className={css.fieldLabel}>password</span>
          <input
            className={css.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
            minLength={view === 'signup' ? 6 : undefined}
            required
          />
        </label>
      )}
      {sent ? (
        <p className={css.note}>Check your inbox for a reset link, then come back to sign in.</p>
      ) : (
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? '…' : action}
        </Button>
      )}
      <div className={css.formLinks}>
        {view === 'signin' ? (
          <>
            <Button variant="link" onClick={() => go('signup')}>
              new here? make an account
            </Button>
            <Button variant="link" onClick={() => go('reset')}>
              forgot password
            </Button>
          </>
        ) : (
          <Button variant="link" onClick={() => go('signin')}>
            {view === 'signup' ? 'have an account? sign in' : 'back to sign in'}
          </Button>
        )}
        <Button
          variant="link"
          onClick={() => {
            clearAuthError()
            onBack()
          }}
        >
          other ways
        </Button>
      </div>
    </form>
  )
}

export function SignInButtons({ note = true, compact = false }: { note?: boolean; compact?: boolean }) {
  const error = useAuth((s) => s.error)
  const status = useAuth((s) => s.status)
  const [busy, setBusy] = useState(false)
  const [withEmail, setWithEmail] = useState(false)

  if (status === 'unavailable') {
    return <p className={css.note}>Accounts are not configured for this build. You can still play as a guest; progress stays on this device.</p>
  }

  return (
    <div className={css.providers}>
      {withEmail ? (
        <EmailForm onBack={() => setWithEmail(false)} />
      ) : (
        <div className={compact ? css.providerGrid : css.providers}>
          {PROVIDERS.map((p) => {
            const Icon = PROVIDER_ICONS[p.id]
            return (
              <Button
                key={p.id}
                variant="stamp"
                className={css.provider}
                disabled={busy || status === 'loading'}
                onClick={async () => {
                  setBusy(true)
                  await signIn(p.id)
                  setBusy(false)
                }}
              >
                <Icon className={css.providerIcon} />
                {compact ? p.label : `continue with ${p.label}`}
              </Button>
            )
          })}
          {!compact && (
            <span className={css.or} aria-hidden>
              or
            </span>
          )}
          <Button
            variant="stamp"
            className={css.provider}
            disabled={status === 'loading'}
            onClick={() => {
              clearAuthError()
              setWithEmail(true)
            }}
          >
            <MailIcon className={css.providerIcon} />
            {compact ? 'email' : 'continue with email'}
          </Button>
        </div>
      )}
      {note && !withEmail && <p className={css.note}>Your guest streak and best runs come with you.</p>}
      {error && (
        <p className={css.error} role="alert">
          {error}
        </p>
      )}
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
