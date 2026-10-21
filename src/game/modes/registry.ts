import { inkInvaders } from './ink-invaders/mode'
import type { AnyGameMode } from './types'

export const MODES: AnyGameMode[] = [inkInvaders]

export function getMode(id: string): AnyGameMode {
  return MODES.find((m) => m.id === id) ?? MODES[0]
}
