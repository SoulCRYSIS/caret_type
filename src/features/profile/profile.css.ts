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

export const gate = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 18px',
  border: `1.5px dashed ${vars.color.accent}`,
  background: tone.accentWash,
})

export const figures = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  gap: '18px 24px',
})

export const figure = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
})

export const figureValue = style({
  fontFamily: vars.font.display,
  fontSize: 30,
  lineHeight: 1.05,
  fontWeight: 500,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
})

export const figureLabel = style({
  fontVariant: 'small-caps',
  letterSpacing: '0.08em',
  fontSize: 13,
  color: vars.color.muted,
})

export const up = style({ color: vars.color.accent, fontFamily: vars.font.mono, fontSize: 12 })
export const down = style({ color: vars.color.error, fontFamily: vars.font.mono, fontSize: 12 })

export const chart = style({
  display: 'block',
  width: '100%',
  height: 150,
  overflow: 'visible',
})

export const chartLine = style({
  fill: 'none',
  stroke: vars.color.ink,
  strokeWidth: 1.6,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  vectorEffect: 'non-scaling-stroke',
})

export const chartAvg = style({
  stroke: vars.color.accent,
  strokeWidth: 1,
  strokeDasharray: '3 5',
  vectorEffect: 'non-scaling-stroke',
})

export const chartDot = style({ fill: vars.color.ink })
export const chartBest = style({ fill: vars.color.accent })

export const chartLabel = style({
  fontFamily: vars.font.mono,
  fontSize: 10,
  fill: vars.color.muted,
})

export const calendar = style({
  display: 'flex',
  gap: 4,
  overflowX: 'auto',
  paddingBottom: 4,
})

export const calCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
})

export const calDay = style({
  width: 14,
  height: 14,
  borderRadius: 2,
  border: `1px solid ${tone.rule}`,
  selectors: {
    '&[data-level="1"]': { background: tone.ruleStrong, borderColor: 'transparent' },
    '&[data-level="2"]': { background: `color-mix(in srgb, ${vars.color.ink} 60%, transparent)`, borderColor: 'transparent' },
    '&[data-level="3"]': { background: vars.color.ink, borderColor: 'transparent' },
    '&[data-today="true"]': { outline: `1.5px solid ${vars.color.accent}`, outlineOffset: 1 },
    '&[data-empty="true"]': { visibility: 'hidden' },
  },
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
