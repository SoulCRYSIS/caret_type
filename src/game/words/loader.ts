import { getLanguage, type LanguageId } from './languages'

const cache = new Map<string, Promise<string[]>>()

function fetchList(file: string): Promise<string[]> {
  let p = cache.get(file)
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}words/${file}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`failed to load words ${file}`)
        return r.json() as Promise<string[]>
      })
      .catch((err) => {
        cache.delete(file)
        throw err
      })
    cache.set(file, p)
  }
  return p
}

const PUNCT_EN = [',', '.', ';', ':', '!', '?']
const PUNCT_TH = ['!', '?', '.', 'ๆ']

/** Punctuation languages: plain words dressed with capitals, marks, quotes and brackets. */
export function dressWord(word: string, lang: LanguageId, rng: () => number = Math.random): string {
  const r = rng()
  if (getLanguage(lang).script === 'latin') {
    if (r < 0.25) return word[0].toUpperCase() + word.slice(1)
    if (r < 0.55) return word + PUNCT_EN[Math.floor(rng() * PUNCT_EN.length)]
    if (r < 0.65) return `"${word}"`
    if (r < 0.72) return `(${word})`
    return word
  }
  if (r < 0.45) return word + PUNCT_TH[Math.floor(rng() * PUNCT_TH.length)]
  if (r < 0.55) return `"${word}"`
  return word
}

/** Digit strings of every length from one to ten, so short and long numbers both turn up. */
export function numberWords(perLength = 60, rng: () => number = Math.random): string[] {
  const out: string[] = []
  for (let len = 1; len <= 10; len++) {
    for (let i = 0; i < perLength; i++) {
      let s = String(1 + Math.floor(rng() * 9))
      while (s.length < len) s += Math.floor(rng() * 10)
      out.push(s)
    }
  }
  return out
}

const PLAIN = /^[\p{L}\p{M}]+$/u

export async function loadWords(lang: LanguageId): Promise<string[]> {
  const { words } = getLanguage(lang)
  if ('generate' in words) return numberWords()
  const list = await fetchList(words.file)
  // entries that already carry their own marks (don't, e.g., ฯลฯ) are left as written
  return words.dress ? list.map((w) => (PLAIN.test(w) ? dressWord(w, lang) : w)) : list
}

export function prefetchWords(lang: LanguageId): void {
  loadWords(lang).catch(() => {})
}
