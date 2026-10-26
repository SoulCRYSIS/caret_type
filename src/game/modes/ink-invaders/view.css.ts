import { createVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { ease, tone, vars } from '../../../theme/contract.css'

export const root = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  userSelect: 'none',
})

/* Pigment collects at the corners; words and HUD stay above the wash. */
export const bloom = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
})

/* --- enemy stamp --- */

const stampIn = keyframes({
  '0%': { opacity: 0, transform: 'scale(1.7) rotate(-6deg)' },
  '55%': { opacity: 1, transform: 'scale(0.94)' },
  '100%': { opacity: 1, transform: 'scale(1)' },
})

const dangerPulse = keyframes({
  '0%, 100%': { opacity: 0.9 },
  '50%': { opacity: 0.45 },
})

export const enemy = style({
  position: 'absolute',
  left: 0,
  top: 0,
  willChange: 'transform',
  zIndex: 2,
})

export const stamp = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 13px 7px',
  fontFamily: vars.font.mono,
  fontSize: 22,
  fontWeight: 500,
  lineHeight: 1.25,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
  color: vars.color.ink,
  animation: `${stampIn} .3s ${ease.spring} both`,
  transition: `transform .14s ${ease.spring}`,
  selectors: {
    [`${enemy}[data-target="true"] &`]: { transform: 'scale(1.08)' },
    [`${enemy}[data-heavy="true"] &`]: { fontSize: 25, padding: '9px 16px 10px' },
  },
})

export const frame = style({
  position: 'absolute',
  inset: 0,
  border: `2px solid ${tone.ruleStrong}`,
  borderRadius: 4,
  filter: 'url(#ink-rough)',
  transition: 'border-color .12s, background-color .12s',
  pointerEvents: 'none',
  selectors: {
    [`${enemy}[data-target="true"] &`]: { borderColor: vars.color.accent, background: tone.accentWash },
    [`${enemy}[data-danger="true"] &`]: { borderColor: vars.color.error, animation: `${dangerPulse} .7s ease-in-out infinite` },
    [`${enemy}[data-heavy="true"] &`]: {
      borderWidth: 3,
      borderColor: vars.color.ink,
      boxShadow: `inset 0 0 0 3px ${vars.color.paper}, inset 0 0 0 4.5px ${tone.ruleStrong}`,
    },
  },
})

const pop = keyframes({
  '0%': { transform: 'translateY(0) scale(1)' },
  '35%': { transform: 'translateY(-4px) scale(1.38)' },
  '100%': { transform: 'translateY(0) scale(1)' },
})

export const glyph = style({
  position: 'relative',
  display: 'inline-block',
  transition: 'color .08s',
})

globalStyle(`${glyph}[data-s="typed"]`, {
  color: vars.color.accent,
  animation: `${pop} .2s ${ease.out}`,
})

globalStyle(`${glyph}[data-s="partial"]`, {
  color: `color-mix(in oklab, ${vars.color.accent} 60%, ${vars.color.ink})`,
})

globalStyle(`${enemy}[data-target="true"] ${glyph}[data-s="next"]::after`, {
  content: '""',
  position: 'absolute',
  left: 1,
  right: 1,
  bottom: -2,
  height: 2,
  background: vars.color.accent,
  borderRadius: 1,
})

globalStyle(`${glyph}[data-shield="true"]`, {
  color: vars.color.muted,
})

globalStyle(`${glyph}[data-shield="true"][data-s="typed"]`, {
  color: vars.color.error,
  textDecoration: 'line-through',
  textDecorationThickness: 2,
})

export const shieldGap = style({
  display: 'inline-block',
  width: 8,
  height: '0.9em',
  marginRight: 6,
  borderRight: `2px solid ${tone.ruleStrong}`,
})

/* --- HUD --- */

export const hud = style({
  position: 'absolute',
  top: 22,
  left: 40,
  right: 40,
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'start',
  zIndex: 3,
  pointerEvents: 'none',
})

export const hudLabel = style({
  display: 'block',
  fontVariant: 'small-caps',
  letterSpacing: '0.1em',
  fontSize: 12,
  color: vars.color.muted,
})

