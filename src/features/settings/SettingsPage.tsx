import { Check, Kbd } from '../../ui'
import { ConfigSentence } from '../../app/ConfigSentence'
import { prefersReducedMotion } from '../../game/juice/juice'
import { PalettePicker } from './PalettePicker'
import { DEFAULT_SETTINGS, useSettings } from './settingsStore'
import * as css from './settings.css'

export default function SettingsPage() {
  const s = useSettings()
  const reduced = prefersReducedMotion()

  return (
    <div className={css.page}>
      <h1 className={css.heading}>settings</h1>
      <p className={css.sub}>Saved on this device, and to your account when signed in.</p>

      <section className={css.section}>
        <h2 className={css.sectionTitle}>default run</h2>
        <div className={css.stack} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, fontSize: 17 }}>
          <ConfigSentence />
        </div>
      </section>

      <section className={css.section}>
        <h2 className={css.sectionTitle}>palette</h2>
        <PalettePicker />
      </section>

      <section className={css.section}>
        <h2 className={css.sectionTitle}>feel</h2>
        <div className={css.stack}>
          <Check checked={s.sound} onChange={(v) => s.set({ sound: v })}>
            sound
          </Check>
          <label className={css.colorRow}>
            <span className={css.rangeName}>effects</span>
            <input
              className={css.range}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={s.volume}
              disabled={!s.sound}
              aria-label="effects volume"
              onChange={(e) => s.set({ volume: Number(e.target.value) })}
            />
            <span>{Math.round(s.volume * 100)}</span>
          </label>
          <Check checked={s.music} onChange={(v) => s.set({ music: v })}>
            music
          </Check>
          <label className={css.colorRow}>
            <span className={css.rangeName}>music</span>
            <input
              className={css.range}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={s.musicVolume}
              disabled={!s.music}
              aria-label="music volume"
              onChange={(e) => s.set({ musicVolume: Number(e.target.value) })}
            />
            <span>{Math.round(s.musicVolume * 100)}</span>
          </label>
          <Check checked={s.shake} onChange={(v) => s.set({ shake: v })}>
            screen shake{reduced ? ' (off: your system prefers reduced motion)' : ''}
          </Check>
          <Check checked={s.particles} onChange={(v) => s.set({ particles: v })}>
            ink splatter &amp; stains
          </Check>
        </div>
      </section>

      <section className={css.section}>
        <h2 className={css.sectionTitle}>keys</h2>
        <div className={css.stack}>
          <span>
            <Kbd>tab</Kbd> start a new run, at any time
          </span>
          <span>
            <Kbd>esc</Kbd> drop the current target, or pause
          </span>
          <span>
            <Kbd>&#9003;</Kbd> drop the current target
          </span>
          <span>
            <Kbd>enter</Kbd> resume, or retry after a run
          </span>
        </div>
      </section>

      <section className={css.section}>
        <h2 className={css.sectionTitle}>reset</h2>
        <div className={css.stack}>
          <button type="button" className={css.colorRow} onClick={() => s.set({ ...DEFAULT_SETTINGS })}>
            restore default settings
          </button>
        </div>
      </section>
    </div>
  )
}
