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

TARGET_WPM = {"easy": 25, "medium": 42, "hard": 65, "expert": 90}
BASE_LEN = {"easy": (2, 3), "medium": (3, 4), "hard": (7, 8), "expert": (4, 6)}
BASE_TRAVEL = {"easy": 12, "medium": 9, "hard": 7.5, "expert": 6.5}
EXTRA_WORDS = {"easy": 0, "medium": 1, "hard": 3, "expert": 5}
EXTRA_HEAVY = {"easy": 0, "medium": 0, "hard": 0.6, "expert": 1}

OPENING_PACE = 0.55
PACE_GROWTH = 0.6
TRAVEL_GROWTH = 0.6

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


def wave_config(wave: int, tier: str, lang: str) -> dict:
    n = max(1, wave)
    ln = math.log(n)
    lang_scale = 1.35 if lang == "th" else 1
    min_base, max_base = BASE_LEN[tier]
    min_len = js_round(min_base * lang_scale)
    max_len_exact = (max_base + 1.6 * ln) * lang_scale
    max_len = js_round(max_len_exact)

    demand_wpm = TARGET_WPM[tier] * OPENING_PACE * (1 + PACE_GROWTH * ln)
    avg_chars = (min_len + max_len_exact) / 2 + 1
    spawn_every = (avg_chars * 12) / demand_wpm
    travel = BASE_TRAVEL[tier] / (1 + TRAVEL_GROWTH * ln)
    per_char = (12 / TARGET_WPM[tier]) * 1.25

    return {
        "wave": n,
        "count": js_round(5 + EXTRA_WORDS[tier] + 5 * ln),
        "heavies": max(0, js_round(1.25 * ln - 0.7 + EXTRA_HEAVY[tier])),
        "spawnEvery": spawn_every,
        "maxActive": min(12, math.ceil((travel + per_char * avg_chars) / spawn_every) + 2),
        "travel": travel,
        "perChar": per_char,
        "demandWpm": demand_wpm,
        "minLen": min_len,
        "maxLen": max_len,
    }


# name, key, y label, integer axis
PANELS = (
    ("words asked", "demandWpm", "wpm", False),
    ("normal words", "count", "words", True),
    ("heavy words", "heavies", "words", True),
    ("time between spawns", "spawnEvery", "seconds", False),
    ("fall time, before letters", "travel", "seconds", False),
    ("extra time per letter", "perChar", "seconds", False),
    ("shortest word", "minLen", "letters", True),
    ("longest word", "maxLen", "letters", True),
    ("words on screen at once", "maxActive", "words", True),
)


def series(tier: str, lang: str, waves: int, key: str) -> list[float]:
    return [wave_config(w, tier, lang)[key] for w in range(1, waves + 1)]


def plot(waves: int, lang: str, out: Path) -> Path:
    import matplotlib.pyplot as plt

    xs = list(range(1, waves + 1))
    fig, axes = plt.subplots(3, 3, figsize=(12.5, 9.2), sharex=True)
    fig.patch.set_facecolor("#f3eee3")

    for ax, (title, key, ylabel, integer) in zip(axes.flat, PANELS):
        ax.set_facecolor("#f3eee3")
        for tier in TIERS:
            ax.plot(xs, series(tier, lang, waves, key), color=COLORS[tier], linewidth=1.8, label=tier)
        ax.set_title(title, loc="left", fontsize=11, color="#1f1c19", pad=8)
        ax.set_ylabel(ylabel, fontsize=9, color="#6b6560")
        ax.tick_params(colors="#6b6560", labelsize=8)
        for spine in ax.spines.values():
            spine.set_color("#d9d2c5")
        ax.grid(True, color="#e4ddd0", linewidth=0.6)
        ax.set_xlim(1, waves)
        if integer:
            ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))

    for ax in axes[-1]:
        ax.set_xlabel("wave", fontsize=9, color="#6b6560")

    handles, labels = axes[0, 0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="upper center", ncol=4, frameon=False, fontsize=10, bbox_to_anchor=(0.5, 1.0))
    lang_name = "Thai" if lang == "th" else "English"
    fig.suptitle(f"ink invaders pacing · {lang_name}", fontsize=15, color="#1f1c19", y=1.045)
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