const bump = keyframes({
  '0%': { transform: 'scale(1)', color: vars.color.ink },
  '30%': { transform: 'scale(1.22)', color: vars.color.accent },
  '100%': { transform: 'scale(1)', color: vars.color.ink },
})

export const score = style({
  display: 'inline-block',
  transformOrigin: 'left center',
  fontFamily: vars.font.display,
  fontSize: 40,
  lineHeight: 1,
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  fontVariationSettings: "'opsz' 72",
  letterSpacing: '-0.02em',
  animation: `${bump} .26s ${ease.out}`,
})

export const waveBlock = style({
  textAlign: 'center',
})

export const waveNum = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 22,
  lineHeight: 1.1,
})

export const ticks = style({
  display: 'flex',
  justifyContent: 'center',
  gap: 3,
  marginTop: 6,
  maxWidth: 220,
  flexWrap: 'wrap',
})

export const tick = style({
  width: 2,
  height: 9,
  borderRadius: 1,
  background: tone.ruleStrong,
  transform: 'rotate(8deg)',
  transition: 'background-color .2s, transform .2s',
  selectors: { '&[data-done="true"]': { background: vars.color.accent, transform: 'rotate(8deg) scaleY(1.3)' } },
})

export const comboBlock = style({
  position: 'relative',
  justifySelf: 'end',
  textAlign: 'right',
})

const stampFrom = createVar()
const stampSpin = createVar()
const inkBreathe = createVar()
const wag = createVar()
const inkFrom = createVar()
const inkOver = createVar()
const inkSpin = createVar()
const hotScale = createVar()

const inkSpread = keyframes({
  '0%': { transform: `scale(${inkFrom}) rotate(calc(${inkSpin} * -1))`, opacity: 0.55 },
  '38%': { transform: `scale(${inkOver}) rotate(${inkSpin})`, opacity: 1 },
  '64%': { transform: `scale(.93) rotate(calc(${inkSpin} * -.3))` },
  '100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
})

const inkShrink = keyframes({
  '0%': { transform: 'scale(1.2) rotate(6deg)', opacity: 0.45 },
  '46%': { transform: 'scale(.84) rotate(-5deg)', opacity: 1 },
  '100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
})

const inkFlow = keyframes({
  '0%, 100%': { transform: `scale(1, 1) rotate(calc(${wag} * -1))` },
  '33%': { transform: `scale(calc(1 + ${inkBreathe}), calc(1 - ${inkBreathe} * .7)) rotate(${wag})` },
  '66%': { transform: `scale(calc(1 - ${inkBreathe} * .45), calc(1 + ${inkBreathe})) rotate(calc(${wag} * -.65))` },
})

const shock = keyframes({
  '0%': { transform: 'scale(.55)', opacity: 0.7 },
  '100%': { transform: 'scale(1.22)', opacity: 0 },
})

const multStampKf = keyframes({
  '0%': { transform: `translateY(-10px) scale(${stampFrom}) rotate(${stampSpin})`, color: vars.color.ink },
  '34%': { transform: `translateY(1px) scale(.9) rotate(calc(${stampSpin} * -.12))`, color: vars.color.ink },
  '50%': { transform: `translateY(2px) scale(.88) rotate(calc(${stampSpin} * -.16))`, color: vars.color.paper },
  '72%': { transform: `translateY(-1px) scale(1.06) rotate(calc(${stampSpin} * .08))`, color: vars.color.paper },
  '100%': { transform: 'translateY(0) scale(1) rotate(0deg)', color: vars.color.paper },
})

const multDropKf = keyframes({
  '0%': { transform: 'translateY(-2px) scale(1.16) rotate(7deg)' },
  '36%': { transform: 'translateY(3px) scale(.8) rotate(-7deg)' },
  '68%': { transform: 'translateY(0) scale(1.04) rotate(2deg)' },
  '100%': { transform: 'translateY(0) scale(1) rotate(0deg)' },
})

const multHotKf = keyframes({
  '0%, 100%': { transform: 'scale(1)' },
  '50%': { transform: `scale(${hotScale})` },
})

