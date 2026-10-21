import { create } from 'zustand'

export type GamePhase = 'idle' | 'playing' | 'paused' | 'over'

interface GameUi {
  phase: GamePhase
  /** Mouse moved recently: briefly reveal chrome during play. */
  peek: boolean
  setPhase: (phase: GamePhase) => void
  setPeek: (peek: boolean) => void
}

export const useGameUi = create<GameUi>((set) => ({
  phase: 'idle',
  peek: false,
  setPhase: (phase) => set({ phase, peek: false }),
  setPeek: (peek) => set({ peek }),
}))

/** Chrome (nav, footer, config) is hidden while typing. */
export function useFocusMode(): boolean {
  return useGameUi((s) => s.phase === 'playing' && !s.peek)
}
