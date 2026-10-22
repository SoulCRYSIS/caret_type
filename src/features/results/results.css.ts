import { globalStyle, keyframes, style } from '@vanilla-extract/css'
import { SEAL_RED } from '../../game/cards/sumi'
import { ease, tone, vars } from '../../theme/contract.css'
import { FONT_BRUSH } from '../../theme/fonts'

const press = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-28px) rotate(-4deg) scale(1.04)' },
  '60%': { opacity: 1, transform: 'translateY(3px) rotate(-0.6deg) scale(.995)' },
  '100%': { opacity: 1, transform: 'translateY(0) rotate(-1.2deg) scale(1)' },
})

const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateX(16px)' },
  to: { opacity: 1, transform: 'translateX(0)' },
})

export const report = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(280px, 340px)',
  alignItems: 'center',
  gap: 44,
  maxWidth: '100%',
  '@media': {
    'screen and (max-width: 860px)': {
      gridTemplateColumns: '1fr',
      justifyItems: 'center',
      gap: 28,
    },
  },
})

export const print = style({
  margin: 0,
  position: 'relative',
  opacity: 0,
  selectors: {
    '&[data-ready="true"]': { animation: `${press} .6s ${ease.out} both` },
  },
})

export const card = style({
  display: 'block',
  height: 'clamp(440px, calc(100vh - 190px), 680px)',
  width: 'auto',
  aspectRatio: '4 / 5',
  boxShadow: `0 1px 0 ${tone.rule}, 10px 12px 0 ${tone.shadow}, 0 18px 40px -18px ${tone.shadow}`,
  border: `1px solid ${tone.rule}`,
  '@media': {
    'screen and (max-width: 860px)': {
      height: 'auto',
      width: 'min(440px, 100%)',
    },
  },
})

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  animation: `${slideIn} .45s ${ease.out} .2s both`,
  width: '100%',
})

const BRUSH_STROKE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 14' preserveAspectRatio='none'><path d='M1 8 C 20 3, 70 4, 150 5 S 330 4, 399 6 L 396 9 C 330 9, 250 11, 170 10 S 40 12, 3 11 Z'/></svg>",
)}")`

const brushMask = {
  maskImage: BRUSH_STROKE,
  WebkitMaskImage: BRUSH_STROKE,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
} as const

const stampIn = keyframes({
  '0%': { opacity: 0, transform: 'scale(1.9) rotate(8deg)' },
  '60%': { opacity: 1, transform: 'scale(.94) rotate(-4deg)' },
  '100%': { opacity: 1, transform: 'scale(1) rotate(-3deg)' },
})

const sweep = keyframes({
  from: { clipPath: 'inset(0 100% 0 0)' },
  to: { clipPath: 'inset(0 0 0 0)' },
})

const sealBase = {
  fontFamily: FONT_BRUSH,
  lineHeight: 1,
  textAlign: 'center',
  letterSpacing: '0.04em',
  color: '#fff8ee',
  background: SEAL_RED,
  borderRadius: 3,
  filter: 'url(#ink-rough)',
} as const

export const head = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
})

export const seal = style({
  ...sealBase,
  padding: '12px 8px 11px',
  fontSize: 15,
  animation: `${stampIn} .45s ${ease.out} .35s both`,
})

export const headText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
})

export const modeName = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 22,
  lineHeight: 1.1,
})

export const issue = style({
  fontFamily: vars.font.mono,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: vars.color.muted,
})

export const headline = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: 16,
  rowGap: 6,
})

export const brushRule = style({
  ...brushMask,
  flexBasis: '100%',
  height: 9,
  background: vars.color.ink,
  opacity: 0.85,
  animation: `${sweep} .5s ${ease.out} .25s both`,
})

export const score = style({
  fontFamily: vars.font.display,
  fontSize: 56,
  lineHeight: 1,
  fontWeight: 500,
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
  fontVariationSettings: "'opsz' 144",
})

export const scoreMeta = style({
  fontFamily: vars.font.mono,
  fontSize: 13,
  color: vars.color.muted,
})

export const pb = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: vars.font.mono,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SEAL_RED,
})

export const pbSeal = style({
  ...sealBase,
  padding: '6px 6px 5px',
  fontSize: 12,
  animation: `${stampIn} .45s ${ease.out} .5s both`,
})

export const boardNote = style({
  margin: 0,
  fontSize: 15,
  color: vars.color.muted,
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  flexWrap: 'wrap',
})

export const rank = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 26,
  color: vars.color.ink,
})

/** A tanzaku slip: a narrow paper strip with a vermilion spine and a vertical label. */
export const claim = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '16px 18px 18px 50px',
  background: tone.wash,
  boxShadow: `0 1px 0 ${tone.rule}, 4px 5px 0 ${tone.shadow}`,
  transform: 'rotate(-0.4deg)',
  '::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 34,
    background: SEAL_RED,
    opacity: 0.12,
  },
})

export const claimMark = style({
  position: 'absolute',
  top: 14,
  left: 8,
  writingMode: 'vertical-rl',
  fontFamily: FONT_BRUSH,
  fontSize: 16,
  letterSpacing: '0.12em',
  color: SEAL_RED,
})

export const claimTitle = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 22,
  color: vars.color.ink,
})

export const claimText = style({
  margin: 0,
  fontSize: 15,
  lineHeight: 1.5,
  color: vars.color.ink,
})

export const streakSlot = style({
  display: 'flex',
  justifyContent: 'flex-start',
})

export const share = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  paddingTop: 16,
  '::before': {
    ...brushMask,
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: 5,
    background: tone.ruleStrong,
  },
})

export const panelLabel = style({
  fontVariant: 'small-caps',
  letterSpacing: '0.1em',
  fontSize: 14,
  color: vars.color.muted,
})

export const shareButtons = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
})

export const shareNote = style({
  minHeight: 18,
  fontFamily: vars.font.mono,
  fontSize: 12,
  color: vars.color.accent,
})

export const retry = style({
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  fontFamily: vars.font.mono,
  fontSize: 13,
  color: vars.color.muted,
  paddingTop: 12,
  borderTop: `1px solid ${tone.rule}`,
})

export const retryMain = style({
  color: vars.color.ink,
  fontSize: 14,
})

globalStyle(`${claim} p`, { margin: 0 })
