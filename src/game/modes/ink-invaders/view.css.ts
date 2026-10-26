import { globalStyle, keyframes, style } from '@vanilla-extract/css'
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

const sealPop = keyframes({
  '0%': { transform: 'scale(1.45) rotate(-14deg)' },
  '60%': { transform: 'scale(0.94) rotate(-4deg)' },
  '100%': { transform: 'scale(1) rotate(0deg)' },
})

const sealDip = keyframes({
  '0%': { transform: 'scale(1.12) rotate(6deg)' },
  '100%': { transform: 'scale(1) rotate(0deg)' },
})

export const comboSeal = style({
  display: 'block',
  marginLeft: 'auto',
  pointerEvents: 'none',
  selectors: {
    '&[data-dir="up"]': { animation: `${sealPop} .26s ${ease.out} both` },
    '&[data-dir="down"]': { animation: `${sealDip} .2s ${ease.out} both` },
    [`${comboBlock}[data-reduced="true"] &`]: { animation: 'none' },
  },
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
})

export const tierBar = style({
  display: 'block',
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

/* --- combo tier: a quick sumi stroke, then the numeral stamped in a seal --- */

const brushFade = keyframes({
  '0%': { opacity: 1, clipPath: 'inset(0 100% 0 0)' },
  '28%': { opacity: 1, clipPath: 'inset(0 0 0 0)' },
  '74%': { opacity: 1, clipPath: 'inset(0 0 0 0)' },
  '100%': { opacity: 0, clipPath: 'inset(0 0 0 0)' },
})

const sealIn = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(1.35) rotate(-12deg)' },
  '22%': { opacity: 1, transform: 'translate(-50%, -50%) scale(0.94) rotate(-2deg)' },
  '32%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
  '74%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
  '100%': { opacity: 0, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
})

const sealStill = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -50%)' },
  '16%': { opacity: 1, transform: 'translate(-50%, -50%)' },
  '70%': { opacity: 1, transform: 'translate(-50%, -50%)' },
  '100%': { opacity: 0, transform: 'translate(-50%, -50%)' },
})

export const brushField = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  zIndex: 1,
  pointerEvents: 'none',
  color: vars.color.ink,
  animation: `${brushFade} .72s linear both`,
})

export const sealStamp = style({
  position: 'absolute',
  left: '34%',
  top: '44%',
  zIndex: 4,
  pointerEvents: 'none',
  animation: `${sealIn} .72s linear both`,
  selectors: { '&[data-reduced="true"]': { animation: `${sealStill} .52s ease-out both` } },
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: `${sealStill} .52s ease-out both` },
    '(max-width: 720px)': { scale: '0.72' },
  },
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