function splatter(x: string, y: string) {
  return keyframes({
    '0%': { transform: `translate(${x}, ${y}) scale(.15)`, opacity: 0 },
    '58%': { transform: 'translate(0, 0) scale(1.25)', opacity: 1 },
    '100%': { transform: 'translate(0, 0) scale(1)', opacity: 1 },
  })
}

const ring = {
  content: '""',
  position: 'absolute' as const,
  left: '50%',
  top: '50%',
  width: 62,
  height: 62,
  marginLeft: -31,
  marginTop: -31,
  borderRadius: '46% 54% 50% 50%',
  border: '2px solid currentColor',
  filter: 'url(#ink-rough)',
  opacity: 0,
  pointerEvents: 'none' as const,
  zIndex: 0,
}

export const comboSeal = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 96,
  height: 64,
  color: vars.color.ink,
  vars: {
    [stampFrom]: '1.34',
    [stampSpin]: '-6deg',
  },
  '::before': ring,
  '::after': ring,
  selectors: {
    '&[data-tier="3"]': { vars: { [stampFrom]: '1.46', [stampSpin]: '-8deg' } },
    '&[data-tier="4"]': { vars: { [stampFrom]: '1.58', [stampSpin]: '-10deg' } },
    '&[data-tier="5"]': { vars: { [stampFrom]: '1.72', [stampSpin]: '-12deg' } },
    '&[data-tier="6"]': { vars: { [stampFrom]: '1.88', [stampSpin]: '-14deg' } },
    '&[data-tier="4"], &[data-tier="5"], &[data-tier="6"]': { color: vars.color.accent },
    '&[data-dir="up"]::after': { animation: `${shock} .62s ${ease.out} both` },
    '&[data-dir="up"][data-tier="5"]::before, &[data-dir="up"][data-tier="6"]::before': {
      animation: `${shock} .78s .12s ${ease.out} both`,
    },
    [`${comboBlock}[data-reduced="true"] &::before, ${comboBlock}[data-reduced="true"] &::after`]: { animation: 'none' },
  },
})

globalStyle(`${comboSeal}[data-dir="up"]::before, ${comboSeal}[data-dir="up"]::after`, {
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
})

const inkVars = {
  [inkBreathe]: '0.045',
  [wag]: '1.8deg',
  [inkFrom]: '0.4',
  [inkOver]: '1.12',
  [inkSpin]: '5deg',
}

export const comboInk = style({
  position: 'absolute',
  width: 120,
  height: 88,
  overflow: 'visible',
  fill: 'currentColor',
  pointerEvents: 'none',
  filter: 'url(#ink-rough)',
  vars: inkVars,
  selectors: {
    [`${comboSeal}[data-tier="1"] &`]: { display: 'none' },
    [`${comboSeal}[data-tier="2"] &`]: { scale: '.68', opacity: 0.85 },
    [`${comboSeal}[data-tier="3"] &`]: { scale: '.78' },
    [`${comboSeal}[data-tier="4"] &`]: {
      scale: '.88',
      vars: { [inkBreathe]: '0.06', [wag]: '2.6deg', [inkFrom]: '0.32', [inkOver]: '1.16', [inkSpin]: '7deg' },
    },
    [`${comboSeal}[data-tier="5"] &`]: {
      scale: '.96',
      vars: { [inkBreathe]: '0.075', [wag]: '3.2deg', [inkFrom]: '0.26', [inkOver]: '1.2', [inkSpin]: '9deg' },
    },
    [`${comboSeal}[data-tier="6"] &`]: {
      scale: '1.06',
      vars: { [inkBreathe]: '0.095', [wag]: '4deg', [inkFrom]: '0.2', [inkOver]: '1.26', [inkSpin]: '11deg' },
    },
  },
})

const inkMotionOff = {
  selectors: {
    [`${comboBlock}[data-reduced="true"] &`]: { animation: 'none' },
  },
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
}

