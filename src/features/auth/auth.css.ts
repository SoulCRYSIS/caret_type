import { globalStyle, style } from '@vanilla-extract/css'
import { tone, vars } from '../../theme/contract.css'

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
  width: 22,
  height: 22,
  borderRadius: '50%',
  objectFit: 'cover',
  border: `1px solid ${tone.rule}`,
  filter: 'grayscale(.35) contrast(1.05)',
})

export const initials = style([
  avatar,
  {
    display: 'inline-grid',
    placeItems: 'center',
    fontFamily: vars.font.display,
    fontSize: 11,
    fontWeight: 600,
    background: tone.wash,
  },
])

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
