import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AccountMenu, NamePrompt, VerifyNotice } from '../features/auth/AuthControls'
import { PalettePicker } from '../features/settings/PalettePicker'
import { useSettings } from '../features/settings/settingsStore'
import { StreakMark } from '../features/streak/StreakMark'
import { PALETTES, CUSTOM_PALETTE_ID } from '../theme/palettes'
import { Button, Kbd, Popover } from '../ui'
import { CaretMark } from '../ui/CaretMark'
import * as ui from '../ui/ui.css'
import { useFocusMode, useGameUi } from './gameUiStore'
import * as css from './layout.css'

function usePeekOnMouseMove() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let lastX = -1
    let lastY = -1
    const onMove = (e: MouseEvent) => {
      if (Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) < 6) return
      lastX = e.clientX
      lastY = e.clientY
      const ui = useGameUi.getState()
      if (ui.phase !== 'playing') return
      ui.setPeek(true)
      clearTimeout(timer)
      timer = setTimeout(() => useGameUi.getState().setPeek(false), 1800)
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])
}

function PaletteQuick() {
  const paletteId = useSettings((s) => s.paletteId)
  const name = paletteId === CUSTOM_PALETTE_ID ? 'your own' : (PALETTES.find((p) => p.id === paletteId)?.name ?? 'paper')
  return (
    <Popover side="top" trigger={<Button variant="quiet">palette · {name.toLowerCase()}</Button>}>
      <div style={{ width: 360, maxWidth: '80vw' }}>
        <PalettePicker />
      </div>
    </Popover>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const hidden = useFocusMode()
  const onPlay = useLocation().pathname === '/'
  const phase = useGameUi((s) => s.phase)
  const solid = !onPlay || phase === 'over'
  usePeekOnMouseMove()

  return (
    <>
      <header className={css.header} data-hidden={hidden} data-solid={solid}>
        <Link to="/" className={css.wordmark} aria-label="caret — play">
          <CaretMark className={css.wordmarkMark} />
        </Link>
        <nav className={css.nav}>
          <StreakMark />
          <span className={css.sep} />
          <NavLink to="/leaderboard" className={ui.button.link}>
            standings
          </NavLink>
          <NavLink to="/profile" className={ui.button.link}>
            record
          </NavLink>
          <NavLink to="/settings" className={ui.button.link}>
            settings
          </NavLink>
          <AccountMenu />
        </nav>
      </header>

      {!hidden && <VerifyNotice />}
      <main className={css.main}>{children}</main>
      <NamePrompt />

      <footer className={css.footer} data-hidden={hidden} data-solid={solid}>
        <div className={css.hints} data-hidden={onPlay && phase === 'over'}>
          <span className={css.hint}>
            <Kbd>tab</Kbd> new run
          </span>
          <span className={css.hint}>
            <Kbd>esc</Kbd> pause
          </span>
          <span className={css.hint}>
            <Kbd>&#9003;</Kbd> drop target
          </span>
        </div>
        <div className={css.footRight}>
          <PaletteQuick />
        </div>
      </footer>
      <p className={css.touchNote}>caret is played with a physical keyboard.</p>
    </>
  )
}
