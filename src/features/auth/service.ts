import {
  EmailAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getRedirectResult,
  linkWithCredential,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type AuthCredential,
  type AuthProvider,
  type User,
} from 'firebase/auth'
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { firebaseConfig } from '../../lib/firebaseConfig'
import type { RunResult } from '../../game/modes/types'
import { fetchOwnEntry, submitRun, type BoardUser, type SubmitResult } from '../leaderboard/api'
import { MODES } from '../../game/modes/registry'
import { LANGUAGES, TIERS } from '../../game/words/languages'
import { CUSTOM_AVATAR } from './avatars'
import { DATA_PREFIX } from './resizeAvatar'
import { boardId, PERIODS } from '../leaderboard/periods'
import { mergeStats, useProgress, type Stats } from '../progress/progressStore'
import { pickSettings, type Settings } from '../settings/settingsStore'
import { mergeStreak, type StreakState } from '../streak/streak'
import type { ProviderId } from './providers'

export interface RemoteUserDoc {
  displayName: string | null
  avatar?: string | null
  /** Set once the player has picked their own name. */
  named?: boolean
  settings?: Settings
  streak?: StreakState
  stats?: Stats
}

function createProvider(id: ProviderId): AuthProvider {
  switch (id) {
    case 'google': {
      const p = new GoogleAuthProvider()
      p.setCustomParameters({ prompt: 'select_account' })
      return p
    }
    case 'github': {
      const p = new GithubAuthProvider()
      p.addScope('read:user')
      return p
    }
    case 'microsoft': {
      const p = new OAuthProvider('microsoft.com')
      p.setCustomParameters({ prompt: 'select_account' })
      return p
    }
    case 'facebook': {
      const p = new FacebookAuthProvider()
      p.addScope('email')
      return p
    }
  }
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  getRedirectResult(auth).catch(() => {})
  return onAuthStateChanged(auth, cb)
}

/** A sign-in that matched an existing email, held until that account signs in so the two can be joined. */
let pendingLink: { email: string; credential: AuthCredential } | null = null

const METHOD_TO_PROVIDER: Record<string, ProviderId> = {
  'google.com': 'google',
  'github.com': 'github',
  'microsoft.com': 'microsoft',
  'facebook.com': 'facebook',
}

class LinkError extends Error {
  code: 'caret/link-needs-password' | 'caret/link-needs-sign-in'
  email: string
  constructor(code: 'caret/link-needs-password' | 'caret/link-needs-sign-in', email: string) {
    super(code)
    this.code = code
    this.email = email
  }
}

function authCode(err: unknown): string | undefined {
  return (err as { code?: string } | null)?.code
}

function isCancelled(err: unknown): boolean {
  const code = authCode(err)
  return code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
}

/** The credential Firebase refused to sign in with, because this email already belongs to an account. */
function pendingCredential(err: unknown): AuthCredential | null {
  return OAuthProvider.credentialFromError(err as never) ?? GoogleAuthProvider.credentialFromError(err as never) ?? GithubAuthProvider.credentialFromError(err as never) ?? FacebookAuthProvider.credentialFromError(err as never)
}

/** Join a held sign-in onto the account that just signed in, when it is the same email. */
async function finishPendingLink(): Promise<void> {
  const pending = pendingLink
  const user = auth.currentUser
  if (!pending || !user) return
  pendingLink = null
  if (user.email?.toLowerCase() !== pending.email.toLowerCase()) return
  try {
    await linkWithCredential(user, pending.credential)
  } catch (err) {
    const code = authCode(err)
    // Already joined, or the credential belongs to this account already. The sign-in itself succeeded.
    if (code === 'auth/provider-already-linked' || code === 'auth/credential-already-in-use') return
    console.error(err)
  }
}

/**
 * The email is already an account. Sign in with the method it already has, then attach the new one,
 * so both ways open the same account from then on.
 */
async function linkExistingAccount(err: unknown): Promise<void> {
  const email = (err as { customData?: { email?: string } }).customData?.email
  const credential = pendingCredential(err)
  if (!email || !credential) throw err

  const methods = await fetchSignInMethodsForEmail(auth, email).catch(() => [] as string[])
  const oauth = methods.map((m) => METHOD_TO_PROVIDER[m]).find((id): id is ProviderId => !!id)
  if (oauth) {
    try {
      await signInWithPopup(auth, createProvider(oauth))
    } catch (next) {
      if (isCancelled(next)) return
      throw next
    }
    const user = auth.currentUser
    if (!user || user.email?.toLowerCase() !== email.toLowerCase()) {
      if (user) await signOut(auth)
      throw new LinkError('caret/link-needs-sign-in', email)
    }
    await linkWithCredential(user, credential).catch((linkErr) => {
      const code = authCode(linkErr)
      if (code !== 'auth/provider-already-linked' && code !== 'auth/credential-already-in-use') throw linkErr
    })
    return
  }

  pendingLink = { email, credential }
  throw new LinkError(methods.includes('password') ? 'caret/link-needs-password' : 'caret/link-needs-sign-in', email)
}

