export interface PaletteColors {
  paper: string
  ink: string
  muted: string
  accent: string
  error: string
}

export interface Palette {
  id: string
  name: string
  colors: PaletteColors
}

export const CUSTOM_PALETTE_ID = 'custom'

export const PALETTES: Palette[] = [
  {
    id: 'paper',
    name: 'Paper',
    colors: { paper: '#f3eee3', ink: '#1f1c19', muted: '#968d7f', accent: '#c8452c', error: '#a3195b' },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    colors: { paper: '#ecdfc4', ink: '#3b2a1a', muted: '#9c8565', accent: '#8a3b12', error: '#b0242a' },
  },
  {
    id: 'risograph',
    name: 'Risograph',
    colors: { paper: '#f6efe6', ink: '#2b2a6b', muted: '#9f9bc0', accent: '#ff4f8b', error: '#e8590c' },
  },
  {
    id: 'matcha',
    name: 'Matcha',
    colors: { paper: '#e7ebdc', ink: '#233024', muted: '#8a9782', accent: '#5f8a2e', error: '#b5462f' },
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    colors: { paper: '#1c3a5a', ink: '#e8eef5', muted: '#7d99b6', accent: '#ffd166', error: '#ff7b72' },
  },
  {
    id: 'midnight',
    name: 'Midnight Ink',
    colors: { paper: '#16151a', ink: '#e7e2d6', muted: '#6c6776', accent: '#e3a857', error: '#e5596b' },
  },
  {
    id: 'carbon',
    name: 'Carbon Copy',
    colors: { paper: '#dfe3e6', ink: '#1b2a4a', muted: '#8b95a3', accent: '#2f5bd3', error: '#c23a3a' },
  },
]

export const DEFAULT_CUSTOM: PaletteColors = { ...PALETTES[0].colors }

export function resolvePalette(id: string, custom: PaletteColors): PaletteColors {
  if (id === CUSTOM_PALETTE_ID) return custom
  return (PALETTES.find((p) => p.id === id) ?? PALETTES[0]).colors
}

function luminance(hex: string): number {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex)
  if (!m) return 1
  const [r, g, b] = m.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function isDark(colors: PaletteColors): boolean {
  return luminance(colors.paper) < 0.25
}

export function applyPalette(colors: PaletteColors): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--c-${key}`, value)
  }
  const dark = isDark(colors)
  root.style.colorScheme = dark ? 'dark' : 'light'
  root.dataset.dark = dark ? 'true' : 'false'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.paper)
}

export function readCssColor(name: keyof PaletteColors): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim() || '#000'
}
