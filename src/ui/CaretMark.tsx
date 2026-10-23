import type { SVGProps } from 'react'
import { vars } from '../theme/contract.css'
import { MARK_CHEVRON, MARK_DOT, MARK_STROKE, MARK_VIEWBOX } from '../theme/mark'

/** The caret mark. The chevron takes `currentColor`; the dot defaults to the accent. */
export function CaretMark({ dot = vars.color.accent, ...props }: SVGProps<SVGSVGElement> & { dot?: string }) {
  return (
    <svg viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`} aria-hidden {...props}>
      <path d={MARK_CHEVRON} fill="none" stroke="currentColor" strokeWidth={MARK_STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <circle {...MARK_DOT} fill={dot} />
    </svg>
  )
}
