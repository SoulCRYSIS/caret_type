export type ProviderId = 'google'

export interface ProviderInfo {
  id: ProviderId
  label: string
}

/** Enabled sign-in providers. Add an entry here and a case in `createProvider` to support another. */
export const PROVIDERS: ProviderInfo[] = [{ id: 'google', label: 'Google' }]
