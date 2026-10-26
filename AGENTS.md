# caret — agent notes

This file is for agents and future sessions. The README is for players. Do not put setup, Firebase, or file maps in the README.

## What this is

A Monkeytype-like typing game with a paper-and-ink look. React 19 + TypeScript strict + Vite 8 + Radix + Vanilla Extract + Zustand + Vitest + oxlint. Firebase project `caret-type` (Auth + Firestore). One mode today: **Ink Invaders**, behind a `GameMode` interface so more can be added.

The whole product is the look: stamps, blots, an ensō, a hanko, washi, a hanging-scroll result card. If a change would look at home in a neon arcade game, it is the wrong change.

## Design concept

- **Paper, not HUD.** Type on a page. Words are rubber stamps. Score, wave and combo sit like notebook labels, not game chrome. Particles are ink, not sparks. Screen shake is a stamp hitting the desk.
- **Language picks the words. Difficulty picks the pace.** Easy–expert never change word length. Length comes from `Language.len` (min, max at wave 1) and grows slowly with the wave (`1.6 * ln(1+(n-1)/3)`, ×1.35 for Thai). Punctuation, numbers and code are languages of their own, Monkeytype-style, not toggles on English.
- **Pacing is calibrated.** Demand is `TARGET_WPM[tier] * 2**((n-crossover)/10)`. Crossover is bisected so a player at the tier's target WPM dies at wave 10 (`DEATH_WAVE`). Speed doubles every 10 waves after that. Tests in `scoring.test.ts` lock this for every language × tier. Do not "feel" the curve without checking that invariant.
- **Combo is the heat.** `COMBO_TIERS` in `scoring.ts` is the source of truth (currently ×1…×10). A mistype costs `MISS_COMBO_PENALTY[tier]`; a spill costs all of it. `comboPower(mult)` in `power.ts` scales particles, force, shake, hitstop, rings, key-shake and thump. Past ×6 the slope shortens so the page does not explode.
- **Hot combo is ink, not fire.** Page edges get round ink blooms (`bloom.ts` / `BloomLayer.tsx`) that spread like ink on wet paper, in the palette's ink and accent, with a faint ripple. The combo HUD is a red hanko that grows with the tier, plus a brush stroke on the callout — not flames, not orange, not a video-game aura.
- **Sound vs music.** Effects are synthesized in `audio.ts` (clack, thud, splat, stamp, thump, bell, blot, chime). The theme is a looping recording, `src/assets/music/caret_paper_lanterns_loop.ogg`, with its own gain (`music.ts`). Effects volume and music volume are separate settings. Do not punt a "boss sting" or generated chiptune at combo tier-up unless the user asks for a sting; they asked for a bed that can get louder, then brought their own loop.
- **Guest-first.** The game plays with no Firebase. Runs queue locally and upload on sign-in. Email accounts must verify (`canPost()` in rules) before a run is written.

## Standing constraints

- **Never deploy hosting.** The user deploys the app. Firestore rules were allowed when they asked, but the auto-reviewer blocks `firebase deploy` unless retried with `request_smart_mode_approval: true` and the exact `smart_mode_block_reason`. Do not deploy on a whim.
- **Do not revive the pacing plot script.** The user deleted it on purpose.
- **Do not commit unless asked.** Do not push unless asked.
- **Do not add product UI the user did not ask for** (extra settings, extra modes, extra copy). Match the quiet tone of the rest of the app.
- Tests exist because the pacing math, combo steps and language lengths are easy to break by "tuning". When you change `COMBO_TIERS` or `MISS_COMBO_PENALTY`, make tests read those constants — do not hard-code the old numbers.

## Layout (only what you will touch)

```
src/app/            shell, GameHost, config sentence
src/game/engine/    fixed-step loop, input, session
src/game/modes/     GameMode + registry; ink-invaders/
src/game/words/     languages, loader, picker, Thai graphemes
src/game/juice/     particles, shake, synth, music
src/game/cards/     print helpers + sumi (ensō, brush, hanko) for result cards
src/features/       auth, leaderboard, profile, progress, results, settings, streak
src/theme/          palettes, contract, globals
src/assets/avatars/ built-in 128×128 PNGs (id = file name; `custom` reserved)
src/assets/music/   looping bed
public/words/       one JSON list per language
firestore.rules     users, runs, leaderboard entries, avatars/{uid}
```

A new mode: implement `GameMode` in `src/game/modes/types.ts`, register it, give it a card (`details` + `card.draw` at 1080×1350 using `cards/print.ts` and `cards/sumi.ts`). A new language: add to `LANGUAGES`, add `public/words/{id}.json`, add the id to `validLang` in `firestore.rules`. Language ids are `[a-z0-9-]+`.

## Auth, faces, standings

