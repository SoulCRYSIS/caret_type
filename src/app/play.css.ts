import { globalStyle, keyframes, style } from '@vanilla-extract/css'
import { ease, tone, vars } from '../theme/contract.css'

export const page = style({
  position: 'relative',
  height: '100dvh',
  overflow: 'hidden',
})

/** Full page, behind the play area, so corner puddles sit on the paper around the port. */
export const puddles = style({
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
})

/** Full-page washes (low ink, a mistype) sit above the play area and cover the window. */
export const wash = style({
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  pointerEvents: 'none',
})

/** The play area stops at a desk-page size. A bigger window only adds paper around it. */
export const port = style({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1,
  width: 'min(1280px, 100%)',
  height: 'min(880px, 100%)',
  margin: 'auto',
})

export const stage = style({
  position: 'absolute',
  inset: 0,
})

export const shake = style({
  position: 'absolute',
  inset: 0,
  willChange: 'transform',
})

export const fx = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 1,
})

export const dimmed = style({
  transition: 'opacity .3s, filter .3s',
  selectors: {
    '&[data-phase="paused"], &[data-phase="over"]': { opacity: 0.18, filter: 'blur(1.5px)' },
  },
})

export const overlay = style({
  position: 'absolute',
  inset: 0,
  zIndex: 20,
  display: 'grid',
  placeItems: 'center',
  padding: '96px 24px 80px',
  overflowY: 'auto',
  '@media': { 'screen and (max-width: 640px)': { paddingTop: 148 } },
})

/* --- config bar: a fill-in-the-blanks sentence --- */

export const config = style({
  position: 'absolute',
  top: 84,
  '@media': { 'screen and (max-width: 640px)': { top: 148 } },
  left: 0,
  right: 0,
  zIndex: 25,
  pointerEvents: 'none',
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: '6px 10px',
  padding: '0 24px',
  fontFamily: vars.font.display,
  fontSize: 17,
  color: vars.color.muted,
  transition: 'opacity .35s ease, visibility .35s',
  selectors: { '&[data-hidden="true"]': { opacity: 0, visibility: 'hidden' } },
})

globalStyle(`${config} > *`, { pointerEvents: 'auto' })

/* --- idle --- */

const bob = keyframes({
  '0%, 100%': { transform: 'translateY(0) rotate(-3deg)' },
  '50%': { transform: 'translateY(-6px) rotate(-2deg)' },
})

export const idle = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 28,
  textAlign: 'center',
})

export const idleStamp = style({
  animation: `${bob} 3.2s ease-in-out infinite`,
})

export const idleTitle = style({
  fontFamily: vars.font.display,
  fontSize: 'clamp(28px, 4vw, 40px)',
  fontStyle: 'italic',
  fontWeight: 400,
  letterSpacing: '-0.02em',
})

const blink = keyframes({ '0%, 49%': { opacity: 1 }, '50%, 100%': { opacity: 0 } })

export const caret = style({
  display: 'inline-block',
  width: 2,
  height: '0.95em',
  marginLeft: 4,
  verticalAlign: '-0.1em',
  background: vars.color.accent,
  animation: `${blink} 1.05s steps(1) infinite`,
})

export const idleHint = style({
  fontFamily: vars.font.mono,
  fontSize: 13,
  color: vars.color.muted,
  display: 'flex',
  gap: 18,
  alignItems: 'center',
})

export const blurb = style({
  maxWidth: 380,
  color: vars.color.muted,
  fontSize: 15,
})

/* --- pause --- */

const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateY(8px) rotate(.6deg)' },
  to: { opacity: 1, transform: 'translateY(0) rotate(0)' },
})

export const sheet = style({
  position: 'relative',
  width: 'min(520px, 100%)',
  padding: '32px 36px 28px',
  background: vars.color.paper,
  border: `1px solid ${tone.rule}`,
  boxShadow: `6px 7px 0 ${tone.shadow}`,
  animation: `${slideIn} .25s ${ease.out}`,
})

export const sheetTitle = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 34,
  fontWeight: 400,
  letterSpacing: '-0.02em',
  marginBottom: 18,
})

export const row = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  margin: '10px 0',
  fontSize: 16,
})

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 24,
  alignItems: 'center',
})

export const loading = style({
  fontFamily: vars.font.mono,
  fontSize: 13,
  color: vars.color.muted,
})
