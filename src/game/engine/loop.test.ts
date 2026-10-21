import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GameLoop, STEP } from './loop'

let pending: FrameRequestCallback | null = null

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    pending = cb
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    pending = null
  })
  vi.spyOn(performance, 'now').mockReturnValue(0)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function frameAt(ms: number) {
  const cb = pending
  pending = null
  cb?.(ms)
}

function makeLoop() {
  const stats = { steps: 0, gameTime: 0 }
  const loop = new GameLoop({
    update: (dt) => {
      stats.steps++
      stats.gameTime += dt
    },
    frame: () => {},
  })
  return { loop, stats }
}

describe('GameLoop', () => {
  it('runs fixed steps proportional to elapsed time', () => {
    const { loop, stats } = makeLoop()
    loop.start()
    let t = 0
    for (let i = 0; i < 60; i++) frameAt((t += 1000 / 60))
    expect(stats.gameTime).toBeCloseTo(1, 1)
    expect(stats.steps).toBeGreaterThanOrEqual(Math.floor(1 / STEP) - 2)
  })

  it('freezes simulation during hitstop', () => {
    const { loop, stats } = makeLoop()
    loop.start()
    frameAt(16)
    const before = stats.steps
    loop.hitstop(100)
    frameAt(32)
    frameAt(48)
    expect(stats.steps).toBe(before)
    frameAt(200)
    expect(stats.steps).toBeGreaterThan(before)
  })

  it('scales time during slowmo and recovers', () => {
    const { loop } = makeLoop()
    loop.start()
    frameAt(16)
    loop.slowmo(0.25, 200, 100)
    expect(loop.timeScale()).toBe(0.25)
    let t = 16
    while (t < 300) frameAt((t += 16))
    expect(loop.timeScale()).toBeLessThan(1)
    while (t < 600) frameAt((t += 16))
    expect(loop.timeScale()).toBe(1)
  })

  it('does not advance while paused', () => {
    const { loop, stats } = makeLoop()
    loop.start()
    frameAt(16)
    loop.pause()
    const before = stats.steps
    frameAt(1016)
    expect(stats.steps).toBe(before)
    expect(loop.elapsed).toBeLessThan(0.05)
  })
})
