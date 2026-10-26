import { memo } from 'react'
import type { ModeContext, ModeViewProps } from '../types'
import { FireLayer } from './FireLayer'
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

export function InkInvadersView({ state: s, ctx }: ModeViewProps<InkState>) {
  const mult = multiplier(s.combo)
  const comboScale = 1 + Math.min(s.combo, 150) / 360

  return (
    <div
      className={css.root}
      ref={(el) => {
        s.rootEl = el
      }}
    >
      <FireLayer level={s.phase === 'over' || s.phase === 'dying' ? 0 : Math.max(0, mult - 2)} juice={ctx.juice} />
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
        <div className={css.comboBlock}>
          <span className={css.hudLabel}>combo</span>
          <span key={`${mult}-${s.comboPulse}`} className={css.mult} data-tier={mult} style={{ scale: String(comboScale) }}>
            &times;{mult}
          </span>
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
      {s.lives <= 2 && s.phase !== 'over' && <div className={css.vignette} data-critical={s.lives <= 1} />}
      <div key={s.errorFlash} className={css.flash} data-on={s.errorFlash > 0} />
    </div>
  )
}
