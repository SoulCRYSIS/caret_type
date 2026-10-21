import { globalStyle } from '@vanilla-extract/css'
import { tone, vars } from './contract.css'

const grain =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })

globalStyle('html, body, #root', { height: '100%', margin: 0 })

globalStyle('html', {
  background: vars.color.paper,
  color: vars.color.ink,
})

globalStyle('html[data-ready="true"]', {
  transition: 'background-color .4s ease, color .4s ease',
})

globalStyle('body', {
  fontFamily: vars.font.display,
  fontSize: 16,
  lineHeight: 1.5,
  fontVariationSettings: "'opsz' 14",
  WebkitFontSmoothing: 'antialiased',
  textRendering: 'optimizeLegibility',
  overflowX: 'hidden',
})

globalStyle('body::after', {
  content: '""',
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage: grain,
  opacity: 0.075,
  zIndex: 1000,
})

globalStyle('html[data-dark="true"] body::after', { opacity: 0.12, mixBlendMode: 'screen', filter: 'invert(1)' })

globalStyle('::selection', { background: tone.accentWash, color: vars.color.ink })

globalStyle('button', {
  font: 'inherit',
  color: 'inherit',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
})

globalStyle('a', { color: 'inherit' })

globalStyle(':focus-visible', {
  outline: `1.5px dashed ${vars.color.accent}`,
  outlineOffset: 3,
})

globalStyle('input, select', { font: 'inherit', color: 'inherit' })

globalStyle('h1, h2, h3, p', { margin: 0 })
