import { keyframes, style } from '@vanilla-extract/css'
import { tone, vars } from '../theme/contract.css'

const chrome = style({
  position: 'fixed',
  left: 0,
  right: 0,
  zIndex: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '0 28px',
  transition: 'opacity .35s ease, transform .35s ease',
  selectors: {
    '&[data-hidden="true"]': { opacity: 0, pointerEvents: 'none' },
    '&[data-solid="true"]': { background: vars.color.paper },
  },
})

export const header = style([
  chrome,
  {
    top: 0,
    height: 64,
    selectors: { '&[data-hidden="true"]': { transform: 'translateY(-6px)' } },
  },
])

export const footer = style([
  chrome,
  {
    bottom: 0,
    height: 52,
    fontFamily: vars.font.mono,
    fontSize: 12,
    color: vars.color.muted,
    selectors: { '&[data-hidden="true"]': { transform: 'translateY(6px)' } },
  },
])

const blink = keyframes({ '0%, 49%': { opacity: 1 }, '50%, 100%': { opacity: 0 } })

export const wordmark = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 26,
  fontWeight: 500,
  letterSpacing: '-0.03em',
  textDecoration: 'none',
  color: vars.color.ink,
})

export const wordmarkCaret = style({
  display: 'inline-block',
  width: 2,
  height: 22,
  marginLeft: 3,
  alignSelf: 'center',
  background: vars.color.accent,
  animation: `${blink} 1.05s steps(1) infinite`,
})

export const nav = style({
  display: 'flex',
  alignItems: 'center',
  gap: 22,
})

export const sep = style({
  width: 1,
  height: 14,
  background: tone.rule,
})

export const hints = style({
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  '@media': { 'screen and (max-width: 640px)': { display: 'none' } },
})

export const hint = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
})

export const footRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
})

export const main = style({
  minHeight: '100dvh',
})

export const touchNote = style({
  position: 'fixed',
  left: 16,
  right: 16,
  bottom: 64,
  zIndex: 40,
  padding: '10px 14px',
  fontSize: 14,
  background: vars.color.paper,
  border: `1px dashed ${tone.ruleStrong}`,
  color: vars.color.muted,
  '@media': { '(hover: hover) and (pointer: fine)': { display: 'none' } },
})
