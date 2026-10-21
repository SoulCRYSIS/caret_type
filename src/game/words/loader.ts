import type { LanguageId, Tier } from './languages'

const cache = new Map<string, Promise<string[]>>()

function fetchList(lang: LanguageId, file: string): Promise<string[]> {
  const key = `${lang}/${file}`
  let p = cache.get(key)
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}words/${lang}/${file}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`failed to load words ${key}`)
        return r.json() as Promise<string[]>
      })
      .catch((err) => {
        cache.delete(key)
        throw err
      })
    cache.set(key, p)
  }
  return p
}

const PUNCT_EN = [',', '.', ';', ':', '!', '?']
const PUNCT_TH = ['!', '?', '.', 'ๆ']

/** Expert words: the curated expert list plus hard words dressed with punctuation, capitals and quotes. */
export function dressWord(word: string, lang: LanguageId, rng: () => number = Math.random): string {
  const r = rng()
  if (lang === 'en') {
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

export async function loadWords(lang: LanguageId, tier: Tier): Promise<string[]> {
  if (tier !== 'expert') return fetchList(lang, tier)
  const [expert, hard] = await Promise.all([fetchList(lang, 'expert'), fetchList(lang, 'hard')])
  return [...expert, ...hard.map((w) => dressWord(w, lang))]
}

export function prefetchWords(lang: LanguageId, tier: Tier): void {
  loadWords(lang, tier).catch(() => {})
}
