import * as RDialog from '@radix-ui/react-dialog'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button, Popover, Rule } from '../../ui'
import {
  changeName,
  checkVerified,
  clearAuthError,
  NAME_MAX,
  resendVerification,
  resetPassword,
  signIn,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  useAuth,
  type AuthUser,
} from './authStore'
import { FacebookIcon, GitHubIcon, GoogleIcon, MailIcon, MicrosoftIcon } from './icons'
import { PROVIDERS, type ProviderId } from './providers'
import * as css from './auth.css'

const PROVIDER_ICONS: Record<ProviderId, typeof GoogleIcon> = { google: GoogleIcon, github: GitHubIcon, microsoft: MicrosoftIcon, facebook: FacebookIcon }

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const mismatch = view === 'signup' && confirm.length > 0 && confirm !== password

  const go = (next: EmailView) => {
    clearAuthError()
    setSent(false)
    setConfirm('')
    setView(next)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (view === 'signup' && confirm !== password) return
    setBusy(true)
    if (view === 'signin') await signInWithEmail(email, password)
    else if (view === 'signup') await signUpWithEmail(email, password)
    else setSent(await resetPassword(email))
    setBusy(false)
  }

  const action = { signin: 'sign in', signup: 'create account', reset: 'send reset link' }[view]

  return (
    <form className={css.form} onSubmit={submit}>
      <span className={css.formTitle}>{{ signin: 'sign in with email', signup: 'make an account', reset: 'reset your password' }[view]}</span>
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
      {view === 'signup' && (
        <label className={css.field}>
          <span className={css.fieldLabel}>confirm password</span>
          <input
            className={css.input}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            aria-invalid={mismatch}
            required
          />
          {mismatch && <span className={css.error}>The passwords don't match.</span>}
        </label>
      )}
      {sent ? (
        <p className={css.note}>Check your inbox for a reset link, then come back to sign in.</p>
      ) : (
        <Button type="submit" variant="accent" disabled={busy || mismatch}>
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

function NameForm({ initial, action, onDone, children }: { initial: string; action: string; onDone?: () => void; children?: ReactNode }) {
  const [name, setName] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err = await changeName(name)
    setBusy(false)
    setError(err)
    if (!err) onDone?.()
  }

  return (
    <form className={css.form} onSubmit={submit}>
      <label className={css.field}>
        <span className={css.fieldLabel}>name on the standings</span>
        <input
          className={css.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="nickname"
          maxLength={NAME_MAX}
          placeholder="typist"
          required
          autoFocus
        />
      </label>
      <Button type="submit" variant="accent" disabled={busy}>
        {busy ? '…' : action}
      </Button>
      {error && (
        <p className={css.error} role="alert">
          {error}
        </p>
      )}
      {children}
    </form>
  )
}

/** Shown until a password account clicks the link in its confirmation email. */
export function VerifyNotice() {
  const email = useAuth((s) => s.unverifiedEmail)
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'waiting'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (email === null) return
    const onFocus = () => void checkVerified().catch(() => {})
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [email])

  if (email === null) return null

  const resend = async () => {
    setState('busy')
    const err = await resendVerification()
    setError(err)
    setState(err ? 'idle' : 'sent')
  }

  const check = async () => {
    setState('busy')
    setError(null)
    const ok = await checkVerified().catch(() => false)
    setState(ok ? 'idle' : 'waiting')
  }

  return (
    <div className={css.verify} role="status" data-no-game-keys>
      <span>
        Confirm your email — we sent a link to <b>{email}</b>. Until then your runs stay on this device.
        {state === 'sent' && ' Sent again.'}
        {state === 'waiting' && " Not confirmed yet; check your spam folder."}
      </span>
      <span className={css.verifyActions}>
        <Button variant="link" disabled={state === 'busy'} onClick={check}>
          I've confirmed
        </Button>
        <Button variant="link" disabled={state === 'busy' || state === 'sent'} onClick={resend}>
          resend
        </Button>
      </span>
      {error && <span className={css.error}>{error}</span>}
    </div>
  )
}

/** Asks a brand-new account what to call it; the provider's name is offered as a start. */
export function NamePrompt() {
  const needsName = useAuth((s) => s.needsName)
  const user = useAuth((s) => s.user)
  if (!needsName || !user) return null

  return (
    <RDialog.Root open>
      <RDialog.Portal>
        <RDialog.Overlay className={css.overlay} />
        <RDialog.Content
          className={css.dialog}
          data-no-game-keys
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <RDialog.Title className={css.formTitle}>what should we call you?</RDialog.Title>
          <p className={css.dialogNote}>This is the name other typists see on the standings. You can change it any time from the account menu.</p>
          <NameForm initial={(user.displayName ?? '').slice(0, NAME_MAX)} action="save name" />
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}

export function AccountMenu() {
  const status = useAuth((s) => s.status)
  const user = useAuth((s) => s.user)
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)

  const toggle = (next: boolean) => {
    setOpen(next)
    if (!next) setRenaming(false)
  }

  if (status === 'unavailable') return null

  if (!user) {
  return (
    <Popover
      open={open}
      onOpenChange={toggle}
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
      onOpenChange={toggle}
      trigger={
        <Button variant="link" aria-label="account">
          <Avatar user={user} />
        </Button>
      }
    >
      {renaming ? (
        <div className={css.menuHead}>
          <NameForm initial={user.displayName ?? ''} action="save" onDone={() => setRenaming(false)}>
            <div className={css.formLinks}>
              <Button variant="link" onClick={() => setRenaming(false)}>
                cancel
              </Button>
            </div>
          </NameForm>
        </div>
      ) : (
        <div className={css.menuHead}>
          <span className={css.menuName}>{user.displayName ?? 'typist'}</span>
          <div className={css.formLinks}>
            <Button variant="link" onClick={() => setRenaming(true)}>
              change name
            </Button>
          </div>
        </div>
      )}
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
