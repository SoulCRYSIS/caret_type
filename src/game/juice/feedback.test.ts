import { afterEach, describe, expect, it, vi } from 'vitest'
import { Music } from './music'
import { Synth } from './audio'

class Param {
  value = 0
  setValueAtTime(value: number) { this.value = value }
  setTargetAtTime(value: number) { this.value = value }
  exponentialRampToValueAtTime(value: number) { this.value = value }
  linearRampToValueAtTime(value: number) { this.value = value }
  cancelScheduledValues() {}
}
class Node {
  gain = new Param()
  frequency = new Param()
  Q = new Param()
  pan = new Param()
  delayTime = new Param()
  threshold = new Param()
  ratio = new Param()
  disconnected = false
  connect(node: Node) { return node }
  disconnect() { this.disconnected = true }
}
class Source extends Node {
  stops: number[] = []
  start() {}
  stop(at: number) { this.stops.push(at) }
}
class Context {
  state = 'running'
  sampleRate = 8000
  destination = new Node()
  sources: Source[] = []
  gains: Node[] = []
  get currentTime() { return Date.now() / 1000 }
  createGain() { const node = new Node(); this.gains.push(node); return node }
  createBiquadFilter() { return new Node() }
  createDelay() { return new Node() }
  createStereoPanner() { return new Node() }
  createDynamicsCompressor() { return new Node() }
  createBuffer() { return { getChannelData: () => new Float32Array(4800) } }
  createOscillator() { const node = new Source(); this.sources.push(node); return node }
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('feedback lifecycle', () => {
  it('fades the actual master bus to silence when sound is disabled', () => {
    const ctx = new Context()
    vi.stubGlobal('window', { AudioContext: function () { return ctx } })
    const synth = new Synth()
    synth.unlock()
    synth.enabled = false
    expect(ctx.gains[0].gain.value).toBe(0)
    synth.setVolume(0.8)
    expect(ctx.gains[0].gain.value).toBe(0)
    synth.enabled = true
    expect(ctx.gains[0].gain.value).toBeCloseTo(0.56)
  })

  it('releases every scheduled voice and disconnects each paused graph before resuming', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    vi.stubGlobal('window', { setInterval, clearInterval, setTimeout })
    const ctx = new Context()
    const synth = { graph: { ctx, master: new Node() } } as unknown as Synth
    const music = new Music(synth)
    for (let run = 0; run < 3; run++) {
      const start = ctx.sources.length
      music.start()
      vi.advanceTimersByTime(1200)
      music.setTier(6)
      vi.advanceTimersByTime(500)
      const stopAt = ctx.currentTime
      music.stop(0.2)
      const voices = ctx.sources.slice(start)
      expect(voices.length).toBeGreaterThan(0)
      for (const voice of voices) expect(voice.stops.at(-1)).toBeLessThanOrEqual(stopAt + 0.281)
      vi.advanceTimersByTime(400)
      expect(ctx.gains.filter((node) => node.disconnected).length).toBe((run + 1) * 8)
      const count = ctx.sources.length
      vi.advanceTimersByTime(1000)
      expect(ctx.sources.length).toBe(count)
    }
  })
})
