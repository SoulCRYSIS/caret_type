import { FONT_MONO } from '../../../theme/fonts'
import { clusters, unitCount, WordMatcher } from '../../words/graphemes'
import type { GameMode, ModeContext, RunResult } from '../types'
import { accuracy, comboAfterMiss, killScore, multiplier, waveBonus, wpm } from './scoring'
import { enemyPos, marginY } from './geometry'
import { inkCard } from './card'
import type { Enemy, InkDetails, InkState } from './state'
import { InkIntro } from './Intro'
import { InkInvadersView } from './View'
import { travelTime, waveConfig } from './waves'

const MAX_LIVES = 5
const ENEMY_FONT_PX = 22

const rand = (a: number, b: number) => a + Math.random() * (b - a)

function center(e: Enemy, ctx: ModeContext, time: number) {
  const p = enemyPos(e, ctx, time)
  return { x: p.x + (e.w || 90) / 2, y: p.y + (e.h || 40) / 2 }
}

function startWave(s: InkState, ctx: ModeContext, wave: number) {
  s.wave = wave
  s.cfg = waveConfig(wave, ctx.tier, ctx.language)
  s.toSpawn = s.cfg.count
  s.heaviesLeft = s.cfg.heavies
  s.waveTotal = s.cfg.count + s.cfg.heavies
  s.waveDone = 0
  s.spawnTimer = 0.55
  s.waveStart = ctx.elapsed()
  s.waveChars = 0
  s.damagedThisWave = false
  s.phase = 'wave'
  s.banner = {
    id: ++s.fxId,
    text: `wave ${wave}`,
    sub: s.cfg.heavies > 0 ? 'heavy ink ahead' : undefined,
    tone: s.cfg.heavies > 0 ? 'error' : 'accent',
  }
  ctx.juice.audio.stamp()
  ctx.juice.trauma(0.22)
  ctx.invalidate()
}

function endWave(s: InkState, ctx: ModeContext) {
  const secs = ctx.elapsed() - s.waveStart
  s.wpmByWave.push(wpm(s.waveChars, secs))
  const flawless = !s.damagedThisWave
  s.wavesCleared++
  if (flawless) s.flawlessWaves++
  const bonus = waveBonus(s.wave, flawless)
  s.score += bonus
  s.displayScore += bonus
  s.scoreBump++
  s.banner = { id: ++s.fxId, text: flawless ? 'flawless' : 'cleared', sub: `+${bonus}`, tone: 'ink' }
  s.phase = 'intermission'
  s.phaseTimer = 1.6
  ctx.juice.audio.bell()
  ctx.juice.slowmo(0.3, 380, 420)
  ctx.invalidate()
}

function pickX(s: InkState): number {
  let best = Math.random()
  let bestDist = -1
  for (let i = 0; i < 10; i++) {
    const x = Math.random()
    let d = 1
    for (const e of s.enemies) if (e.y < 0.35) d = Math.min(d, Math.abs(e.x - x))
    if (d > bestDist) {
      bestDist = d
      best = x
    }
  }
  return best
}

function spawn(s: InkState, ctx: ModeContext, heavy: boolean) {
  const cfg = s.cfg
  const avoid = new Set(s.enemies.map((e) => Array.from(e.word)[0]))
  let word: string
  let shieldClusters = 0
  if (heavy) {
    const shield = ctx.words.pick({ maxLen: Math.max(3, cfg.minLen + 1), avoidFirst: avoid })
    const core = ctx.words.pick({ minLen: Math.max(cfg.maxLen - 2, cfg.minLen + 3) })
    word = shield + core
    shieldClusters = clusters(shield).length
  } else {
    word = ctx.words.pick({ minLen: cfg.minLen, maxLen: cfg.maxLen, avoidFirst: avoid })
  }
  const rot = heavy ? rand(-2, 2) : rand(-4.5, 4.5)
  s.enemies.push({
    id: s.nextId++,
    word,
    matcher: new WordMatcher(word),
    shieldClusters,
    heavy,
    x: pickX(s),
    y: 0,
    speed: 1 / travelTime(cfg, unitCount(word), heavy),
    swayAmp: rand(3, heavy ? 6 : 12),
    swayFreq: rand(0.5, 1.2),
    swayPhase: rand(0, Math.PI * 2),
    rot,
    rotNow: rot,
    jitter: 0,
    danger: false,
    landed: false,
    lockedAt: 0,
    el: null,
    w: 0,
    h: 0,
  })
  ctx.invalidate()
}

