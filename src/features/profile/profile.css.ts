import { style } from '@vanilla-extract/css'
import { tone, vars } from '../../theme/contract.css'

export const who = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
})

export const bigNum = style({
  fontFamily: vars.font.display,
  fontSize: 56,
  lineHeight: 1,
  fontWeight: 500,
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
})

export const streakRow = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 20,
  flexWrap: 'wrap',
})

export const caption = style({
  fontSize: 14,
  color: vars.color.muted,
})

export const runs = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
})

export const th = style({
  textAlign: 'left',
  fontWeight: 400,
  fontVariant: 'small-caps',
  letterSpacing: '0.08em',
  color: vars.color.muted,
  padding: '0 10px 8px 0',
  borderBottom: `1px solid ${tone.rule}`,
})

export const td = style({
  padding: '8px 10px 8px 0',
  borderBottom: `1px dotted ${tone.rule}`,
  fontFamily: vars.font.mono,
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
})

export const tdScore = style([td, { fontFamily: vars.font.display, fontSize: 16, fontWeight: 600 }])
