export type LanguageId = 'en' | 'en-mid' | 'en-adv' | 'en-punct' | 'numbers' | 'code-js' | 'code-py' | 'th' | 'th-mid' | 'th-punct'

/** Difficulty sets the pace and how crowded the page is. It never decides which words appear. */
export type Tier = 'easy' | 'medium' | 'hard' | 'expert'

export interface Language {
  id: LanguageId
  name: string
  /** Shown beside the name in pickers. */
  hint: string
  /** Word shown on the idle screen. */
  startWord: string
  script: 'latin' | 'thai'
  /**
   * Word length (in typed characters) a run starts with: the shortest and longest word of
   * wave 1. The longest grows slowly with the waves. This is what makes "English" feel
   * different from "English advanced", so difficulty tiers leave it alone.
   */
  len: [min: number, max: number]
  /** Where the words come from. */
  words: { file: string; dress?: boolean } | { generate: 'numbers' }
}

export const LANGUAGES: Language[] = [
  { id: 'en', name: 'English', hint: 'common words', startWord: 'begin', script: 'latin', len: [2, 4], words: { file: 'en' } },
  { id: 'en-mid', name: 'English intermediate', hint: 'longer words', startWord: 'writing', script: 'latin', len: [5, 8], words: { file: 'en-mid' } },
  { id: 'en-adv', name: 'English advanced', hint: 'long & rare', startWord: 'beginning', script: 'latin', len: [8, 11], words: { file: 'en-adv' } },
  { id: 'en-punct', name: 'English punctuation', hint: 'capitals, commas, quotes', startWord: 'begin.', script: 'latin', len: [3, 6], words: { file: 'en-punct', dress: true } },
  { id: 'numbers', name: 'Numbers', hint: 'digits only', startWord: '2026', script: 'latin', len: [1, 3], words: { generate: 'numbers' } },
  { id: 'code-js', name: 'JavaScript', hint: 'keywords & syntax', startWord: 'const', script: 'latin', len: [3, 7], words: { file: 'code-js' } },
  { id: 'code-py', name: 'Python', hint: 'keywords & syntax', startWord: 'def', script: 'latin', len: [3, 7], words: { file: 'code-py' } },
  { id: 'th', name: 'Thai', hint: 'ไทย · common words', startWord: 'เริ่ม', script: 'thai', len: [3, 4], words: { file: 'th' } },
  { id: 'th-mid', name: 'Thai intermediate', hint: 'ไทย · longer words', startWord: 'เริ่มต้น', script: 'thai', len: [7, 10], words: { file: 'th-mid' } },
  { id: 'th-punct', name: 'Thai punctuation', hint: 'ไทย · marks & quotes', startWord: 'เริ่ม!', script: 'thai', len: [3, 6], words: { file: 'th-punct', dress: true } },
]

export const TIERS: { id: Tier; name: string; hint: string }[] = [
  { id: 'easy', name: 'easy', hint: 'relaxed pace' },
  { id: 'medium', name: 'medium', hint: 'steady pace' },
  { id: 'hard', name: 'hard', hint: 'quick, crowded' },
  { id: 'expert', name: 'expert', hint: 'relentless' },
]

export function getLanguage(id: string): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0]
}

export const isLanguageId = (v: unknown): v is LanguageId => LANGUAGES.some((l) => l.id === v)
