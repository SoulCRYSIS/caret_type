import { keyframes, style } from '@vanilla-extract/css'
import { ease, tone, vars } from '../../theme/contract.css'

const feed = keyframes({
  from: { opacity: 0, transform: 'translateY(-14px)', clipPath: 'inset(0 0 100% 0)' },
  to: { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' },
})

export const sheet = style({
  position: 'relative',
  width: 'min(560px, 100%)',
  padding: '30px 36px 26px',
  background: vars.color.paper,
  border: `1px solid ${tone.rule}`,
  boxShadow: `6px 7px 0 ${tone.shadow}`,
  animation: `${feed} .5s ${ease.out}`,
})

export const head = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  fontFamily: vars.font.mono,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: vars.color.muted,
  paddingBottom: 10,
  borderBottom: `1px solid ${tone.rule}`,
})

export const scoreRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  margin: '18px 0 10px',
})

export const scoreLabel = style({
  display: 'block',
  fontVariant: 'small-caps',
  letterSpacing: '0.1em',
  fontSize: 13,
  color: vars.color.muted,
})

export const score = style({
  fontFamily: vars.font.display,
  fontSize: 'clamp(48px, 9vw, 72px)',
  lineHeight: 1,
  fontWeight: 500,
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
  fontVariationSettings: "'opsz' 144",
})

export const stamps = style({
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
})

const slam = keyframes({
  '0%': { opacity: 0, transform: 'scale(2.2) rotate(10deg)' },
  '50%': { opacity: 1, transform: 'scale(.94) rotate(5deg)' },
  '100%': { opacity: 1, transform: 'scale(1) rotate(5deg)' },
})

export const pb = style({
  position: 'relative',
  padding: '6px 12px',
  fontFamily: vars.font.mono,
  fontSize: 12,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: vars.color.accent,
  animation: `${slam} .45s ${ease.out} .25s both`,
  '::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    border: '2px solid currentColor',
    borderRadius: 4,
    filter: 'url(#ink-rough-heavy)',
  },
})

export const ledger = style({
  margin: '8px 0 0',
  padding: 0,
  listStyle: 'none',
})

export const line = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  padding: '5px 0',
  fontSize: 16,
})

export const leader = style({
  flex: 1,
  borderBottom: `1.5px dotted ${tone.ruleStrong}`,
  transform: 'translateY(-4px)',
})

export const value = style({
  fontFamily: vars.font.mono,
  fontVariantNumeric: 'tabular-nums',
  fontSize: 15,
})

export const chart = style({
  display: 'block',
  width: '100%',
  height: 64,
  marginTop: 16,
  overflow: 'visible',
})

export const chartLine = style({
  fill: 'none',
  stroke: vars.color.ink,
  strokeWidth: 1.6,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  strokeDasharray: 600,
  strokeDashoffset: 600,
  animation: `${keyframes({ to: { strokeDashoffset: 0 } })} 1.1s ${ease.out} .3s forwards`,
})

export const chartDot = style({ fill: vars.color.accent })

export const chartLabel = style({
  fontFamily: vars.font.mono,
  fontSize: 9,
  fill: vars.color.muted,
})

export const footer = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 14,
  marginTop: 20,
  paddingTop: 14,
  borderTop: `1px solid ${tone.rule}`,
})

export const boardNote = style({
  fontSize: 14,
  color: vars.color.muted,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
})

export const rank = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 18,
  color: vars.color.ink,
})

export const retry = style({
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  fontFamily: vars.font.mono,
  fontSize: 13,
  color: vars.color.muted,
})

export const retryMain = style({
  color: vars.color.ink,
  fontSize: 14,
})

export const streakSlot = style({
  display: 'flex',
  justifyContent: 'center',
  marginTop: 16,
})
