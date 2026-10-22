import { create } from 'zustand'
import type { User } from 'firebase/auth'
import { isFirebaseConfigured } from '../../lib/firebaseConfig'
import { useProgress } from '../progress/progressStore'
import { pickSettings, useSettings } from '../settings/settingsStore'
import type { ProviderId } from './providers'

export type AuthStatus = 'loading' | 'guest' | 'user' | 'unavailable'

export interface AuthUser {
  uid: string
  displayName: string | null
  photoURL: string | null
}

interface AuthStore {
  status: AuthStatus
  user: AuthUser | null
  syncing: boolean
  error: string | null
}

export const useAuth = create<AuthStore>(() => ({
  status: isFirebaseConfigured ? 'loading' : 'unavailable',
  user: null,
  syncing: false,
  error: null,
}))

type Service = typeof import('./service')
let servicePromise: Promise<Service> | null = null
let firebaseUser: User | null = null
let signUpPending: Promise<unknown> | null = null

export function loadService(): Promise<Service> {
  servicePromise ??= import('./service')
  return servicePromise
}

let stopSettingsSync: (() => void) | null = null
let applyingRemote = false

function startSettingsSync(uid: string) {
  stopSettingsSync?.()
  let timer: ReturnType<typeof setTimeout> | undefined
  const unsub = useSettings.subscribe((state, prev) => {
    if (applyingRemote) return
    if (JSON.stringify(pickSettings(state)) === JSON.stringify(pickSettings(prev))) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      loadService()
        .then((svc) => svc.pushSettings(uid, useSettings.getState()))
        .catch(() => {})
    }, 1500)
  })
  stopSettingsSync = () => {
    clearTimeout(timer)
    unsub()
  }
}

let started = false

/** Load Firebase after first paint and start listening for auth changes. */
export function initAuth(): void {
  if (started || !isFirebaseConfigured) return
  started = true
  loadService()
    .then((svc) =>
      svc.watchAuth(async (u) => {
        firebaseUser = u
        if (!u) {
          stopSettingsSync?.()
          useAuth.setState({ status: 'guest', user: null, syncing: false })
          return
        }
        // A brand-new email account signs in before its display name is set; wait so the name reaches the standings.
        if (signUpPending) await signUpPending.catch(() => null)
        useAuth.setState({ status: 'user', user: { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL }, syncing: true, error: null })
        try {
          const remote = await svc.syncOnSignIn(u, useSettings.getState())
          if (remote) {
            applyingRemote = true
            useSettings.getState().set(remote)
            applyingRemote = false
          }
          startSettingsSync(u.uid)
          useAuth.setState({ syncing: false })
        } catch (err) {
          console.error(err)
          useAuth.setState({ syncing: false, error: 'Could not sync your progress. It is kept on this device.' })
        }
      }),
    )
    .catch((err) => {
      console.error(err)
      useAuth.setState({ status: 'guest', error: 'Sign-in is unavailable right now.' })
    })
}

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': "That email and password don't match.",
  'auth/wrong-password': "That email and password don't match.",
  'auth/user-not-found': "That email and password don't match.",
  'auth/invalid-email': "That email doesn't look right.",
  'auth/missing-password': 'Enter your password.',
  'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
  'auth/weak-password': 'Use a password of at least 6 characters.',
  'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
  'auth/network-request-failed': 'No connection. Check your network and try again.',
  'auth/operation-not-allowed': "This sign-in method isn't switched on yet. Try another one.",
  'auth/account-exists-with-different-credential': 'That email already signed in another way. Use the method you used first.',
  'auth/user-disabled': 'This account has been disabled.',
}

function authError(err: unknown, fallback: string): string {
  const code = (err as { code?: string } | null)?.code
  return (code && AUTH_ERRORS[code]) || fallback
}

export function clearAuthError(): void {
  useAuth.setState({ error: null })
}

export async function signIn(provider: ProviderId): Promise<boolean> {
  useAuth.setState({ error: null })
  try {
    const svc = await loadService()
    await svc.signInWith(provider)
    return true
  } catch (err) {
    console.error(err)
    useAuth.setState({ error: authError(err, 'Sign-in failed. Please try again.') })
    return false
  }
}

export async function signInWithEmail(email: string, password: string): Promise<boolean> {
  useAuth.setState({ error: null })
  try {
    const svc = await loadService()
    await svc.emailSignIn(email.trim(), password)
    return true
  } catch (err) {
    useAuth.setState({ error: authError(err, 'Sign-in failed. Please try again.') })
    return false
  }
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<boolean> {
  useAuth.setState({ error: null })
  const displayName = name.trim() || email.trim().split('@')[0]
  try {
    const svc = await loadService()
    signUpPending = svc.emailSignUp(displayName, email.trim(), password)
    await signUpPending
    return true
  } catch (err) {
    useAuth.setState({ error: authError(err, "Couldn't create the account. Please try again.") })
    return false
  } finally {
    signUpPending = null
  }
}

export async function resetPassword(email: string): Promise<boolean> {
  useAuth.setState({ error: null })
  try {
    const svc = await loadService()
    await svc.emailReset(email.trim())
    return true
  } catch (err) {
    useAuth.setState({ error: authError(err, "Couldn't send the reset email. Please try again.") })
    return false
  }
}

export async function signOut(): Promise<void> {
  const svc = await loadService()
  await svc.signOutUser()
  useProgress.getState().reset()
}

export function currentFirebaseUser(): User | null {
  return firebaseUser
}
