import { describe, expect, it } from 'vitest'
import { clusters, unitCount, WordMatcher } from './graphemes'
import { WordPicker } from './picker'
import { dressWord, numberWords } from './loader'
import { LANGUAGES } from './languages'

function typeAll(word: string, keys: string[]) {
  const m = new WordMatcher(word)
  const accepted = keys.map((k) => m.accept(k))
  return { m, accepted }
}

describe('WordMatcher (latin)', () => {
  it('accepts exact sequence', () => {
    const { m, accepted } = typeAll('ink', ['i', 'n', 'k'])
    expect(accepted).toEqual([true, true, true])
    expect(m.done).toBe(true)
    expect(m.typedClusters).toBe(3)
  })

  it('rejects wrong characters without advancing', () => {
    const m = new WordMatcher('cat')
    expect(m.accept('c')).toBe(true)
    expect(m.accept('x')).toBe(false)
    expect(m.typed).toBe(1)
    expect(m.next).toBe('a')
  })

  it('is case-sensitive', () => {
    expect(new WordMatcher('Paris').accept('p')).toBe(false)
  })
})

describe('WordMatcher (thai)', () => {
  // ที่ = ท + ี (sara ii) + ่ (mai ek)
  const thi = 'ที่'

  it('groups combining marks into one cluster', () => {
    expect(clusters(thi)).toEqual([['ท', 'ี', '่']])
    expect(unitCount(thi)).toBe(3)
  })

  it('accepts canonical order', () => {
    const { m, accepted } = typeAll(thi, ['ท', 'ี', '่'])
    expect(accepted).toEqual([true, true, true])
    expect(m.done).toBe(true)
  })

  it('accepts tone mark before upper vowel', () => {
    const { m, accepted } = typeAll(thi, ['ท', '่', 'ี'])
    expect(accepted).toEqual([true, true, true])
    expect(m.done).toBe(true)
  })

  it('requires base consonant first', () => {
    const m = new WordMatcher(thi)
    expect(m.accept('ี')).toBe(false)
    expect(m.typed).toBe(0)
  })

  it('handles preposed vowels and sara am', () => {
    // เริ่ม: เ | ริ่ | ม
    expect(clusters('เริ่ม').map((c) => c.join(''))).toEqual(['เ', 'ริ่', 'ม'])
    const word = 'น้ำ'
    expect(clusters(word)).toHaveLength(1)
    const { m } = typeAll(word, ['น', 'ำ', '้'])
    expect(m.done).toBe(true)
  })

  it('reports partial cluster progress', () => {
    const m = new WordMatcher('เริ่ม')
    m.accept('เ')
    m.accept('ร')
    expect(m.typedClusters).toBe(1)
    m.accept('ิ')
    m.accept('่')
    expect(m.typedClusters).toBe(2)
  })
})

describe('WordPicker', () => {
  it('respects length bounds and avoided first letters', () => {
    const p = new WordPicker(['a', 'bb', 'ccc', 'dddd', 'bbbb'])
    for (let i = 0; i < 20; i++) {
      const w = p.pick({ minLen: 3, maxLen: 4, avoidFirst: new Set(['b']) })
      expect(['ccc', 'dddd']).toContain(w)
    }
  })

  it('falls back when nothing matches', () => {
    const p = new WordPicker(['aa'])
    expect(p.pick({ minLen: 10 })).toBe('aa')
  })

  it('dedupes and rejects empty lists', () => {
    expect(new WordPicker(['x', 'x', ' x ']).size).toBe(1)
    expect(() => new WordPicker([])).toThrow()
  })
})

describe('languages', () => {
  it('have unique ids, safe for board names and security rules', () => {
    const ids = LANGUAGES.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/)
  })

  it('generates digit strings across every length', () => {
    const words = numberWords(20, () => 0.5)
    for (const w of words) expect(w).toMatch(/^[1-9][0-9]*$/)
    expect(new Set(words.map((w) => w.length))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
  })
})

describe('dressWord', () => {
  it('keeps the word recognizable', () => {
    for (let i = 0; i < 50; i++) {
      expect(dressWord('paper', 'en').toLowerCase()).toContain('paper')
      expect(dressWord('กระดาษ', 'th')).toContain('กระดาษ')
    }
  })
})
