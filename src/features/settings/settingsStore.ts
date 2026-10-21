import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_CUSTOM, type PaletteColors } from '../../theme/palettes'
import type { LanguageId, Tier } from '../../game/words/languages'

export interface Settings {
  modeId: string
  language: LanguageId
  tier: Tier
  paletteId: string
  customPalette: PaletteColors
  sound: boolean
  volume: number
  shake: boolean
  particles: boolean
}

export const SYNCED_SETTING_KEYS = [
  'modeId',
  'language',
  'tier',
  'paletteId',
  'customPalette',
  'sound',
  'volume',
  'shake',
  'particles',
] as const satisfies readonly (keyof Settings)[]

export const DEFAULT_SETTINGS: Settings = {
  modeId: 'ink-invaders',
  language: 'en',
  tier: 'medium',
  paletteId: 'paper',
  customPalette: DEFAULT_CUSTOM,
  sound: true,
  volume: 0.6,
  shake: true,
  particles: true,
}

interface SettingsStore extends Settings {
  set: (patch: Partial<Settings>) => void
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (patch) => set(patch),
    }),
    { name: 'caret.settings', version: 1 },
  ),
)

export function pickSettings(s: Settings): Settings {
  const out = {} as Record<string, unknown>
  for (const key of SYNCED_SETTING_KEYS) out[key] = s[key]
  return out as unknown as Settings
}
