import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type AuthProvider,
  type User,
} from 'firebase/auth'
import { collection, doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import type { RunResult } from '../../game/modes/types'
import { submitRun, type BoardUser, type SubmitResult } from '../leaderboard/api'
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

  const pending = isGuestData ? local.unsynced : []
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

export function pushSettings(uid: string, settings: Settings): Promise<void> {
  return setDoc(userRef(uid), { settings: pickSettings(settings), updatedAt: serverTimestamp() }, { merge: true })
}
