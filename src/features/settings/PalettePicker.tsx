import { CUSTOM_PALETTE_ID, PALETTES, type PaletteColors } from '../../theme/palettes'
import { useSettings } from './settingsStore'
import * as s from './settings.css'

const COLOR_LABELS: Record<keyof PaletteColors, string> = {
  paper: 'paper',
  ink: 'ink',
  muted: 'pencil',
  accent: 'accent',
  error: 'mistake',
}

function Swatch(props: { name: string; colors: PaletteColors; active: boolean; onClick: () => void }) {
  const { colors } = props
  return (
    <button
      type="button"
      className={s.swatch}
      aria-pressed={props.active}
      onClick={props.onClick}
      style={{ background: colors.paper, color: colors.ink }}
    >
      <span className={s.swatchGlyph}>
        Aa<span style={{ color: colors.accent }}>.</span>
      </span>
      <span className={s.swatchName} style={{ color: colors.muted }}>
        {props.name.toLowerCase()}
      </span>
      <span className={s.swatchDot} style={{ background: colors.error }} />
    </button>
  )
}

export function PalettePicker({ showCustom = true }: { showCustom?: boolean }) {
  const paletteId = useSettings((st) => st.paletteId)
  const custom = useSettings((st) => st.customPalette)
  const set = useSettings((st) => st.set)

  return (
    <div>
      <div className={s.swatches}>
        {PALETTES.map((p) => (
          <Swatch key={p.id} name={p.name} colors={p.colors} active={paletteId === p.id} onClick={() => set({ paletteId: p.id })} />
        ))}
        {showCustom && (
          <Swatch name="Your own" colors={custom} active={paletteId === CUSTOM_PALETTE_ID} onClick={() => set({ paletteId: CUSTOM_PALETTE_ID })} />
        )}
      </div>
      {showCustom && paletteId === CUSTOM_PALETTE_ID && (
        <div className={s.customGrid}>
          {(Object.keys(COLOR_LABELS) as (keyof PaletteColors)[]).map((key) => (
            <label key={key} className={s.colorRow} style={{ gridColumn: '1 / -1' }}>
              <input
                type="color"
                className={s.colorInput}
                value={custom[key]}
                onChange={(e) => set({ customPalette: { ...custom, [key]: e.target.value } })}
              />
              <span>{COLOR_LABELS[key]}</span>
              <span>{custom[key]}</span>
            </label>
          ))}
          <button
            type="button"
            className={s.colorRow}
            onClick={() => set({ customPalette: { ...PALETTES[0].colors } })}
          >
            reset to paper
          </button>
        </div>
      )}
    </div>
  )
}
