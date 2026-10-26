/** How hard the game hits back at each combo multiplier (×1 … ×10). Every field grows with the tier. */
export interface ComboPower {
  /** 0 at ×1, 9 at ×10. */
  level: number
  /** Multiplies how many ink drops a key or a kill throws. */
  particles: number
  /** Multiplies how far and fast they fly. */
  force: number
  /** Multiplies screen shake. */
  shake: number
  /** Extra hitstop on a kill, in ms. */
  hitstop: number
  /** Extra shock rings on a kill. */
  rings: number
  /** Shake added to every correct key, so high tiers feel like a machine gun. */
  keyShake: number
  /** Low thump on a kill (0 = none, up to 1). */
  thump: number
}

export function comboPower(mult: number): ComboPower {
  const level = Math.max(0, mult - 1)
  // ×1–×6 keep their slope. Past that the page is already shaking, so each new tier adds a shorter step.
  const t = level <= 5 ? level : 5 + (level - 5) * 0.45
  return {
    level,
    particles: 1 + t * 0.4,
    force: 1 + t * 0.13,
    shake: 1 + t * 0.22,
    hitstop: Math.round(t * 9),
    rings: Math.max(0, Math.round(t) - 1),
    keyShake: Math.min(0.072, t * 0.012),
    thump: t === 0 ? 0 : Math.min(1, 0.2 + t * 0.16),
  }
}
