export type ProviderId = 'google' | 'microsoft' | 'facebook'

export interface ProviderInfo {
  id: ProviderId
  label: string
}

/** OAuth sign-in providers, in button order. Add an entry here and a case in `createProvider` to support another. */
export const PROVIDERS: ProviderInfo[] = [
  { id: 'google', label: 'Google' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'facebook', label: 'Facebook' },
]
