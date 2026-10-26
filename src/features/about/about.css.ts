import { style } from '@vanilla-extract/css'
import { vars } from '../../theme/contract.css'

export const prose = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  maxWidth: 460,
  fontSize: 17,
  lineHeight: 1.55,
})

export const link = style({
  color: vars.color.ink,
  textDecoration: 'underline',
  textDecorationColor: vars.color.accent,
  textUnderlineOffset: '3px',
})
