import {
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type AuthProvider,
  type User,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import type { RunResult } from '../../game/modes/types'
import { fetchOwnEntry, submitRun, type BoardUser, type SubmitResult } from '../leaderboard/api'
import { MODES } from '../../game/modes/registry'
import { LANGUAGES, TIERS } from '../../game/words/languages'
import { boardId, PERIODS } from '../leaderboard/periods'
import { mergeStats, useProgress, type Stats } from '../progress/progressStore'
import { pickSettings, type Settings } from '../settings/settingsStore'
import { mergeStreak, type StreakState } from '../streak/streak'
import type { ProviderId } from './providers'

export interface RemoteUserDoc {
  displayName: string | null
  photoURL: string | null
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

export async function signInWith(id: ProviderId): Promise<void> {
  const provider = createProvider(id)
  try {
    await signInWithPopup(auth, provider)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-environment') {
      await signInWithRedirect(auth, provider)
      return
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
    throw err
  }
}

export async function emailSignIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function emailSignUp(email: string, password: string): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await sendVerification(user).catch((err) => console.error(err))
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

export function toBoardUser(u: User): BoardUser {
  return { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL }
}

/**
 * Reconcile local progress with the account. Guest progress is merged in
 * (higher streak wins, stats add up) and unsynced guest runs are uploaded,
 * unless the account's email isn't confirmed yet, in which case they wait on this device.
 * Returns remote settings if the account already had some, and whether the player has chosen a name yet.
 */
export async function syncOnSignIn(user: User, localSettings: Settings): Promise<{ settings: Settings | null; named: boolean }> {
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
      photoURL: user.photoURL,
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
    await Promise.all([...best.values()].map((run) => submitRun(toBoardUser(user), run).catch(() => null)))
  }

  useProgress.getState().adopt(user.uid, streak, stats)
  if (verified) useProgress.getState().clearUnsynced()
  return { settings, named: remote?.named === true }
}

/** Renames the account everywhere it shows, including this period's standings. Past days and weeks keep the old name. */
export async function setDisplayName(user: User, name: string): Promise<void> {
  await updateProfile(user, { displayName: name })
  await setDoc(userRef(user.uid), { displayName: name, named: true, updatedAt: serverTimestamp() }, { merge: true })
  const refs = MODES.flatMap((m) =>
    LANGUAGES.flatMap((l) => TIERS.flatMap((t) => PERIODS.map((p) => doc(db, 'leaderboards', boardId(m.id, l.id, t.id, p.id), 'entries', user.uid)))),
  )
  const snaps = await Promise.all(refs.map((ref) => getDoc(ref)))
  const batch = writeBatch(db)
  for (const snap of snaps) if (snap.exists()) batch.update(snap.ref, { name: name.slice(0, 60) })
  await batch.commit()
}

export async function saveRun(user: User, run: RunResult): Promise<SubmitResult> {
  const { streak, stats } = useProgress.getState()
  const batch = writeBatch(db)
  batch.set(doc(collection(userRef(user.uid), 'runs')), { ...run, createdAt: serverTimestamp() })
  batch.set(userRef(user.uid), { streak, stats, updatedAt: serverTimestamp() }, { merge: true })
  await batch.commit()
  return submitRun(toBoardUser(user), run)
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
