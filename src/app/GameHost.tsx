import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { isUiTarget, normalizeKey } from '../game/engine/input'
import { GameSession } from '../game/engine/session'
import { synth } from '../game/juice/juice'
import { getMode } from '../game/modes/registry'
import type { RunResult } from '../game/modes/types'
import { getLanguage } from '../game/words/languages'
import { loadWords } from '../game/words/loader'
import { WordPicker } from '../game/words/picker'
import * as enemyCss from '../game/modes/ink-invaders/view.css'
import { recordRun, type Recorded } from '../features/results/recordRun'
import { ResultSheet } from '../features/results/ResultSheet'
import { PalettePicker } from '../features/settings/PalettePicker'
import { useSettings } from '../features/settings/settingsStore'
import { Button, Kbd } from '../ui'
import { ConfigSentence } from './ConfigSentence'
import { useGameUi } from './gameUiStore'
import * as css from './play.css'

function ModeView({ session }: { session: GameSession }) {
  const version = useSyncExternalStore(session.subscribe, session.getVersion)
  const View = session.mode.render
  return <View state={session.state} ctx={session.ctx} version={version} />
}

function IdleCard({ ready, error }: { ready: boolean; error: boolean }) {
  const language = useSettings((s) => s.language)
  const modeId = useSettings((s) => s.modeId)
  const lang = getLanguage(language)
  return (
    <div className={css.idle}>
      <div className={css.idleStamp}>
        <span className={enemyCss.stamp} lang={language} style={{ fontSize: 30, padding: '10px 20px 12px', animation: 'none' }}>
          <span className={enemyCss.frame} aria-hidden />
          {lang.startWord}
        </span>
      </div>
      <h1 className={css.idleTitle}>
        type any key to begin
        <span className={css.caret} aria-hidden />
      </h1>
      <p className={css.blurb}>{getMode(modeId).blurb}</p>
      <div className={css.idleHint}>
        {error ? (
          <span>couldn't load the word list — check your connection</span>
        ) : ready ? (
          <>
            <span>
              <Kbd>tab</Kbd> restart anytime
            </span>
            <span>
              <Kbd>esc</Kbd> pause / drop target
            </span>
          </>
        ) : (
          <span>inking the words…</span>
        )}
      </div>
    </div>
  )
}

function PauseMenu(props: { onResume: () => void; onRestart: () => void; onQuit: () => void }) {
  return (
    <div className={css.sheet} role="dialog" aria-label="paused" data-no-game-keys>
      <h2 className={css.sheetTitle}>paused</h2>
      <div className={css.row}>
        <ConfigSentence />
      </div>
      <div style={{ marginTop: 20 }}>
        <PalettePicker showCustom={false} />
      </div>
      <div className={css.actions}>
        <Button variant="accent" onClick={props.onResume}>
          resume <Kbd>esc</Kbd>
        </Button>
        <Button variant="stamp" onClick={props.onRestart}>
          new run <Kbd>tab</Kbd>
        </Button>
        <Button variant="quiet" onClick={props.onQuit}>
          end run
        </Button>
      </div>
    </div>
  )
}

