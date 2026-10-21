import { style } from '@vanilla-extract/css'
import { tone, vars } from '../../theme/contract.css'

export const filters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: '6px 10px',
  fontSize: 17,
  color: vars.color.muted,
  marginBottom: 24,
})

export const tabs = style({
  display: 'flex',
  gap: 22,
  borderBottom: `1px solid ${tone.rule}`,
  marginBottom: 8,
})

export const tab = style({
  padding: '8px 0 10px',
  marginBottom: -1,
  fontVariant: 'small-caps',
  letterSpacing: '0.06em',
  fontSize: 16,
  color: vars.color.muted,
  borderBottom: '2px solid transparent',
  selectors: {
    '&[data-state="active"]': { color: vars.color.ink, borderBottomColor: vars.color.accent },
    '&:hover': { color: vars.color.ink },
  },
})

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

export const row = style({
  display: 'grid',
  gridTemplateColumns: '44px 26px minmax(0, 1fr) auto 64px 56px 44px',
  alignItems: 'center',
  gap: 12,
  padding: '10px 0',
  borderBottom: `1px dotted ${tone.rule}`,
  selectors: {
    '&[data-self="true"]': { background: tone.accentWash, margin: '0 -12px', padding: '10px 12px' },
  },
  '@media': {
    'screen and (max-width: 640px)': { gridTemplateColumns: '36px 24px minmax(0, 1fr) auto 56px' },
  },
})

export const rank = style({
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 20,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.muted,
  selectors: {
    '&[data-top="true"]': { color: vars.color.accent, fontWeight: 600 },
  },
})

export const name = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const score = style({
  fontFamily: vars.font.display,
  fontWeight: 600,
  fontSize: 18,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
})

export const metric = style({
  fontFamily: vars.font.mono,
  fontSize: 12,
  color: vars.color.muted,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
})

export const hideSmall = style({
  '@media': { 'screen and (max-width: 640px)': { display: 'none' } },
})

export const header = style([
  row,
  {
    fontVariant: 'small-caps',
    letterSpacing: '0.08em',
    fontSize: 13,
    color: vars.color.muted,
    borderBottom: `1px solid ${tone.rule}`,
  },
])

export const empty = style({
  padding: '40px 0',
  color: vars.color.muted,
  fontStyle: 'italic',
})

export const gate = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  alignItems: 'flex-start',
  padding: '24px 0',
})