/** Attach a password to the signed-in account. Enumeration protection blocks the client call, so the token endpoint is the fallback. */
async function linkPassword(user: User, email: string, password: string): Promise<void> {
  let clientError: unknown
  try {
    await linkWithCredential(user, EmailAuthProvider.credential(email, password))
    return
  } catch (err) {
    const code = authCode(err)
    if (code === 'auth/provider-already-linked' || code === 'auth/email-already-in-use') return
    clientError = err
  }
  const idToken = await user.getIdToken()
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, email, password, returnSecureToken: true }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    const message = body?.error?.message ?? ''
    if (message.includes('EMAIL_EXISTS') || message.includes('FEDERATED_USER_ID_ALREADY_LINKED')) return
    throw clientError
  }
  await reload(user)
}

/** True once an account is signed in. False when the popup was closed, with no error. */
export async function signInWith(id: ProviderId): Promise<boolean> {
  const provider = createProvider(id)
  try {
    await signInWithPopup(auth, provider)
    await finishPendingLink()
    return true
  } catch (err) {
    const code = authCode(err)
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-environment') {
      await signInWithRedirect(auth, provider)
      return true
    }
    if (isCancelled(err)) return false
    if (code === 'auth/account-exists-with-different-credential') {
      await linkExistingAccount(err)
      return auth.currentUser !== null
    }
    throw err
  }
}

export async function emailSignIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)
  await finishPendingLink()
}

/** True once the account exists and is signed in. False when the connecting popup was closed. */
export async function emailSignUp(email: string, password: string): Promise<boolean> {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await sendVerification(user).catch((err) => console.error(err))
    return true
  } catch (err) {
    if (authCode(err) !== 'auth/email-already-in-use') throw err
    // The address already belongs to a social sign-in. Open that, then attach this password to it.
    const methods = await fetchSignInMethodsForEmail(auth, email).catch(() => [] as string[])
    const oauth = methods.map((m) => METHOD_TO_PROVIDER[m]).find((id): id is ProviderId => !!id)
    if (!oauth || methods.includes('password')) throw err
    try {
      await signInWithPopup(auth, createProvider(oauth))
    } catch (next) {
      if (isCancelled(next)) return false
      throw next
    }
    const user = auth.currentUser
    if (!user || user.email?.toLowerCase() !== email.toLowerCase()) {
      if (user) await signOut(auth)
      throw err
    }
    await linkPassword(user, email, password)
    return true
  }
}

/** Password accounts must confirm their address; OAuth providers vouch for theirs. */
export function isVerified(user: User): boolean {
  return user.emailVerified || !user.providerData.some((p) => p.providerId === 'password')
}

export async function sendVerification(user: User): Promise<void> {
  try {
    await sendEmailVerification(user, { url: window.location.origin })
  } catch (err) {
    // The return link only works on authorised domains; without it the email still verifies.
    if ((err as { code?: string }).code !== 'auth/unauthorized-continue-uri') throw err
    await sendEmailVerification(user)
  }
}

/** Reloads the account and, once verified, refreshes the token so the security rules see it. */
export async function refreshVerified(user: User): Promise<boolean> {
  await reload(user)
  if (!isVerified(user)) return false
  await user.getIdToken(true)
  return true
}

export function emailReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email)
}

export function signOutUser(): Promise<void> {
  return signOut(auth)
}

const userRef = (uid: string) => doc(db, 'users', uid)

export function toBoardUser(u: User, avatar: string | null): BoardUser {
  return { uid: u.uid, displayName: u.displayName, avatar }
}

/**
 * Reconcile local progress with the account. Guest progress is merged in
 * (higher streak wins, stats add up) and unsynced guest runs are uploaded,
 * unless the account's email isn't confirmed yet, in which case they wait on this device.
 * Returns remote settings if the account already had some, and whether the player has chosen a name yet.
 */
