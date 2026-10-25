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
  /** A new account that hasn't picked the name it shows on the standings. */
  needsName: boolean
  /** Email of a password account whose address isn't confirmed yet; its runs stay on this device until it is. */
  unverifiedEmail: string | null
}

export const useAuth = create<AuthStore>(() => ({
  status: isFirebaseConfigured ? 'loading' : 'unavailable',
  user: null,
  syncing: false,
  error: null,
  needsName: false,
  unverifiedEmail: null,
}))

export const NAME_MAX = 40

type Service = typeof import('./service')
let servicePromise: Promise<Service> | null = null
let firebaseUser: User | null = null

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
          useAuth.setState({ status: 'guest', user: null, syncing: false, needsName: false, unverifiedEmail: null })
          return
        }
        useAuth.setState({
          status: 'user',
          user: { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL },
          unverifiedEmail: svc.isVerified(u) ? null : u.email,
          syncing: true,
          error: null,
        })
        await sync(svc, u)
      }),
    )
    .catch((err) => {
      console.error(err)
      useAuth.setState({ status: 'guest', error: 'Sign-in is unavailable right now.' })
    })
}

async function sync(svc: Service, u: User) {
  useAuth.setState({ syncing: true })
  try {
    const { settings, named } = await svc.syncOnSignIn(u, useSettings.getState())
    if (settings) {
      applyingRemote = true
      useSettings.getState().set(settings)
      applyingRemote = false
    }
    startSettingsSync(u.uid)
    useAuth.setState({ syncing: false, needsName: !named })
  } catch (err) {
    console.error(err)
    useAuth.setState({ syncing: false, error: 'Could not sync your progress. It is kept on this device.' })
  }
}

/** Re-reads the account; once the email link has been clicked, posts the runs that were held back. */
export async function checkVerified(): Promise<boolean> {
  const u = firebaseUser
  if (!u || useAuth.getState().unverifiedEmail === null) return true
  const svc = await loadService()
  if (!(await svc.refreshVerified(u))) return false
  useAuth.setState({ unverifiedEmail: null })
  await sync(svc, u)
  return true
}

export async function resendVerification(): Promise<string | null> {
  const u = firebaseUser
  if (!u) return 'Sign in first.'
  try {
    const svc = await loadService()
    await svc.sendVerification(u)
    return null
  } catch (err) {
    return authError(err, "Couldn't send the email. Please try again.")
  }
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

export async function signUpWithEmail(email: string, password: string): Promise<boolean> {
  useAuth.setState({ error: null })
  try {
    const svc = await loadService()
    await svc.emailSignUp(email.trim(), password)
    return true
  } catch (err) {
    useAuth.setState({ error: authError(err, "Couldn't create the account. Please try again.") })
    return false
  }
}

/** Returns an error message, or null once the new name is saved. */
export async function changeName(raw: string): Promise<string | null> {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (!name) return 'Pick a name to show on the standings.'
  if (name.length > NAME_MAX) return `Keep it under ${NAME_MAX} characters.`
  const u = firebaseUser
  const user = useAuth.getState().user
  if (!u || !user) return 'Sign in first.'
  try {
    const svc = await loadService()
    await svc.setDisplayName(u, name)
    useAuth.setState({ user: { ...user, displayName: name }, needsName: false })
    return null
  } catch (err) {
    console.error(err)
    return authError(err, "Couldn't save your name. Please try again.")
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
  useAuth.setState({ needsName: false })
}

export function currentFirebaseUser(): User | null {
  return firebaseUser
}
