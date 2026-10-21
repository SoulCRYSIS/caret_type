export type KeyInput =
  | { kind: 'char'; char: string }
  | { kind: 'backspace' }
  | { kind: 'escape' }
  | { kind: 'tab'; shift: boolean }
  | { kind: 'enter' }
  | { kind: 'space' }

const IGNORED_ROLES = new Set(['listbox', 'option', 'combobox', 'menu', 'menuitem', 'dialog', 'slider'])

/** Keys typed into form controls or open menus must not reach the game. */
export function isUiTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.closest('[data-no-game-keys]')) return true
  const role = target.getAttribute('role')
  return role !== null && IGNORED_ROLES.has(role)
}

export function normalizeKey(e: KeyboardEvent): KeyInput | null {
  if (e.isComposing) return null
  if (e.metaKey || e.ctrlKey) return null
  switch (e.key) {
    case 'Escape':
      return { kind: 'escape' }
    case 'Tab':
      return { kind: 'tab', shift: e.shiftKey }
    case 'Backspace':
      return { kind: 'backspace' }
    case 'Enter':
      return { kind: 'enter' }
    case ' ':
      return { kind: 'space' }
  }
  if (e.repeat) return null
  const chars = Array.from(e.key)
  if (chars.length !== 1) return null
  return { kind: 'char', char: e.key.normalize('NFC') }
}
