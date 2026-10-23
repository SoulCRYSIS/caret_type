import { keyframes, style } from '@vanilla-extract/css'
import { ease, vars } from '../../../theme/contract.css'
import { FONT_BRUSH } from '../../../theme/fonts'
import { SEAL_RED } from '../../cards/sumi'

const rise = keyframes({
  from: { opacity: 0, transform: 'translateY(10px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

const press = keyframes({
  '0%': { opacity: 0, transform: 'scale(1.8) rotate(6deg)' },
  '60%': { opacity: 1, transform: 'scale(.94) rotate(-3deg)' },
  '100%': { opacity: 1, transform: 'scale(1) rotate(-3deg)' },
})

const bob = keyframes({
  '0%, 100%': { transform: 'translateY(0) rotate(-1.5deg)' },
  '50%': { transform: 'translateY(-5px) rotate(1deg)' },
})

const blink = keyframes({ '0%, 49%': { opacity: 1 }, '50%, 100%': { opacity: 0 } })

export const intro = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 18,
  textAlign: 'center',
})

export const scene = style({
  position: 'relative',
  width: 'min(400px, 46vh, 80vw)',
  aspectRatio: '1',
})

export const enso = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
})

export const word = style({
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  animation: `${bob} 3.4s ease-in-out infinite, ${rise} .6s ${ease.out} .5s both`,
})

export const title = style({
  position: 'absolute',
  top: '12%',
  left: 'calc(100% + 4px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  animation: `${rise} .7s ${ease.out} .3s both`,
  '@media': { 'screen and (max-width: 720px)': { display: 'none' } },
})

export const titleSpine = style({
  writingMode: 'vertical-rl',
  fontFamily: FONT_BRUSH,
  fontSize: 'clamp(16px, 3.1vh, 30px)',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  color: vars.color.ink,
})

export const sealMark = style({
  display: 'block',
  width: 'clamp(22px, 4vh, 32px)',
  height: 'clamp(22px, 4vh, 32px)',
})

export const seal = style({
  marginTop: 6,
  padding: 3,
  lineHeight: 0,
  color: vars.color.paper,
  background: SEAL_RED,
  borderRadius: 3,
  filter: 'url(#ink-rough)',
  animation: `${press} .45s ${ease.out} 1.1s both`,
})

export const prompt = style({
  fontFamily: vars.font.display,
  fontSize: 'clamp(28px, 4vw, 40px)',
  fontStyle: 'italic',
  fontWeight: 400,
  letterSpacing: '-0.02em',
  animation: `${rise} .6s ${ease.out} .7s both`,
})

export const caret = style({
  display: 'inline-block',
  width: 2,
  height: '0.95em',
  marginLeft: 4,
  verticalAlign: '-0.1em',
  background: vars.color.accent,
  animation: `${blink} 1.05s steps(1) infinite`,
})

export const blurb = style({
  maxWidth: 440,
  margin: 0,
  color: vars.color.muted,
  fontSize: 15,
  animation: `${rise} .6s ${ease.out} .8s both`,
})

export const hints = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  marginTop: 4,
  fontFamily: vars.font.mono,
  fontSize: 13,
  color: vars.color.muted,
  animation: `${rise} .6s ${ease.out} .9s both`,
})