- Providers: Google, GitHub, Microsoft, Facebook, email. Email sign-up confirms password, then verifies by **link** (not OTP). Unverified users play locally; rules `canPost()` block writes. `named` flag → `NamePrompt` on first sign-in. Profile (name + face) is the same form in the prompt and in the account menu.
- Avatars: glob of `src/assets/avatars/*.png`. Uploads are centre-cropped and resized client-side to 128×128 PNG (`resizeAvatar.ts`), stored as base64 in `avatars/{uid}` `{png, updatedAt}` (≤100000 chars) so Storage/Blaze is not required. Account and leaderboard `avatar` is an id or `'custom'`. `useAvatarCache` + `fetchAvatars` (chunks of 30). Saving a built-in face must not delete a kept custom picture — only delete `avatars/{uid}` when switching *away* from `custom`.
- Leaderboard path: `leaderboards/{mode}_{lang}_{tier}_{period}/entries/{uid}`. Periods `all`, `week-YYYY-Www`, `day-YYYY-MM-DD` (UTC). Entry updates allowed for a better score **or** an owner profile edit of `{name, avatar}` only. `setProfile` walks MODES × LANGUAGES × TIERS × PERIODS to rename old entries.
- Record page: "speed over time" charts **one set** (mode · language · tier), defaulting to the most-played, with a picker if there are several. Chart has a y-axis, average line, best dot, real dates — never `preserveAspectRatio="none"` on labelled SVG. "Days played" is a 20-week calendar with month names, weekday labels and a less/more legend. Dedupe runs by `startedAt` when merging remote + local.

## Lessons (do not repeat)

1. **The user said "boss sound" and meant a theme that swells, not a sting.** A synthesized brass hit on tier-up was "too much". Laptop speakers also ate the first version because it lived under ~150 Hz. If you synthesize anything, put energy in the midrange and measure it. The current bed is a real OGG; volume is independent of effects.
2. **Orange fire is off-theme.** Jagged CSS/canvas flames looked like a different game. Ink = round, watery, palette-coloured blooms and splatters. Combo chrome that "looks weird" (tiny SVG flames next to ×N) should become a stamp/splatter/seal, not more decoration.
3. **Effects on the page must stay out of the way of words.** Edge treatments, not a frame of spikes. Combo art must not cover the "combo" label or clip off the top-right.
4. **Vanilla Extract cannot select descendants** (`& > span:first-child` throws at transform time; `tsc` will not catch it). Put child styles on the child. A bad selector takes down the whole stylesheet and the page renders unstyled.
5. **macOS is case-insensitive.** `fire.ts` next to `Fire.tsx` made Vite resolve the component to the renderer. Name the canvas helper after what it draws (`bloom.ts`, `flames.ts`) and the component `BloomLayer.tsx`.
6. **`erasableSyntaxOnly` forbids constructor parameter properties.** Write the fields out.
7. **The embedded browser is a bad place to play the game.** The rAF loop stutters, so combo, blooms and music will not look like a real run. Preview isolated effects (force a tier on the HUD, draw a bloom overlay). Do not declare a juice change "verified in play" from that browser.
8. **Dev server launched with `&` dies in the sandbox.** Background it as a real Shell job with permissions. Vite HMR cache after a case-clash needs a rename, not a reload.
9. **Do not plot every language on one speed chart.** Mixing English and Thai looks like noise. One set at a time.
10. **Rules lag code.** `validLang`, avatar regex `^[a-z0-9-]{1,32}$`, and `avatars/{uid}` must be deployed or new languages, uploads and settings sync fail silently. Hosting is still not yours to deploy.
11. **Firebase stays out of first paint.** Auth/leaderboard/avatar fetches are dynamic imports. Do not statically import `features/leaderboard/api` from something on the idle screen.
12. **Forcing `useAuth` state via CDP does not survive `sync()`.** To look at NamePrompt / ProfileForm, open the account menu.

## Tooling quirks

- Lint warnings that already exist and are accepted: `View.tsx` immutability on enemy/hud refs, `LeaderboardPage.tsx` and `GameHost.tsx` set-state-in-effect. Do not "fix" them in passing.
- oxlint `only-export-components`: keep ids/art out of a components-only file if it starts complaining again.
- Word glob `public/words/*.json`; old `public/words/en|th` directories are gone.
- Thai matching is grapheme-aware (`src/game/words/graphemes.ts`). Do not split Thai with `.length` / `[i]`.
- `prefers-reduced-motion` kills bloom animation, combo callout brush, shake, and cuts particle counts. Honour it.

## Current juice wiring (so you do not reintroduce old paths)

- Page heat: `BloomLayer` `level = max(0, mult - 1)` (off at ×1, on from ×2, out on dying/over).
- Combo HUD: `ComboSeal` (hanko, size from `tierLook`) + optional `ComboCallout` on tier-up (brush + big seal).
- Music: `GameHost` drives `music.play/quiet/stop` from phase; `synth.unlock()` on first key also `music.attach`s the same AudioContext. Do not start music from `GameSession` unless you remove the host path — two owners will double-start.
- `audio.boss` still exists and `mode.ts` still calls it on tier-up ≥ ×3. The user called that sting too much; the looping bed is the theme. If you touch combo audio, ask, or drop the sting and leave the chime / bed.

## Verify

- `npx tsc -b`, `npx vitest run`, `npx oxlint src`, `npm run build`.
- UI: exercise the changed flow in the browser (not one screenshot). Check the other pages that share the state you touched. If you cannot (no file-upload, no Firestore, rAF throttled), say so.
- After a Vanilla Extract edit, watch the Vite terminal; a bad selector fails at transform, not at `tsc`.
