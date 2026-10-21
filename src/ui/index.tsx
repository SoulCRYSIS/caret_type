import * as RSelect from '@radix-ui/react-select'
import * as RToggle from '@radix-ui/react-toggle'
import * as RTooltip from '@radix-ui/react-tooltip'
import * as RPopover from '@radix-ui/react-popover'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import * as s from './ui.css'

type Variant = keyof typeof s.button

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  function Button({ variant = 'link', className, ...rest }, ref) {
    return <button ref={ref} type="button" className={[s.button[variant], className].filter(Boolean).join(' ')} {...rest} />
  },
)

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={s.kbd}>{children}</kbd>
}

export function Label({ children }: { children: ReactNode }) {
  return <span className={s.label}>{children}</span>
}

export function Rule() {
  return <hr className={s.rule} />
}

export interface SelectOption<T extends string> {
  value: T
  label: string
  hint?: string
  disabled?: boolean
}

export function Select<T extends string>(props: {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
}) {
  const current = props.options.find((o) => o.value === props.value)
  return (
    <RSelect.Root value={props.value} onValueChange={(v) => props.onChange(v as T)}>
      <RSelect.Trigger className={s.selectTrigger} aria-label={props.ariaLabel} data-no-game-keys>
        <RSelect.Value>{current?.label}</RSelect.Value>
        <RSelect.Icon className={s.selectCaret}>&#9662;</RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content className={s.slip} position="popper" sideOffset={6} data-no-game-keys>
          <RSelect.Viewport>
            {props.options.map((o) => (
              <RSelect.Item key={o.value} value={o.value} disabled={o.disabled} className={s.selectItem}>
                <RSelect.ItemIndicator className={s.selectIndicator}>&#10022;</RSelect.ItemIndicator>
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
                {o.hint && <span className={s.selectItemHint}>{o.hint}</span>}
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}

export function Check(props: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <RToggle.Root pressed={props.checked} onPressedChange={props.onChange} className={s.check}>
      <span className={s.checkBox}>
        <svg className={s.checkMark} viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 14 L11 19 L22 5" />
        </svg>
      </span>
      {props.children}
    </RToggle.Root>
  )
}

export function Tip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <RTooltip.Root delayDuration={250}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content className={s.tooltip} sideOffset={6}>
          {content}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  )
}

export const TipProvider = RTooltip.Provider

export function Popover(props: {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <RPopover.Root open={props.open} onOpenChange={props.onOpenChange}>
      <RPopover.Trigger asChild>{props.trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content className={s.popover} align={props.align ?? 'end'} side={props.side ?? 'bottom'} sideOffset={8} data-no-game-keys>
          {props.children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  )
}
