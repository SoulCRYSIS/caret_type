import { style } from '@vanilla-extract/css'
import { tone, vars } from '../../theme/contract.css'

export const providers = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'stretch',
})

export const providerGlyph = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: `1.5px solid currentColor`,
  fontFamily: vars.font.display,
  fontWeight: 700,
  fontSize: 12,
  lineHeight: 1,
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
