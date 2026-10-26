import { globalStyle, keyframes, style } from '@vanilla-extract/css'
import { tone, vars } from '../../theme/contract.css'

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
const riseIn = keyframes({ from: { opacity: 0, transform: 'translate(-50%, -46%)' }, to: { opacity: 1, transform: 'translate(-50%, -50%)' } })

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 400,
  background: `color-mix(in srgb, ${vars.color.paper} 72%, transparent)`,
  backdropFilter: 'blur(2px)',
  animation: `${fadeIn} .2s ease-out`,
})

export const dialog = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 401,
  width: 'min(340px, calc(100vw - 32px))',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: vars.color.paper,
  color: vars.color.ink,
  border: `1px solid ${tone.ruleStrong}`,
  borderRadius: 2,
  boxShadow: `4px 5px 0 ${tone.shadow}`,
  animation: `${riseIn} .22s ease-out`,
  outline: 'none',
})

export const verify = style({
  position: 'fixed',
  top: 64,
  left: 16,
  right: 16,
  zIndex: 40,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  justifyContent: 'center',
  columnGap: 16,
  rowGap: 4,
  padding: '8px 16px',
  fontSize: 13,
  color: vars.color.ink,
  background: vars.color.paper,
  border: `1px dashed ${tone.ruleStrong}`,
  textAlign: 'center',
})

export const verifyActions = style({
  display: 'inline-flex',
  gap: 14,
})

export const dialogNote = style({
  margin: 0,
  fontSize: 13,
  color: vars.color.muted,
})

export const providers = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'stretch',
})

export const providerGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
})

globalStyle(`${providerGrid} > button`, { padding: '7px 10px', fontSize: 13, gap: 8 })
globalStyle(`${providerGrid} > button:last-child:nth-child(odd)`, { gridColumn: '1 / -1' })

export const provider = style({
  justifyContent: 'flex-start',
  gap: 12,
})

export const providerIcon = style({
  width: 18,
  height: 18,
  flexShrink: 0,
})

export const or = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: vars.font.mono,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: vars.color.muted,
  '::before': { content: '""', flex: 1, height: 1, background: tone.rule },
  '::after': { content: '""', flex: 1, height: 1, background: tone.rule },
})

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minWidth: 250,
})

export const formTitle = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 18,
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
})

export const fieldLabel = style({
  fontVariant: 'small-caps',
  letterSpacing: '0.08em',
  fontSize: 13,
  color: vars.color.muted,
})

export const input = style({
  font: 'inherit',
  fontFamily: vars.font.mono,
  fontSize: 14,
  color: vars.color.ink,
  background: 'transparent',
  border: 'none',
  borderBottom: `1.5px solid ${tone.ruleStrong}`,
  padding: '6px 2px',
  outline: 'none',
  transition: 'border-color .15s',
  ':focus': { borderBottomColor: vars.color.accent },
  '::placeholder': { color: vars.color.muted, opacity: 0.6 },
})

export const formLinks = style({
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: 14,
  rowGap: 4,
  fontSize: 13,
})

export const note = style({
  fontSize: 13,
  color: vars.color.muted,
  maxWidth: 260,
})

export const error = style({
  fontFamily: vars.font.mono,
  fontSize: 12,
  color: vars.color.error,
})

export const avatar = style({
  width: 26,
  height: 26,
  flexShrink: 0,
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: '50%',
  color: vars.color.ink,
  background: tone.wash,
  border: `1px solid ${tone.ruleStrong}`,
  overflow: 'hidden',
  fontFamily: vars.font.display,
  fontSize: 12,
  fontWeight: 600,
})

export const avatarImg = style({ width: '100%', height: '100%', minWidth: 0, display: 'block', objectFit: 'cover', pointerEvents: 'none' })

export const pickerGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 6,
  width: 264,
  maxWidth: '100%',
})

export const fileInput = style({ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' })

export const uploadLink = style({
  position: 'relative',
  alignSelf: 'flex-start',
  fontSize: 13,
  color: vars.color.muted,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
  ':hover': { color: vars.color.ink },
  selectors: { '&:focus-within': { outline: `2px solid ${vars.color.accent}`, outlineOffset: 2 } },
})

export const pick = style({
  appearance: 'none',
  padding: 0,
  overflow: 'hidden',
  aspectRatio: '1',
  cursor: 'pointer',
  borderRadius: '50%',
  color: vars.color.ink,
  background: tone.wash,
  border: `1.5px solid transparent`,
  transition: 'transform .15s, border-color .15s, background .15s',
  ':hover': { transform: 'translateY(-1px) rotate(-4deg)', background: tone.washStrong },
  ':focus-visible': { outline: `2px solid ${vars.color.accent}`, outlineOffset: 2 },
  selectors: { '&[data-on="true"]': { borderColor: vars.color.accent, background: tone.accentWash } },
})

export const menuHead = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  marginBottom: 12,
})

export const menuName = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 18,
})

export const menuList = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
})