function removeEnemy(s: InkState, e: Enemy) {
  s.enemies = s.enemies.filter((x) => x !== e)
  if (s.target === e) s.target = null
  s.waveDone++
}

/** A mistype chips the combo; a breach clears it. */
function breakCombo(s: InkState, hard: boolean) {
  const next = hard ? 0 : comboAfterMiss(s.combo)
  const lost = s.combo - next
  if (lost >= 5) s.comboBreak = { id: ++s.fxId, value: -lost }
  s.combo = next
}

function hudTarget(s: InkState): { x: number; y: number } {
  if (!s.rootEl || !s.hudScoreEl) return { x: 80, y: 40 }
  const root = s.rootEl.getBoundingClientRect()
  const r = s.hudScoreEl.getBoundingClientRect()
  return { x: r.left - root.left + r.width / 2, y: r.top - root.top + r.height / 2 }
}

function kill(s: InkState, e: Enemy, ctx: ModeContext) {
  const { juice } = ctx
  const units = e.matcher.length
  const pts = killScore(units, s.combo, e.heavy)
  const c = juice.colors()
  const p = center(e, ctx, s.time)
  s.score += pts
  s.kills++
  s.inked.push({ word: e.word, secs: Math.max(0.05, ctx.elapsed() - e.lockedAt), heavy: e.heavy, wave: s.wave })
  removeEnemy(s, e)

  juice.hitstop(e.heavy ? 120 : Math.min(90, 38 + units * 4))
  juice.splatter(p.x, p.y, { color: c.ink, count: 14 + units * 3, power: 340 + units * 18 })
  juice.splatter(p.x, p.y, { color: c.accent, count: 6 + units, power: 300, stains: false })
  juice.particles.stain(p.x, p.y, 14 + units * 2.2, c.ink, 0.09, 9)
  juice.particles.ring(p.x, p.y, c.accent, 36 + units * 5)
  juice.particles.ghost(e.word, p.x, p.y, c.accent, FONT_MONO, ENEMY_FONT_PX)
  const t = hudTarget(s)
  juice.particles.flyText(`+${pts}`, p.x, p.y - 8, t.x, t.y, c.accent, FONT_MONO, () => {
    s.displayScore = Math.min(s.score, s.displayScore + pts)
    s.scoreBump++
    ctx.invalidate()
  })
  juice.trauma(Math.min(0.55, 0.16 + units * 0.025) * (e.heavy ? 1.6 : 1))
  juice.audio.splat(units, s.combo)
  if (e.heavy) {
    juice.slowmo(0.3, 260, 300)
    juice.particles.ring(p.x, p.y, c.ink, 120, 4)
  }
}

function hit(s: InkState, e: Enemy, ctx: ModeContext) {
  const { juice } = ctx
  const before = multiplier(s.combo)
  s.correct++
  s.waveChars++
  s.combo++
  s.maxCombo = Math.max(s.maxCombo, s.combo)
  juice.audio.clack(s.combo)
  e.y = Math.max(0, e.y - 0.0045)

  const p = enemyPos(e, ctx, s.time)
  const w = e.w || 90
  const c = juice.colors()
  juice.splatter(p.x + 12 + ((w - 24) * e.matcher.typed) / e.matcher.length, p.y + (e.h || 40) * 0.5, {
    color: c.accent,
    count: 3,
    power: 150,
    stains: false,
  })

  const after = multiplier(s.combo)
  if (after > before) {
    s.comboPulse++
    juice.audio.chime(after)
    juice.trauma(0.12)
  }
  if (e.matcher.done) kill(s, e, ctx)
}

