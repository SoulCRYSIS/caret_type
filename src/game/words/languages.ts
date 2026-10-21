export type LanguageId = 'en' | 'th'
export type Tier = 'easy' | 'medium' | 'hard' | 'expert'

export interface Language {
  id: LanguageId
  name: string
  native: string
  /** Word shown on the idle screen. */
  startWord: string
}

export const LANGUAGES: Language[] = [
  { id: 'en', name: 'English', native: 'English', startWord: 'begin' },
  { id: 'th', name: 'Thai', native: 'ไทย', startWord: 'เริ่ม' },
]

export const TIERS: { id: Tier; name: string; hint: string }[] = [
  { id: 'easy', name: 'easy', hint: 'short & common' },
  { id: 'medium', name: 'medium', hint: 'everyday words' },
  { id: 'hard', name: 'hard', hint: 'long words' },
  { id: 'expert', name: 'expert', hint: 'punctuation & numbers' },
]

export function getLanguage(id: LanguageId): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0]
}
