const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/** Split a word into grapheme clusters, each as its list of code points. */
export function clusters(word: string): string[][] {
  const out: string[][] = []
  for (const { segment } of segmenter.segment(word.normalize('NFC'))) out.push(Array.from(segment))
  return out
}

export function unitCount(word: string): number {
  return Array.from(word.normalize('NFC')).length
}

/**
 * Tracks typing progress through a word.
 *
 * Each grapheme cluster must start with its base character, but the combining
 * marks that follow may be typed in any order. Thai typists often enter a tone
 * mark before an upper vowel (ท ่ ี vs ท ี ่); both render identically.
 */
export class WordMatcher {
  readonly word: string
  readonly clusters: string[][]
  readonly length: number
  private ci = 0
  private remaining: string[]
  private consumed = 0

  constructor(word: string) {
    this.word = word.normalize('NFC')
    this.clusters = clusters(this.word)
    this.length = this.clusters.reduce((n, c) => n + c.length, 0)
    this.remaining = [...(this.clusters[0] ?? [])]
  }

  /** Next code point that would be accepted first. */
  get next(): string | undefined {
    return this.remaining[0]
  }

  get typed(): number {
    return this.consumed
  }

  /** Number of fully typed clusters (for rendering). */
  get typedClusters(): number {
    return this.ci
  }

  get done(): boolean {
    return this.ci >= this.clusters.length
  }

  accept(ch: string): boolean {
    if (this.done) return false
    const cluster = this.clusters[this.ci]
    const rem = this.remaining
    if (rem.length === cluster.length) {
      if (ch !== rem[0]) return false
      rem.shift()
    } else {
      const idx = rem.indexOf(ch)
      if (idx < 0) return false
      rem.splice(idx, 1)
    }
    this.consumed++
    if (rem.length === 0) {
      this.ci++
      this.remaining = [...(this.clusters[this.ci] ?? [])]
    }
    return true
  }

  reset(): void {
    this.ci = 0
    this.consumed = 0
    this.remaining = [...(this.clusters[0] ?? [])]
  }
}