function miss(s: InkState, ctx: ModeContext, e: Enemy | null) {
  const { juice } = ctx
  s.errors++
  breakCombo(s, false)
  s.errorFlash++
  juice.audio.thud()
  juice.trauma(0.1)
  if (e) {
    e.jitter = 0.22
    const p = center(e, ctx, s.time)
    juice.splatter(p.x, p.y, { color: juice.colors().error, count: 7, power: 170, stains: false })
  }
}

function breach(s: InkState, e: Enemy, ctx: ModeContext) {
  const { juice } = ctx
  const c = juice.colors()
  const p = center(e, ctx, s.time)
  const y = marginY(ctx)
  s.spilled.push(e.word)
  removeEnemy(s, e)
  s.lives = Math.max(0, s.lives - (e.heavy ? 2 : 1))
  s.damagedThisWave = true
  s.lifeLost++
  breakCombo(s, true)
  juice.audio.blot()
  juice.trauma(0.6)
  juice.splatter(p.x, y, { color: c.error, count: 26, power: 440, angle: -Math.PI / 2, spread: 1.2 })
  juice.particles.stain(p.x, y, 34, c.error, 0.16, 10)
  if (s.lives <= 0) die(s, ctx)
}

function die(s: InkState, ctx: ModeContext) {
  const { juice } = ctx
  const c = juice.colors()
  s.wpmByWave.push(wpm(s.waveChars, ctx.elapsed() - s.waveStart))
  s.phase = 'dying'
  s.dyingUntil = ctx.elapsed() + 1.5
  s.target = null
  for (const e of s.enemies) {
    const p = center(e, ctx, s.time)
    juice.splatter(p.x, p.y, { color: c.muted, count: 16, power: 260 })
    juice.particles.stain(p.x, p.y, 22, c.muted, 0.12, 10)
  }
  s.enemies = []
  s.banner = { id: ++s.fxId, text: 'out of ink', tone: 'error' }
  juice.slowmo(0.2, 900, 500)
  juice.hitstop(160)
  juice.trauma(0.9)
}

