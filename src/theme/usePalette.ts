import { useEffect } from 'react'
import { useSettings } from '../features/settings/settingsStore'
import { applyPalette, resolvePalette } from './palettes'

export function applyStoredPalette(): void {
  const { paletteId, customPalette } = useSettings.getState()
  applyPalette(resolvePalette(paletteId, customPalette))
}

export function usePaletteSync(): void {
  const paletteId = useSettings((s) => s.paletteId)
  const custom = useSettings((s) => s.customPalette)
  useEffect(() => {
    applyPalette(resolvePalette(paletteId, custom))
  }, [paletteId, custom])
}
