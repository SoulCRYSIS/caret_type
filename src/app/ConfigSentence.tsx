import { MODES } from '../game/modes/registry'
import { LANGUAGES, TIERS, type LanguageId, type Tier } from '../game/words/languages'
import { useSettings } from '../features/settings/settingsStore'
import { Select } from '../ui'

/** Run options written as a sentence with fill-in blanks. */
export function ConfigSentence() {
  const { modeId, language, tier, set } = useSettings()
  return (
    <>
      <span>play</span>
      <Select ariaLabel="mode" value={modeId} onChange={(v) => set({ modeId: v })} options={MODES.map((m) => ({ value: m.id, label: m.name }))} />
      <span>in</span>
      <Select<LanguageId>
        ariaLabel="language"
        value={language}
        onChange={(v) => set({ language: v })}
        options={LANGUAGES.map((l) => ({ value: l.id, label: l.name.toLowerCase(), hint: l.native !== l.name ? l.native : undefined }))}
      />
      <span>at</span>
      <Select<Tier> ariaLabel="difficulty" value={tier} onChange={(v) => set({ tier: v })} options={TIERS.map((t) => ({ value: t.id, label: t.name, hint: t.hint }))} />
    </>
  )
}
