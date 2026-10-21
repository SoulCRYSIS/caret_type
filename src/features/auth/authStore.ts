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

export async function signIn(provider: ProviderId): Promise<void> {
  useAuth.setState({ error: null })
  try {
    const svc = await loadService()
    await svc.signInWith(provider)
  } catch (err) {
    console.error(err)
    useAuth.setState({ error: 'Sign-in failed. Please try again.' })
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