export const comboInkUp = style({
  animation: `${inkSpread} .5s ${ease.out} both, ${inkFlow} 3.4s .5s ease-in-out infinite`,
  selectors: {
    [`${comboSeal}[data-tier="4"] &`]: { animationDuration: '.52s, 2.8s', animationDelay: '0s, .52s' },
    [`${comboSeal}[data-tier="5"] &`]: { animationDuration: '.56s, 2.3s', animationDelay: '0s, .56s' },
    [`${comboSeal}[data-tier="6"] &`]: { animationDuration: '.62s, 1.7s', animationDelay: '0s, .62s' },
    ...inkMotionOff.selectors,
  },
  '@media': inkMotionOff['@media'],
})

export const comboInkDown = style({
  animation: `${inkShrink} .42s ${ease.out} both, ${inkFlow} 3.4s .42s ease-in-out infinite`,
  selectors: {
    [`${comboSeal}[data-tier="5"] &`]: { animationDuration: '.42s, 2.3s' },
    [`${comboSeal}[data-tier="6"] &`]: { animationDuration: '.42s, 1.7s' },
    ...inkMotionOff.selectors,
  },
  '@media': inkMotionOff['@media'],
})

function splatterStyle(x: string, y: string, delay: string) {
  return style({
    transformBox: 'fill-box',
    transformOrigin: 'center',
    animation: `${splatter(x, y)} .5s ${ease.out} ${delay} both`,
    ...inkMotionOff,
  })
}

export const splatterDrop = {
  nw: splatterStyle('48px', '22px', '.02s'),
  ne: splatterStyle('-40px', '25px', '.1s'),
  se: splatterStyle('-43px', '-22px', '.06s'),
  sw: splatterStyle('29px', '-33px', '.14s'),
}

export const mult = style({
  position: 'relative',
  zIndex: 1,
  fontFamily: vars.font.display,
  fontSize: 30,
  fontWeight: 600,
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.04em',
  color: vars.color.paper,
  selectors: {
    [`${comboSeal}[data-tier="1"] &`]: { color: vars.color.muted },
    [`${comboSeal}[data-tier="5"] &`]: { fontSize: 34 },
    [`${comboSeal}[data-tier="6"] &`]: { fontSize: 36 },
  },
})

export const multHot = style({
  vars: { [hotScale]: '1.045' },
  animation: `${multHotKf} 1.8s .62s ease-in-out infinite`,
  selectors: {
    [`${comboSeal}[data-tier="6"] &`]: { vars: { [hotScale]: '1.08' }, animationDuration: '1.15s' },
    ...inkMotionOff.selectors,
  },
  '@media': inkMotionOff['@media'],
})

const figure = {
  display: 'block',
  transformOrigin: '50% 55%',
}

export const multFigure = style(figure)

export const multStamp = style({
  ...figure,
  animation: `${multStampKf} .5s ${ease.out} both`,
  selectors: {
    [`${comboSeal}[data-tier="5"] &`]: { animationDuration: '.56s' },
    [`${comboSeal}[data-tier="6"] &`]: { animationDuration: '.62s' },
    ...inkMotionOff.selectors,
  },
  '@media': inkMotionOff['@media'],
})

export const multDrop = style({
  ...figure,
  animation: `${multDropKf} .42s ${ease.out} both`,
  ...inkMotionOff,
})

export const tierBar = style({
  display: 'block',
  width: 96,
  height: 3,
  borderRadius: '45% 20% 35% 25%',
  marginLeft: 'auto',
  marginTop: 6,
  marginBottom: 4,
  background: tone.rule,
  position: 'relative',
  overflow: 'hidden',
})

export const tierFill = style({
  position: 'absolute',
  inset: 0,
  transformOrigin: 'left center',
  background: vars.color.accent,
  transition: `transform .18s ${ease.out}`,
})

export const comboCount = style({
  display: 'block',
  fontFamily: vars.font.mono,
  fontSize: 12,
  color: vars.color.muted,
  fontVariantNumeric: 'tabular-nums',
})

const crack = keyframes({
  '0%': { opacity: 1, transform: 'translate(0,0) rotate(0)' },
  '20%': { opacity: 1, transform: 'translate(-3px,-2px) rotate(-6deg)' },
  '100%': { opacity: 0, transform: 'translate(-14px, 46px) rotate(-28deg)' },
})