export function GameHost() {
  const modeId = useSettings((s) => s.modeId)
  const language = useSettings((s) => s.language)
  const tier = useSettings((s) => s.tier)
  const sound = useSettings((s) => s.sound)
  const volume = useSettings((s) => s.volume)
  const shake = useSettings((s) => s.shake)
  const particles = useSettings((s) => s.particles)
  const phase = useGameUi((s) => s.phase)
  const setPhase = useGameUi((s) => s.setPhase)
  const setPeek = useGameUi((s) => s.setPeek)

  const stageRef = useRef<HTMLDivElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sessionRef = useRef<GameSession | null>(null)
  const overAt = useRef(0)
  const [session, setSession] = useState<GameSession | null>(null)
  const [words, setWords] = useState<string[] | null>(null)
  const [wordsError, setWordsError] = useState(false)
  const [result, setResult] = useState<{ run: RunResult; recorded: Recorded } | null>(null)

  useEffect(() => {
    let alive = true
    setWords(null)
    setWordsError(false)
    loadWords(language, tier)
      .then((w) => alive && setWords(w))
      .catch(() => alive && setWordsError(true))
    return () => {
      alive = false
    }
  }, [language, tier])

  const endSession = useCallback(() => {
    sessionRef.current?.destroy()
    sessionRef.current = null
    setSession(null)
  }, [])

  const start = useCallback(() => {
    if (!words || !stageRef.current || !shakeRef.current || !canvasRef.current) return
    endSession()
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    synth.unlock()
    const { sound, volume, shake, particles } = useSettings.getState()
    const s = new GameSession({
      mode: getMode(modeId),
      words: new WordPicker(words),
      language,
      tier,
      playfield: stageRef.current,
      canvas: canvasRef.current,
      shakeEl: shakeRef.current,
      juice: { sound, volume, shake, particles },
      onOver: (run) => {
        overAt.current = performance.now()
        setResult({ run, recorded: recordRun(run) })
        useGameUi.getState().setPhase('over')
      },
    })
    sessionRef.current = s
    setSession(s)
    setResult(null)
    setPhase('playing')
    s.start()
  }, [words, modeId, language, tier, endSession, setPhase])

  const pause = useCallback(() => {
    if (useGameUi.getState().phase !== 'playing') return
    sessionRef.current?.pause()
    setPhase('paused')
  }, [setPhase])

  const resume = useCallback(() => {
    sessionRef.current?.resume()
    setPhase('playing')
  }, [setPhase])

  const quit = useCallback(() => {
    endSession()
    setPhase('idle')
  }, [endSession, setPhase])

  // Changing what to play abandons the current run.
  useEffect(() => {
    if (sessionRef.current && useGameUi.getState().phase !== 'over') quit()
  }, [modeId, language, tier, quit])

  useEffect(() => {
    sessionRef.current?.juice.apply({ sound, volume, shake, particles })
    synth.enabled = sound
    synth.setVolume(volume)
  }, [sound, volume, shake, particles, session])

  useEffect(() => () => {
    sessionRef.current?.destroy()
    useGameUi.getState().setPhase('idle')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = normalizeKey(e)
      if (!k) return
      const current = useGameUi.getState().phase
      const inPopper = e.target instanceof HTMLElement && e.target.closest('[data-radix-popper-content-wrapper]')
      if (isUiTarget(e.target) && (inPopper || !(current === 'paused' && (k.kind === 'escape' || k.kind === 'tab')))) return

      if (k.kind === 'tab') {
        if (k.shift) return
        e.preventDefault()
        start()
        return
      }
      switch (current) {
        case 'idle':
          if (k.kind === 'char' || k.kind === 'enter' || k.kind === 'space') {
            e.preventDefault()
            start()
          }
          break
        case 'playing': {
          const s = sessionRef.current
          if (!s) return
          if (k.kind !== 'escape') e.preventDefault()
          setPeek(false)
          if (!s.key(k) && k.kind === 'escape') pause()
          break
        }
        case 'paused':
          if (k.kind === 'escape' || k.kind === 'enter') {
            e.preventDefault()
            resume()
          }
          break
        case 'over':
          if (performance.now() - overAt.current < 600) return
          if (k.kind === 'enter') {
            e.preventDefault()
            start()
          } else if (k.kind === 'escape') {
            setResult(null)
            quit()
          }
          break
      }
    }
    const onBlur = () => pause()
    const onVisibility = () => document.hidden && pause()
    window.addEventListener('keydown', onKey)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [start, pause, resume, quit, setPeek])

  return (
    <>
      <div className={`${css.stage} ${css.dimmed}`} ref={stageRef} data-phase={phase}>
        <div className={css.shake} ref={shakeRef}>
          <canvas className={css.fx} ref={canvasRef} />
          {session && <ModeView session={session} />}
        </div>
      </div>

      <div className={css.config} data-hidden={phase !== 'idle'}>
        <ConfigSentence />
      </div>

      {phase === 'idle' && (
        <div className={css.overlay}>
          <IdleCard ready={!!words} error={wordsError} />
        </div>
      )}
      {phase === 'paused' && (
        <div className={css.overlay}>
          <PauseMenu onResume={resume} onRestart={start} onQuit={quit} />
        </div>
      )}
      {phase === 'over' && result && (
        <div className={css.overlay}>
          <ResultSheet run={result.run} recorded={result.recorded} />
        </div>
      )}
    </>
  )
}
