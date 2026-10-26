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
  height: 'auto',
  maxWidth: 680,
  overflow: 'visible',
})

export const chartPick = style({
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: 8,
  fontSize: 15,
  color: vars.color.muted,
})

export const chartGrid = style({ stroke: tone.rule, strokeWidth: 1, strokeDasharray: '2 4' })
export const chartAxis = style({ stroke: tone.ruleStrong, strokeWidth: 1 })

export const chartLine = style({
  fill: 'none',
  stroke: vars.color.ink,
  strokeWidth: 1.6,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  opacity: 0.55,
})

export const chartAvg = style({
  stroke: vars.color.accent,
  strokeWidth: 1.2,
  strokeDasharray: '4 4',
})

export const chartDot = style({ fill: vars.color.ink })
export const chartBest = style({ fill: vars.color.accent, stroke: vars.color.paper, strokeWidth: 1.5 })

export const chartLabel = style({
  fontFamily: vars.font.mono,
  fontSize: 11,
  fill: vars.color.muted,
})

export const chartAvgLabel = style([chartLabel, { fill: vars.color.accent }])
export const chartBestLabel = style([chartLabel, { fill: vars.color.ink, fontWeight: 600 }])

export const calendarWrap = style({
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 4,
})

export const calendar = style({
  display: 'flex',
  gap: 4,
})

export const calCol = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
})

export const calHead = style({
  height: 14,
  width: 14,
  overflow: 'visible',
  whiteSpace: 'nowrap',
  fontFamily: vars.font.mono,
  fontSize: 10,
  lineHeight: '14px',
  color: vars.color.muted,
})

export const calWeekday = style({
  height: 14,
  paddingRight: 2,
  fontFamily: vars.font.mono,
  fontSize: 10,
  lineHeight: '14px',
  color: vars.color.muted,
})

export const legend = style({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 13,
  color: vars.color.muted,
})

export const legendWord = style({ margin: '0 4px' })

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
