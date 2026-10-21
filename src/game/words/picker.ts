import { unitCount } from './graphemes'

export interface PickOptions {
  minLen?: number
  maxLen?: number
  /** Avoid words starting with these characters (keeps targeting unambiguous). */
  avoidFirst?: Set<string>
}

interface Entry {
  word: string
  len: number
  first: string
}

const RECENT = 40

export class WordPicker {
  private entries: Entry[]
  private recent: string[] = []
  private rng: () => number

  constructor(words: string[], rng: () => number = Math.random) {
    this.rng = rng
    const seen = new Set<string>()
    this.entries = []
    for (const raw of words) {
      const word = raw.trim().normalize('NFC')
      if (!word || seen.has(word)) continue
      seen.add(word)
      this.entries.push({ word, len: unitCount(word), first: Array.from(word)[0] })
    }
    if (this.entries.length === 0) throw new Error('word list is empty')
  }

  get size(): number {
    return this.entries.length
  }

  pick(opts: PickOptions = {}): string {
    const { minLen = 0, maxLen = Infinity, avoidFirst } = opts
    const recent = new Set(this.recent)
    const tiers: ((e: Entry) => boolean)[] = [
      (e) => e.len >= minLen && e.len <= maxLen && !recent.has(e.word) && !avoidFirst?.has(e.first),
      (e) => e.len >= minLen && e.len <= maxLen && !avoidFirst?.has(e.first),
      (e) => e.len <= maxLen && !avoidFirst?.has(e.first),
      (e) => e.len >= minLen && e.len <= maxLen,
      () => true,
    ]
    for (const filter of tiers) {
      const pool = this.entries.filter(filter)
      if (pool.length > 0) {
        const { word } = pool[Math.floor(this.rng() * pool.length)]
        this.remember(word)
        return word
      }
    }
    return this.entries[0].word
  }

  private remember(word: string) {
    this.recent.push(word)
    if (this.recent.length > Math.min(RECENT, Math.floor(this.entries.length / 2))) this.recent.shift()
  }
}
