import { createGlobalTheme, createGlobalThemeContract } from '@vanilla-extract/css'
import { FONT_DISPLAY, FONT_MONO } from './fonts'

export const vars = createGlobalThemeContract(
  {
    color: {
      paper: 'paper',
      ink: 'ink',
      muted: 'muted',
      accent: 'accent',
      error: 'error',
    },
    font: {
      display: 'font-display',
      mono: 'font-mono',
    },
  },
  (value) => `c-${value}`,
)

createGlobalTheme(':root', vars, {
  color: {
    paper: '#f3eee3',
    ink: '#1f1c19',
    muted: '#968d7f',
    accent: '#c8452c',
    error: '#a3195b',
  },
  font: {
    display: FONT_DISPLAY,
    mono: FONT_MONO,
  },
})

const mix = (color: string, pct: number, base = vars.color.paper) =>
  `color-mix(in oklab, ${color} ${pct}%, ${base})`

export const tone = {
  rule: mix(vars.color.ink, 16),
  ruleStrong: mix(vars.color.ink, 32),
  wash: mix(vars.color.ink, 5),
  washStrong: mix(vars.color.ink, 10),
  accentWash: mix(vars.color.accent, 14),
  errorWash: mix(vars.color.error, 16),
  shadow: mix(vars.color.ink, 14),
}

export const space = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '40px',
  xxl: '64px',
}

export const ease = {
  out: 'cubic-bezier(.2,.8,.2,1)',
  spring: 'cubic-bezier(.34,1.56,.64,1)',
}
