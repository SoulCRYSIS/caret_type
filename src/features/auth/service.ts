import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
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
import { boardId } from '../leaderboard/periods'
import { mergeStats, useProgress, type Stats } from '../progress/progressStore'
import { pickSettings, type Settings } from '../settings/settingsStore'
import { mergeStreak, type StreakState } from '../streak/streak'
import type { ProviderId } from './providers'

export interface RemoteUserDoc {
  displayName: string | null
  photoURL: string | null
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

/** Creates the account and sets its display name before resolving. */
export async function emailSignUp(name: string, email: string, password: string): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: name })
  return user
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
 * (higher streak wins, stats add up) and unsynced guest runs are uploaded.
 * Returns remote settings if the account already had some.
 */
export async function syncOnSignIn(user: User, localSettings: Settings): Promise<Settings | null> {
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

  const pending = local.unsynced
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
  useProgress.getState().clearUnsynced()
  return settings
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
