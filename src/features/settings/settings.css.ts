import { style } from '@vanilla-extract/css'
import { ease, tone, vars } from '../../theme/contract.css'

export const swatches = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))',
  gap: 10,
})

export const swatch = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 2,
  padding: '10px 12px 8px',
  borderRadius: 2,
  border: `1px solid ${tone.rule}`,
  textAlign: 'left',
  transition: `transform .18s ${ease.spring}, box-shadow .18s`,
  selectors: {
    '&:hover': { transform: 'rotate(-1.2deg) translateY(-2px)', boxShadow: `3px 4px 0 ${tone.shadow}` },
    '&[aria-pressed="true"]': { boxShadow: `0 0 0 2px ${vars.color.accent}` },
  },
})

export const swatchGlyph = style({
  fontFamily: vars.font.display,
  fontSize: 26,
  lineHeight: 1,
  fontWeight: 600,
})

export const swatchName = style({
  fontFamily: vars.font.mono,
  fontSize: 10,
  letterSpacing: '.04em',
  opacity: 0.75,
})

export const swatchDot = style({
  position: 'absolute',
  right: 10,
  top: 12,
  width: 9,
  height: 9,
  borderRadius: '50%',
})

export const customGrid = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  alignItems: 'center',
  gap: '8px 14px',
  marginTop: 12,
})

export const colorInput = style({
  width: 34,
  height: 24,
  padding: 0,
  border: `1px solid ${tone.ruleStrong}`,
  borderRadius: 2,
  background: 'none',
  cursor: 'pointer',
  selectors: {
    '&::-webkit-color-swatch-wrapper': { padding: 2 },
    '&::-webkit-color-swatch': { border: 'none', borderRadius: 1 },
  },
})

export const colorRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: vars.font.mono,
  fontSize: 12,
  color: vars.color.muted,
})

export const page = style({
  maxWidth: 760,
  margin: '0 auto',
  padding: '110px 24px 120px',
})

export const heading = style({
  fontFamily: vars.font.display,
  fontSize: 44,
  fontWeight: 400,
  fontStyle: 'italic',
  letterSpacing: '-0.02em',
  marginBottom: 6,
})

export const sub = style({
  color: vars.color.muted,
  marginBottom: 40,
})

export const section = style({
  display: 'grid',
  gridTemplateColumns: '160px 1fr',
  gap: 24,
  padding: '24px 0',
  borderTop: `1px solid ${tone.rule}`,
  '@media': { 'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' } },
})

export const sectionTitle = style({
  margin: 0,
  fontSize: 15,
  fontWeight: 400,
  fontVariant: 'small-caps',
  letterSpacing: '0.08em',
  color: vars.color.muted,
  paddingTop: 2,
})

export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  alignItems: 'flex-start',
})

export const range = style({
  width: 200,
  accentColor: vars.color.accent,
})
