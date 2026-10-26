import { memo, useState, type CSSProperties } from 'react'
import type { ModeContext, ModeViewProps } from '../types'
import { BloomLayer } from './BloomLayer'
import { enemyPos, marginY } from './geometry'
import { COMBO_TIERS, multiplier, tierProgress } from './scoring'
import type { Banner, Enemy, InkState } from './state'
import * as css from './view.css'

type GlyphState = 'typed' | 'partial' | 'next' | 'todo'

const EnemyView = memo(function EnemyView(props: { e: Enemy; typed: number; targeted: boolean; ctx: ModeContext; time: number }) {
  const { e, targeted } = props
  const m = e.matcher
  const done = m.typedClusters
  const partial = m.typed > m.clusters.slice(0, done).reduce((n, c) => n + c.length, 0)
  const p = enemyPos(e, props.ctx, props.time)

  return (
    <div
      ref={(el) => {
        e.el = el
      }}
      className={css.enemy}
      data-target={targeted}
      data-heavy={e.heavy}
      data-danger={e.danger}
      style={{ transform: `translate3d(${p.x}px, ${p.y}px, 0) rotate(${e.rotNow}deg)` }}
    >
      <span className={css.stamp} lang={props.ctx.language}>
        <span className={css.frame} aria-hidden />
        {m.clusters.map((c, i) => {
          const st: GlyphState = i < done ? 'typed' : i === done ? (partial ? 'partial' : 'next') : 'todo'
          return (
            <span key={i} style={{ display: 'contents' }}>
              <span className={css.glyph} data-s={st} data-shield={i < e.shieldClusters}>
                {c.join('')}
              </span>
              {e.shieldClusters > 0 && i === e.shieldClusters - 1 && <span className={css.shieldGap} aria-hidden />}
            </span>
          )
        })}
      </span>
    </div>
  )
}, (a, b) => a.e === b.e && a.typed === b.typed && a.targeted === b.targeted)