export async function syncOnSignIn(user: User, localSettings: Settings): Promise<{ settings: Settings | null; named: boolean; avatar: string | null; customAvatar: string | null }> {
  const progress = useProgress.getState()
  if (progress.ownerUid && progress.ownerUid !== user.uid) progress.reset()
  const local = useProgress.getState()
  const isGuestData = local.ownerUid === null

  const snap = await getDoc(userRef(user.uid))
  const remote = snap.exists() ? (snap.data() as RemoteUserDoc) : null

  const streak = mergeStreak(local.streak, remote?.streak)
  const stats = remote?.stats ? (isGuestData ? mergeStats(remote.stats, local.stats) : remote.stats) : local.stats
  const settings = remote?.settings ?? null

  await setDoc(
    userRef(user.uid),
    {
      displayName: user.displayName,
      streak,
      stats,
      ...(settings ? {} : { settings: pickSettings(localSettings) }),
      ...(remote ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  const verified = isVerified(user)
  const pending = verified ? local.unsynced : []
  if (pending.length > 0) {
    const batch = writeBatch(db)
    for (const run of pending) batch.set(doc(collection(userRef(user.uid), 'runs')), { ...run, createdAt: serverTimestamp() })
    await batch.commit()
    const best = new Map<string, RunResult>()
    for (const run of pending) {
      const key = `${run.modeId}_${run.language}_${run.tier}`
      if ((best.get(key)?.score ?? -1) < run.score) best.set(key, run)
    }
    await Promise.all([...best.values()].map((run) => submitRun(toBoardUser(user, remote?.avatar ?? null), run).catch(() => null)))
  }

  useProgress.getState().adopt(user.uid, streak, stats)
  if (verified) useProgress.getState().clearUnsynced()
  const customAvatar = remote?.avatar === CUSTOM_AVATAR ? await fetchOwnAvatar(user.uid) : null
  return { settings, named: remote?.named === true, avatar: remote?.avatar ?? null, customAvatar }
}

const avatarRef = (uid: string) => doc(db, 'avatars', uid)

async function fetchOwnAvatar(uid: string): Promise<string | null> {
  const snap = await getDoc(avatarRef(uid))
  const png = snap.exists() ? snap.data().png : null
  return typeof png === 'string' ? DATA_PREFIX + png : null
}

/**
 * Updates name and face everywhere they show, including this period's standings. Past days and weeks keep the old ones.
 * `uploadedPng` is the player's own picture (a data URL) when `avatar` is the custom id.
 */
export async function setProfile(user: User, name: string, avatar: string | null, uploadedPng: string | null): Promise<void> {
  await updateProfile(user, { displayName: name })
  if (avatar === CUSTOM_AVATAR && uploadedPng) {
    await setDoc(avatarRef(user.uid), { png: uploadedPng.slice(DATA_PREFIX.length), updatedAt: serverTimestamp() })
  } else if (avatar && avatar !== CUSTOM_AVATAR) {
    // moving to a built-in face: drop the old upload
    await deleteDoc(avatarRef(user.uid)).catch(() => {})
  }
  await setDoc(userRef(user.uid), { displayName: name, ...(avatar ? { avatar } : {}), named: true, updatedAt: serverTimestamp() }, { merge: true })
  const refs = MODES.flatMap((m) =>
    LANGUAGES.flatMap((l) => TIERS.flatMap((t) => PERIODS.map((p) => doc(db, 'leaderboards', boardId(m.id, l.id, t.id, p.id), 'entries', user.uid)))),
  )
  const snaps = await Promise.all(refs.map((ref) => getDoc(ref)))
  const batch = writeBatch(db)
  for (const snap of snaps) if (snap.exists()) batch.update(snap.ref, { name: name.slice(0, 60), ...(avatar ? { avatar } : {}) })
  await batch.commit()
}

export async function saveRun(user: User, avatar: string | null, run: RunResult): Promise<SubmitResult> {
  const { streak, stats } = useProgress.getState()
  const batch = writeBatch(db)
  batch.set(doc(collection(userRef(user.uid), 'runs')), { ...run, createdAt: serverTimestamp() })
  batch.set(userRef(user.uid), { streak, stats, updatedAt: serverTimestamp() }, { merge: true })
  await batch.commit()
  return submitRun(toBoardUser(user, avatar), run)
}

/** Where a run that was posted during sign-in ended up on its all-time board. */
export async function standingFor(user: User, run: RunResult): Promise<SubmitResult> {
  const own = await fetchOwnEntry(boardId(run.modeId, run.language, run.tier, 'all'), user.uid)
  return { improved: { all: own?.entry.score === run.score }, rankAllTime: own?.rank ?? null }
}

export async function fetchRuns(uid: string, max = 200): Promise<RunResult[]> {
  const snap = await getDocs(query(collection(userRef(uid), 'runs'), orderBy('endedAt', 'desc'), limit(max)))
  return snap.docs.map((d) => {
    const { createdAt: _createdAt, ...run } = d.data()
    return run as RunResult
  })
}

export function pushSettings(uid: string, settings: Settings): Promise<void> {
  return setDoc(userRef(uid), { settings: pickSettings(settings), updatedAt: serverTimestamp() }, { merge: true })
}