export const crackNum = style({
  position: 'absolute',
  right: 0,
  top: 36,
  fontFamily: vars.font.mono,
  fontSize: 15,
  color: vars.color.error,
  animation: `${crack} .75s ${ease.out} forwards`,
})

/* --- lives --- */

export const lives = style({
  position: 'absolute',
  left: 40,
  bottom: 22,
  display: 'flex',
  alignItems: 'flex-end',
  gap: 7,
  zIndex: 3,
})

const dropLost = keyframes({
  '0%': { transform: 'scale(1.5) rotate(-12deg)' },
  '100%': { transform: 'scale(1) rotate(0)' },
})

export const drop = style({
  width: 13,
  height: 18,
  color: vars.color.ink,
  transition: 'color .3s',
  selectors: {
    '&[data-full="false"]': { color: tone.ruleStrong, animation: `${dropLost} .4s ${ease.spring}` },
  },
})

/* --- margin --- */

export const margin = style({
  position: 'absolute',
  left: 24,
  right: 24,
  height: 0,
  borderTop: `1.5px dashed ${tone.ruleStrong}`,
  zIndex: 1,
})

export const marginLabel = style({
  position: 'absolute',
  right: 0,
  top: 6,
  fontVariant: 'small-caps',
  letterSpacing: '0.12em',
  fontSize: 12,
  color: vars.color.muted,
})

export const notebookRule = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 28,
  width: 0,
  borderLeft: `1.5px solid color-mix(in oklab, ${vars.color.accent} 26%, transparent)`,
  zIndex: 0,
})

/* --- banner --- */

const stampBanner = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(2.6) rotate(-10deg)' },
  '14%': { opacity: 1, transform: 'translate(-50%, -50%) scale(.92) rotate(-3deg)' },
  '22%': { transform: 'translate(-50%, -50%) scale(1.03) rotate(-4deg)' },
  '28%': { transform: 'translate(-50%, -50%) scale(1) rotate(-4deg)' },
  '78%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(-4deg)' },
  '100%': { opacity: 0, transform: 'translate(-50%, -54%) scale(1) rotate(-4deg)' },
})

export const banner = style({
  position: 'absolute',
  left: '50%',
  top: '42%',
  zIndex: 4,
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 26px 10px',
  color: vars.color.accent,
  animation: `${stampBanner} 1.5s ${ease.out} forwards`,
  selectors: {
    '&[data-tone="ink"]': { color: vars.color.ink },
    '&[data-tone="error"]': { color: vars.color.error },
  },
})

export const bannerFrame = style({
  position: 'absolute',
  inset: 0,
  border: '3px solid currentColor',
  borderRadius: 6,
  filter: 'url(#ink-rough-heavy)',
  opacity: 0.9,
})

export const bannerText = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontWeight: 600,
  fontSize: 54,
  lineHeight: 1.05,
  letterSpacing: '-0.02em',
  filter: 'url(#ink-rough)',
})

export const bannerSub = style({
  fontFamily: vars.font.mono,
  fontSize: 13,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
})

/* --- overlays --- */

const breathe = keyframes({
  '0%, 100%': { opacity: 0.55 },
  '50%': { opacity: 1 },
})

export const vignette = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 5,
  boxShadow: `inset 0 0 140px 20px color-mix(in oklab, ${vars.color.error} 30%, transparent)`,
  animation: `${breathe} 1.4s ease-in-out infinite`,
  selectors: {
    '&[data-critical="true"]': {
      boxShadow: `inset 0 0 180px 50px color-mix(in oklab, ${vars.color.error} 42%, transparent)`,
      animationDuration: '.8s',
    },
  },
})

const flashKf = keyframes({
  '0%': { opacity: 0.9 },
  '100%': { opacity: 0 },
})

export const flash = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 5,
  background: tone.errorWash,
  opacity: 0,
  selectors: { '&[data-on="true"]': { animation: `${flashKf} .22s ease-out` } },
})