export const inkInvaders: GameMode<InkState, InkDetails> = {
  id: 'ink-invaders',
  name: 'ink invaders',
  blurb: 'Words drift toward the margin. Type them before they spill.',

  init(ctx) {
    return {
      phase: 'intro',
      phaseTimer: 0.35,
      dyingUntil: 0,
      time: 0,
      enemies: [],
      target: null,
      nextId: 1,
      fxId: 0,
      wave: 0,
      cfg: waveConfig(1, ctx.tier, ctx.language),
      toSpawn: 0,
      heaviesLeft: 0,
      spawnTimer: 0,
      waveTotal: 0,
      waveDone: 0,
      waveStart: 0,
      waveChars: 0,
      damagedThisWave: false,
      lives: MAX_LIVES,
      maxLives: MAX_LIVES,
      score: 0,
      displayScore: 0,
      combo: 0,
      maxCombo: 0,
      correct: 0,
      errors: 0,
      kills: 0,
      wpmByWave: [],
      inked: [],
      spilled: [],
      flawlessWaves: 0,
      wavesCleared: 0,
      startedAt: Date.now(),
      endedAt: 0,
      banner: null,
      comboBreak: null,
      scoreBump: 0,
      comboPulse: 0,
      errorFlash: 0,
      lifeLost: 0,
      rootEl: null,
      hudScoreEl: null,
    }
  },

  update(s, dt, ctx) {
    s.time += dt
    switch (s.phase) {
      case 'intro':
      case 'intermission':
        s.phaseTimer -= dt
        if (s.phaseTimer <= 0) startWave(s, ctx, s.wave + 1)
        break
      case 'wave': {
        s.spawnTimer -= dt
        const pending = s.toSpawn + s.heaviesLeft
        if (s.spawnTimer <= 0 && pending > 0 && s.enemies.length < s.cfg.maxActive) {
          const heavyNow = s.heaviesLeft > 0 && (s.toSpawn <= s.cfg.count / 2 || s.toSpawn === 0)
          if (heavyNow) s.heaviesLeft--
          else s.toSpawn--
          spawn(s, ctx, heavyNow)
          s.spawnTimer = s.cfg.spawnEvery * rand(0.75, 1.25) * (heavyNow ? 1.6 : 1)
        }
        break
      }
      case 'dying':
        if (ctx.elapsed() >= s.dyingUntil) {
          s.phase = 'over'
          s.endedAt = Date.now()
        }
        break
      case 'over':
        return
    }

    for (const e of [...s.enemies]) {
      e.y += e.speed * dt
      if (e.jitter > 0) e.jitter = Math.max(0, e.jitter - dt)
      if (e.y >= 1 && s.phase === 'wave') breach(s, e, ctx)
    }

    if (s.phase === 'wave' && s.toSpawn === 0 && s.heaviesLeft === 0 && s.enemies.length === 0) endWave(s, ctx)
  },

  onKey(s, key, ctx) {
    if (s.phase === 'dying' || s.phase === 'over') return false
    if (key.kind === 'escape' || key.kind === 'backspace') {
      if (!s.target) return key.kind === 'backspace'
      s.target.matcher.reset()
      s.target = null
      ctx.invalidate()
      return true
    }
    if (key.kind === 'space') return true
    if (key.kind !== 'char') return false

    if (!s.target) {
      let best: Enemy | null = null
      for (const e of s.enemies) {
        if (e.matcher.typed === 0 && e.matcher.next === key.char && (!best || e.y > best.y)) best = e
      }
      if (!best) {
        miss(s, ctx, null)
        ctx.invalidate()
        return true
      }
      s.target = best
      best.lockedAt = ctx.elapsed()
    }
    const target = s.target
    if (target.matcher.accept(key.char)) hit(s, target, ctx)
    else miss(s, ctx, target)
    ctx.invalidate()
    return true
  },

  draw(s, ctx, realDt) {
    const { juice } = ctx
    for (const e of s.enemies) {
      const el = e.el
      if (!el) continue
      if (!e.w) {
        e.w = el.offsetWidth
        e.h = el.offsetHeight
      }
      const p = enemyPos(e, ctx, s.time)
      if (!e.landed) {
        e.landed = true
        const c = juice.colors()
        juice.splatter(p.x + e.w / 2, p.y + e.h, { color: c.muted, count: e.heavy ? 14 : 5, power: e.heavy ? 220 : 90, stains: false, angle: -Math.PI / 2, spread: 1.4 })
        if (e.heavy) {
          juice.audio.stamp()
          juice.trauma(0.3)
        }
      }
      const goal = s.target === e ? 0 : e.rot
      e.rotNow += (goal - e.rotNow) * Math.min(1, realDt * 14)
      const jx = e.jitter > 0 ? Math.sin(s.time * 95) * 7 * (e.jitter / 0.22) : 0
      el.style.transform = `translate3d(${(p.x + jx).toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${e.rotNow.toFixed(2)}deg)`
      const danger = e.y > 0.72
      if (danger !== e.danger) {
        e.danger = danger
        el.dataset.danger = String(danger)
      }
    }
  },

  render: InkInvadersView,
  Intro: InkIntro,
  seal: 'INK',

  isOver(s) {
    return s.phase === 'over'
  },

  result(s, ctx): RunResult {
    const seconds = ctx.elapsed()
    return {
      modeId: 'ink-invaders',
      language: ctx.language,
      tier: ctx.tier,
      score: s.score,
      wpm: wpm(s.correct, seconds),
      accuracy: Math.round(accuracy(s.correct, s.errors) * 1000) / 1000,
      wave: Math.max(1, s.wave),
      kills: s.kills,
      chars: s.correct,
      maxCombo: s.maxCombo,
      durationMs: Math.round(seconds * 1000),
      wpmByWave: s.wpmByWave,
      startedAt: s.startedAt,
      endedAt: s.endedAt || Date.now(),
    }
  },

  details(s): InkDetails {
    return { inked: s.inked, spilled: s.spilled, flawlessWaves: s.flawlessWaves, wavesCleared: s.wavesCleared }
  },

  card: inkCard,
}
