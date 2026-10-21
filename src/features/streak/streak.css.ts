import { keyframes, style } from '@vanilla-extract/css'
import { ease, tone, vars } from '../../theme/contract.css'

export const mark = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: vars.font.mono,
  fontSize: 13,
  color: vars.color.ink,
  selectors: {
    '&[data-status="at-risk"], &[data-status="frozen"]': { color: vars.color.muted },
    '&[data-status="none"], &[data-status="broken"]': { color: vars.color.muted },
  },
})

export const tally = style({
  height: 16,
  overflow: 'visible',
})

export const stroke = style({
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  selectors: {
    '[data-status="done-today"] &:last-of-type': { stroke: vars.color.accent },
  },
})

export const count = style({
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 600,
})

export const note = style({
  fontSize: 10,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.muted,
})

const slam = keyframes({
  '0%': { opacity: 0, transform: 'scale(2.4) rotate(-14deg)' },
  '45%': { opacity: 1, transform: 'scale(.92) rotate(-6deg)' },
  '70%': { transform: 'scale(1.04) rotate(-7deg)' },
  '100%': { opacity: 1, transform: 'scale(1) rotate(-7deg)' },
})

export const extended = style({
  position: 'relative',
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 16px 9px',
  color: vars.color.accent,
  animation: `${slam} .55s ${ease.out} .45s both`,
})

export const extendedFrame = style({
  position: 'absolute',
  inset: 0,
  border: '2.5px solid currentColor',
  borderRadius: 5,
  filter: 'url(#ink-rough-heavy)',
})

export const extendedBig = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontWeight: 600,
  fontSize: 30,
  lineHeight: 1,
})

export const extendedSmall = style({
  fontFamily: vars.font.mono,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginTop: 4,
})

export const bigTally = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px 14px',
  color: vars.color.ink,
})

export const freezeChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '2px 8px',
  border: `1px dashed ${tone.ruleStrong}`,
  borderRadius: 2,
  fontFamily: vars.font.mono,
  fontSize: 12,
  color: vars.color.muted,
})
