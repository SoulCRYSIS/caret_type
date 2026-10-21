import { keyframes, style, styleVariants } from '@vanilla-extract/css'
import { ease, tone, vars } from '../theme/contract.css'

const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
  transition: `color .15s, background-color .15s, transform .15s ${ease.spring}, box-shadow .15s`,
  selectors: { '&:disabled': { opacity: 0.45, cursor: 'not-allowed' } },
})

export const button = styleVariants({
  link: [
    base,
    {
      fontVariant: 'small-caps',
      letterSpacing: '0.04em',
      textDecoration: 'none',
      color: vars.color.muted,
      backgroundImage: `linear-gradient(${vars.color.accent}, ${vars.color.accent})`,
      backgroundSize: '0% 1.5px',
      backgroundPosition: '0 100%',
      backgroundRepeat: 'no-repeat',
      transition: 'background-size .25s ease, color .15s',
      selectors: {
        '&:hover, &[aria-current="page"], &[data-state="open"]': {
          color: vars.color.ink,
          backgroundSize: '100% 1.5px',
        },
      },
    },
  ],
  stamp: [
    base,
    {
      padding: '8px 16px',
      border: `1.5px solid ${vars.color.ink}`,
      borderRadius: 3,
      fontFamily: vars.font.mono,
      fontSize: 14,
      letterSpacing: '0.06em',
      textTransform: 'lowercase',
      boxShadow: `3px 3px 0 ${tone.shadow}`,
      selectors: {
        '&:hover:not(:disabled)': { transform: 'translate(-1px,-1px) rotate(-.6deg)', boxShadow: `5px 5px 0 ${tone.shadow}` },
        '&:active:not(:disabled)': { transform: 'translate(2px,2px)', boxShadow: `0 0 0 ${tone.shadow}` },
      },
    },
  ],
  accent: [
    base,
    {
      padding: '9px 18px',
      background: vars.color.ink,
      color: vars.color.paper,
      borderRadius: 3,
      fontFamily: vars.font.mono,
      fontSize: 14,
      letterSpacing: '0.04em',
      boxShadow: `3px 3px 0 ${vars.color.accent}`,
      selectors: {
        '&:hover:not(:disabled)': { transform: 'translate(-1px,-1px)', boxShadow: `5px 5px 0 ${vars.color.accent}` },
        '&:active:not(:disabled)': { transform: 'translate(2px,2px)', boxShadow: `0 0 0 ${vars.color.accent}` },
      },
    },
  ],
  quiet: [
    base,
    {
      color: vars.color.muted,
      fontFamily: vars.font.mono,
      fontSize: 13,
      selectors: { '&:hover': { color: vars.color.ink } },
    },
  ],
})

export const kbd = style({
  display: 'inline-block',
  minWidth: 22,
  padding: '1px 6px 2px',
  fontFamily: vars.font.mono,
  fontSize: 11,
  lineHeight: 1.4,
  textAlign: 'center',
  color: vars.color.ink,
  border: `1px solid ${tone.ruleStrong}`,
  borderBottomWidth: 2.5,
  borderRadius: 4,
  background: tone.wash,
})

/* Select: rendered as a fill-in blank on a form */
export const selectTrigger = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 6,
  padding: '0 2px 1px',
  fontFamily: vars.font.display,
  fontStyle: 'italic',
  fontSize: 'inherit',
  color: vars.color.ink,
  borderBottom: `1.5px dotted ${tone.ruleStrong}`,
  transition: 'border-color .15s, color .15s',
  selectors: {
    '&:hover, &[data-state="open"]': { borderBottomColor: vars.color.accent, borderBottomStyle: 'solid' },
  },
})

export const selectCaret = style({
  fontStyle: 'normal',
  fontSize: '0.7em',
  color: vars.color.muted,
})

const slipIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-4px) rotate(-1deg)' },
  to: { opacity: 1, transform: 'translateY(0) rotate(0)' },
})

export const slip = style({
  zIndex: 200,
  minWidth: 'var(--radix-select-trigger-width)',
  padding: 6,
  background: vars.color.paper,
  color: vars.color.ink,
  border: `1px solid ${tone.ruleStrong}`,
  borderRadius: 2,
  boxShadow: `4px 5px 0 ${tone.shadow}`,
  animation: `${slipIn} .16s ${ease.out}`,
})

export const selectItem = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  padding: '6px 10px 6px 22px',
  fontFamily: vars.font.display,
  fontSize: 15,
  borderRadius: 2,
  cursor: 'pointer',
  outline: 'none',
  userSelect: 'none',
  selectors: {
    '&[data-highlighted]': { background: tone.wash },
    '&[data-disabled]': { opacity: 0.4, cursor: 'default' },
  },
})

export const selectItemHint = style({
  fontFamily: vars.font.mono,
  fontSize: 11,
  color: vars.color.muted,
})

export const selectIndicator = style({
  position: 'absolute',
  left: 7,
  color: vars.color.accent,
  fontSize: 13,
})

/* Ink checkbox */
export const check = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: vars.font.display,
  fontSize: 15,
  color: vars.color.ink,
  userSelect: 'none',
})

export const checkBox = style({
  position: 'relative',
  width: 18,
  height: 18,
  border: `1.5px solid ${vars.color.ink}`,
  borderRadius: 2,
  flexShrink: 0,
})

export const checkMark = style({
  position: 'absolute',
  inset: -4,
  width: 26,
  height: 26,
  color: vars.color.accent,
  strokeDasharray: 30,
  strokeDashoffset: 30,
  transition: `stroke-dashoffset .22s ${ease.out}`,
  selectors: { '[data-state="on"] &': { strokeDashoffset: 0 } },
})

export const tooltip = style({
  zIndex: 300,
  padding: '4px 8px',
  fontFamily: vars.font.mono,
  fontSize: 11,
  background: vars.color.ink,
  color: vars.color.paper,
  borderRadius: 2,
  animation: `${slipIn} .12s ${ease.out}`,
})

export const popover = style([
  slip,
  {
    minWidth: 220,
    padding: 16,
  },
])

export const rule = style({
  height: 0,
  border: 'none',
  borderTop: `1px solid ${tone.rule}`,
  margin: '16px 0',
})

export const label = style({
  fontVariant: 'small-caps',
  letterSpacing: '0.08em',
  fontSize: 13,
  color: vars.color.muted,
})