function InkDrop({ full }: { full: boolean }) {
  return (
    <svg className={css.drop} data-full={full} viewBox="0 0 13 18" aria-hidden>
      <path
        d="M6.5 1 C 4 6, 1 9, 1 12 a 5.5 5.5 0 0 0 11 0 C 12 9, 9 6, 6.5 1 Z"
        fill={full ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function BannerView({ banner }: { banner: Banner }) {
  return (
    <div key={banner.id} className={css.banner} data-tone={banner.tone}>
      <span className={css.bannerFrame} />
      <span className={css.bannerText}>{banner.text}</span>
      {banner.sub && <span className={css.bannerSub}>{banner.sub}</span>}
    </div>
  )
}

const BLOT = 'M27 24C18 17 14 28 20 36C8 43 17 55 27 54C24 68 39 73 47 66C56 78 70 72 74 66C89 73 103 59 96 49C109 42 98 29 88 30C90 18 76 13 67 22C58 10 43 15 40 23C35 17 29 18 27 24Z'

/** Thrown ink: a tendril points up, so rotation is the ray angle plus a quarter turn. */
const TENDRILS = [
  'M0,-56 C12,-50 16,-30 10,-8 C7,6 4,28 1.6,56 C-1.6,56 -4,28 -10,-8 C-16,-30 -12,-50 0,-56Z',
  'M2,-58 C18,-46 16,-24 8,-4 C4,14 6,36 2,56 C0,40 -2,18 -6,2 C-14,-20 -8,-46 2,-58Z',
]
const BEAD = 'M0,-7 C5,-7 8,-3 6,2 C4,7 1,8 0,8 C-2,7 -7,4 -7,0 C-7,-5 -4,-7 0,-7Z'

/** Each tendril is rooted on the puddle rim and grows outward. `dist` is that root, in px. */
const STREAKS = [
  { deg: -132, dist: 58, len: 1.15, girth: 0.72, delay: '0s', shape: 0 },
  { deg: -104, dist: 44, len: 0.9, girth: 1.4, delay: '.02s', shape: 1 },
  { deg: -78, dist: 62, len: 1.32, girth: 0.46, delay: '.045s', shape: 0 },
  { deg: -48, dist: 50, len: 1.02, girth: 0.86, delay: '.01s', shape: 1 },
  { deg: -18, dist: 66, len: 1.4, girth: 0.56, delay: '.03s', shape: 0 },
  { deg: 16, dist: 48, len: 1.08, girth: 1.08, delay: '0s', shape: 1 },
  { deg: 48, dist: 40, len: 0.84, girth: 0.5, delay: '.055s', shape: 0 },
  { deg: 78, dist: 60, len: 1.36, girth: 0.76, delay: '.015s', shape: 1 },
  { deg: 112, dist: 52, len: 0.98, girth: 0.62, delay: '.04s', shape: 0 },
  { deg: 148, dist: 64, len: 1.26, girth: 0.94, delay: '.01s', shape: 1 },
  { deg: 176, dist: 42, len: 0.88, girth: 0.48, delay: '.05s', shape: 0 },
  { deg: -162, dist: 56, len: 1.22, girth: 1.16, delay: '.025s', shape: 1 },
]

/** Droplets ahead of the crown. Higher tiers throw more of them. */
const BEADS = [
  { deg: -146, dist: 292, delay: '.03s', s: 0.85 },
  { deg: -118, dist: 334, delay: '0s', s: 1.25 },
  { deg: -90, dist: 268, delay: '.05s', s: 0.6 },
  { deg: -62, dist: 318, delay: '.02s', s: 1 },
  { deg: -32, dist: 286, delay: '.04s', s: 0.7 },
  { deg: 4, dist: 348, delay: '.01s', s: 1.15 },
  { deg: 32, dist: 264, delay: '.06s', s: 0.55 },
  { deg: 62, dist: 328, delay: '.02s', s: 0.95 },
  { deg: 96, dist: 300, delay: '.035s', s: 1.3 },
  { deg: 128, dist: 276, delay: '.015s', s: 0.65 },
  { deg: 162, dist: 340, delay: '.04s', s: 1.05 },
  { deg: -174, dist: 310, delay: '.025s', s: 0.75 },
  { deg: -68, dist: 372, delay: '.07s', s: 0.5 },
  { deg: 52, dist: 360, delay: '.05s', s: 0.45 },
]

function spreadFor(mult: number): string {
  if (mult >= 9) return '1.45'
  if (mult >= 7) return '1.28'
  if (mult >= 5) return '1.14'
  return '1'
}

function rayStyle(deg: number, dist: number, len: number, girth: number, delay: string, opacity = 1): CSSProperties {
  const rad = (deg * Math.PI) / 180
  return {
    ['--x' as string]: `${(Math.cos(rad) * dist).toFixed(1)}px`,
    ['--y' as string]: `${(Math.sin(rad) * dist).toFixed(1)}px`,
    ['--r' as string]: `${(deg + 90).toFixed(1)}deg`,
    ['--sx' as string]: girth.toFixed(3),
    ['--sy' as string]: len.toFixed(3),
    ['--o' as string]: String(opacity),
    animationDelay: delay,
  }
}

function ComboCallout({ mult, reduced }: { mult: number; reduced: boolean }) {
  const beads = BEADS.slice(0, reduced ? 0 : 8 + Math.min(6, mult))
  return (
    <>
      {!reduced && (
        <div className={css.splashField} data-tier={mult} style={{ ['--spread' as string]: spreadFor(mult) }} aria-hidden>
          <span className={css.splashPool}>
            <svg className={css.splashBlob} viewBox="-100 -72 200 144" aria-hidden focusable="false">
              <path d="M-6,-48 C42,-62 88,-28 78,6 C70,36 36,58 -4,50 C-46,42 -86,18 -78,-10 C-70,-40 -40,-36 -6,-48Z" />
              <path d="M36,-18 C58,-24 74,-6 68,12 C62,28 44,32 30,22 C16,12 18,-8 36,-18Z" />
            </svg>
          </span>
          {STREAKS.map((s) => (
            <span key={s.deg} className={css.splashStreak} style={rayStyle(s.deg, s.dist, s.len, s.girth, s.delay, s.girth < 0.6 ? 0.8 : 1)}>
              <svg className={css.splashBlob} viewBox="-22 -64 44 128" aria-hidden focusable="false">
                <path d={TENDRILS[s.shape]} />
              </svg>
            </span>
          ))}
          {beads.map((b) => (
            <span key={b.deg} className={css.splashBead} style={rayStyle(b.deg, b.dist, b.s, b.s, b.delay, 0.92)}>
              <svg className={css.splashBlob} viewBox="-10 -10 20 20" aria-hidden focusable="false">
                <path d={BEAD} />
              </svg>
            </span>
          ))}
        </div>
      )}
      <span className={css.splashFigure} data-tier={mult} data-reduced={reduced || undefined} aria-hidden>
        &times;{mult}
      </span>
    </>
  )
}

function ComboSeal({ mult }: { mult: number }) {
  const [stamp, setStamp] = useState({ mult, dir: 'same' as 'up' | 'down' | 'same' })
  const dir = mult === stamp.mult ? stamp.dir : mult > stamp.mult ? 'up' : 'down'
  if (mult !== stamp.mult) setStamp({ mult, dir })
  const inkMotion = dir === 'up' ? css.comboInkUp : dir === 'down' ? css.comboInkDown : ''

  return (
    <span key={mult} className={css.comboSeal} data-tier={mult} data-dir={dir}>
      <svg className={`${css.comboInk} ${inkMotion}`} viewBox="0 0 120 88" aria-hidden focusable="false">
        <path d={BLOT} />
        <path d="M29 32C38 22 53 24 62 27" fill="none" stroke="currentColor" strokeWidth="2" opacity=".15" />
        <g className={dir === 'up' ? css.splatterDrop.nw : undefined}>
          <ellipse cx="12" cy="22" rx="4" ry="3" transform="rotate(28 12 22)" />
        </g>
        <g className={dir === 'up' ? css.splatterDrop.se : undefined}>
          <circle cx="103" cy="66" r="3.5" />
        </g>
        <g className={dir === 'up' ? css.splatterDrop.ne : undefined}>
          <circle cx="100" cy="19" r="2" />
        </g>
        <g className={dir === 'up' ? css.splatterDrop.sw : undefined}>
          <ellipse cx="31" cy="77" rx="2" ry="3" transform="rotate(-30 31 77)" />
        </g>
      </svg>
      <span className={mult >= 5 ? `${css.mult} ${css.multHot}` : css.mult}>
        <span className={`${css.multFigure} ${dir === 'up' ? css.multStamp : dir === 'down' ? css.multDrop : ''}`}>&times;{mult}</span>
      </span>
    </span>
  )
}

export function InkInvadersView({ state: s, ctx }: ModeViewProps<InkState>) {
  const mult = multiplier(s.combo)

  return (
    <div
      className={css.root}
      ref={(el) => {
        s.rootEl = el
      }}
    >
      <BloomLayer level={s.phase === 'over' || s.phase === 'dying' ? 0 : Math.max(0, mult - 1)} juice={ctx.juice} />
      <div className={css.notebookRule} />

      <div className={css.hud}>
        <div>
          <span className={css.hudLabel}>score</span>
          <span
            key={s.scoreBump}
            className={css.score}
            ref={(el) => {
              s.hudScoreEl = el
            }}
          >
            {s.displayScore.toLocaleString()}
          </span>
        </div>
        <div className={css.waveBlock}>
          <span className={css.hudLabel}>wave</span>
          <span className={css.waveNum}>{Math.max(1, s.wave)}</span>
          <div className={css.ticks} aria-hidden>
            {Array.from({ length: Math.min(40, s.waveTotal) }, (_, i) => (
              <span key={i} className={css.tick} data-done={i < s.waveDone} />
            ))}
          </div>
        </div>
        <div className={css.comboBlock} data-reduced={ctx.juice.reducedMotion}>
          <span className={css.hudLabel}>combo</span>
          <ComboSeal key={s.startedAt} mult={mult} />
          <span className={css.tierBar} aria-hidden>
            <span className={css.tierFill} style={{ transform: `scaleX(${tierProgress(s.combo)})` }} />
          </span>
          <span className={css.comboCount}>{mult >= COMBO_TIERS.length ? `${s.combo} · max` : `${s.combo} / ${COMBO_TIERS[mult]}`}</span>
          {s.comboBreak && (
            <span key={s.comboBreak.id} className={css.crackNum}>
              {s.comboBreak.value}
            </span>
          )}
        </div>
      </div>

      {s.enemies.map((e) => (
        <EnemyView key={e.id} e={e} typed={e.matcher.typed} targeted={s.target === e} ctx={ctx} time={s.time} />
      ))}

      <div className={css.margin} style={{ top: marginY(ctx) }}>
        <span className={css.marginLabel}>margin</span>
      </div>

      <div className={css.lives} aria-label={`${s.lives} ink left`}>
        {Array.from({ length: s.maxLives }, (_, i) => (
          <InkDrop key={`${i}-${i < s.lives}`} full={i < s.lives} />
        ))}
      </div>

      {s.banner && <BannerView banner={s.banner} />}
      {s.comboCallout && <ComboCallout key={s.comboCallout.id} mult={s.comboCallout.mult} reduced={ctx.juice.reducedMotion} />}
      {s.lives <= 2 && s.phase !== 'over' && <div className={css.vignette} data-critical={s.lives <= 1} />}
      <div key={s.errorFlash} className={css.flash} data-on={s.errorFlash > 0} />
    </div>
  )
}
