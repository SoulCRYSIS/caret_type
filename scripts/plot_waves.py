#!/usr/bin/env python3
"""Plot every ink-invaders wave variable against wave number.

Mirrors src/game/modes/ink-invaders/waves.ts. If that file changes, change the
constants and wave_config() here to match, then re-run:

    python3 scripts/plot_waves.py
    python3 scripts/plot_waves.py --waves 40 --lang th --out scripts/out
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

# --- copied from waves.ts ---------------------------------------------------

MAX_LIVES = 5
TARGET_WPM = {"easy": 25, "medium": 42, "hard": 65, "expert": 90}
DEATH_WAVE = 10
DOUBLING_WAVES = 10
BASE_LEN = {"easy": (2, 3), "medium": (3, 4), "hard": (7, 8), "expert": (4, 6)}
ON_SCREEN = {"easy": 4.5, "medium": 5, "hard": 5.5, "expert": 6}
EXTRA_WORDS = {"easy": 0, "medium": 1, "hard": 3, "expert": 5}
EXTRA_HEAVY = {"easy": 0, "medium": 0, "hard": 0.6, "expert": 1}
PUSH_BACK = {"easy": 0.0065, "medium": 0.0045, "hard": 0.0035, "expert": 0.0028}

TIERS = ("easy", "medium", "hard", "expert")

# paper palette, one ink per tier
COLORS = {
    "easy": "#8a8378",
    "medium": "#1f1c19",
    "hard": "#c2412d",
    "expert": "#6b2d22",
}


def js_round(x: float) -> int:
    """Math.round: half away from zero, unlike Python's banker's round."""
    return math.floor(x + 0.5) if x >= 0 else math.ceil(x - 0.5)


def build_config(wave: int, tier: str, lang: str, crossover: float) -> dict:
    n = max(1, wave)
    ln = math.log(n)
    lang_scale = 1.35 if lang == "th" else 1
    min_base, max_base = BASE_LEN[tier]
    min_len = js_round(min_base * lang_scale)
    max_len_exact = (max_base + 1.6 * math.log(1 + (n - 1) / 3)) * lang_scale
    max_len = js_round(max_len_exact)

    demand_wpm = TARGET_WPM[tier] * 2 ** ((n - crossover) / DOUBLING_WAVES)
    avg_chars = (min_len + max_len_exact) / 2 + 1
    spawn_every = (avg_chars * 12) / demand_wpm
    on_screen = ON_SCREEN[tier]
    per_char = 12 / demand_wpm
    travel = (on_screen - 1) * spawn_every

    return {
        "wave": n,
        "count": js_round(5 + EXTRA_WORDS[tier] + 5 * ln),
        "heavies": max(0, js_round(1.25 * ln - 0.7 + EXTRA_HEAVY[tier])),
        "spawnEvery": spawn_every,
        "maxActive": min(12, math.ceil(on_screen) + 2),
        "travel": travel,
        "perChar": per_char,
        "pushBack": PUSH_BACK[tier],
        "pushPct": 100 * PUSH_BACK[tier],
        # seconds of fall one key buys back on an average word (travel jitter averages +12.5%)
        "pushSec": PUSH_BACK[tier] * (travel * 1.125 + (avg_chars - 1) * per_char),
        "demandWpm": demand_wpm,
        "onScreen": on_screen,
        "minLen": min_len,
        "maxLen": max_len,
    }


def death_wave(config, player_wpm: float) -> float:
    """Continuous wave the player runs out of lives in (10.4 = 40% into wave 10)."""
    lives = MAX_LIVES
    for n in range(1, 201):
        cfg = config(n)
        missed = max(0.0, 1 - player_wpm / cfg["demandWpm"])
        lost = missed * (cfg["count"] + 2 * cfg["heavies"])
        if lost >= lives:
            return n + lives / lost
        lives -= lost
    return math.inf


_crossovers: dict[tuple[str, str], float] = {}


def crossover_for(tier: str, lang: str) -> float:
    key = (tier, lang)
    if key not in _crossovers:
        lo, hi = 1 - DOUBLING_WAVES, DEATH_WAVE + 1
        for _ in range(40):
            mid = (lo + hi) / 2
            dies = death_wave(lambda n: build_config(n, tier, lang, mid), TARGET_WPM[tier])
            if dies < DEATH_WAVE + 0.5:
                lo = mid
            else:
                hi = mid
        _crossovers[key] = (lo + hi) / 2
    return _crossovers[key]


def wave_config(wave: int, tier: str, lang: str) -> dict:
    return build_config(wave, tier, lang, crossover_for(tier, lang))


def expected_death_wave(tier: str, lang: str, player_wpm: float) -> float:
    return death_wave(lambda n: wave_config(n, tier, lang), player_wpm)


# name, key, y label, integer axis
PANELS = (
    ("words asked", "demandWpm", "wpm (log scale)", False),
    ("normal words", "count", "words", True),
    ("heavy words", "heavies", "words", True),
    ("time between spawns", "spawnEvery", "seconds", False),
    ("fall time, before letters", "travel", "seconds", False),
    ("extra time per letter", "perChar", "seconds", False),
    ("shortest word", "minLen", "letters", True),
    ("longest word", "maxLen", "letters", True),
    ("words on screen at once (cap)", "maxActive", "words", True),
)


def series(tier: str, lang: str, waves: int, key: str) -> list[float]:
    return [wave_config(w, tier, lang)[key] for w in range(1, waves + 1)]


def style_axis(ax, title: str, ylabel: str) -> None:
    ax.set_facecolor("#f3eee3")
    ax.set_title(title, loc="left", fontsize=11, color="#1f1c19", pad=8)
    ax.set_ylabel(ylabel, fontsize=9, color="#6b6560")
    ax.tick_params(colors="#6b6560", labelsize=8)
    for spine in ax.spines.values():
        spine.set_color("#d9d2c5")
    ax.grid(True, color="#e4ddd0", linewidth=0.6)


def plot(waves: int, lang: str, out: Path) -> Path:
    import matplotlib.pyplot as plt

    xs = list(range(1, waves + 1))
    fig, axes = plt.subplots(4, 3, figsize=(12.5, 12))
    fig.patch.set_facecolor("#f3eee3")

    for ax, (title, key, ylabel, integer) in zip(axes.flat, PANELS):
        for tier in TIERS:
            ax.plot(xs, series(tier, lang, waves, key), color=COLORS[tier], linewidth=1.8, label=tier)
        style_axis(ax, title, ylabel)
        ax.set_xlim(1, waves)
        ax.set_xlabel("wave", fontsize=9, color="#6b6560")
        if key == "demandWpm":
            ax.set_yscale("log", base=2)
        if integer:
            ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))

    # where a player of each speed runs out of ink
    ax = axes[3, 0]
    multiples = [0.5 + 0.05 * i for i in range(71)]
    for tier in TIERS:
        target = TARGET_WPM[tier]
        ax.plot(multiples, [expected_death_wave(tier, lang, m * target) for m in multiples], color=COLORS[tier], linewidth=1.8)
    for m, w in ((1, DEATH_WAVE), (2, DEATH_WAVE + DOUBLING_WAVES), (4, DEATH_WAVE + 2 * DOUBLING_WAVES)):
        ax.plot([m], [w + 0.5], "o", color="#c2412d", markersize=4)
    style_axis(ax, "wave a player dies in", "wave")
    ax.set_xlabel("player speed ÷ tier target", fontsize=9, color="#6b6560")
    ax.set_xscale("log", base=2)

    # the same, in raw wpm, against each tier's target
    ax = axes[3, 1]
    for tier in TIERS:
        speeds = list(range(10, 401, 5))
        ax.plot(speeds, [min(60, expected_death_wave(tier, lang, s)) for s in speeds], color=COLORS[tier], linewidth=1.8)
        ax.axvline(TARGET_WPM[tier], color=COLORS[tier], linewidth=0.8, linestyle=":")
    style_axis(ax, "wave a player dies in, by wpm", "wave")
    ax.set_xlabel("player wpm (dotted: tier target)", fontsize=9, color="#6b6560")
    ax.set_xscale("log", base=2)

    ax = axes[3, 2]
    for tier in TIERS:
        ax.plot(xs, series(tier, lang, waves, "pushPct"), color=COLORS[tier], linewidth=1.8)
    style_axis(ax, "push back per key", "% of page")
    ax.set_xlim(1, waves)
    ax.set_ylim(bottom=0)
    ax.set_xlabel("wave", fontsize=9, color="#6b6560")
    sec = ax.twinx()
    for tier in TIERS:
        sec.plot(xs, [1000 * v for v in series(tier, lang, waves, "pushSec")], color=COLORS[tier], linewidth=1, linestyle="--")
    sec.set_ylabel("ms rewound, avg word (dashed)", fontsize=9, color="#6b6560")
    sec.tick_params(colors="#6b6560", labelsize=8)
    sec.set_ylim(bottom=0)

    handles, labels = axes[0, 0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="upper center", ncol=4, frameon=False, fontsize=10, bbox_to_anchor=(0.5, 1.0))
    lang_name = "Thai" if lang == "th" else "English"
    fig.suptitle(f"ink invaders pacing · {lang_name}", fontsize=15, color="#1f1c19", y=1.035)
    fig.tight_layout()

    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, dpi=140, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    return out


def main() -> None:
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--waves", type=int, default=30, help="last wave to plot (default 30)")
    parser.add_argument("--lang", choices=("en", "th", "both"), default="both")
    parser.add_argument("--out", type=Path, default=here / "out", help="directory for the png files")
    args = parser.parse_args()

    langs = ("en", "th") if args.lang == "both" else (args.lang,)
    for lang in langs:
        path = plot(args.waves, lang, args.out / f"waves-{lang}.png")
        print(path)


if __name__ == "__main__":
    main()
