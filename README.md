# caret — type in ink

A minimalist, gamified typing game. Words drift down the page as ink-stamped enemies; type them to blot them out.

- React 19 + TypeScript, Vite, Radix Primitives, Vanilla Extract, Zustand
- Firebase Auth (Google, Microsoft, Facebook, email/password) and Firestore for accounts, synced progress and standings
- Plays fully offline as a guest when Firebase isn't configured

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # vitest
npm run build      # type-check + production build into dist/
```

Open the page and start typing — the first word starts a run. `tab` restarts at any time, `esc` pauses.

## Firebase setup

This repo is wired to the `caret-type` project (web app "caret web"). `.env.local` holds its config and is git-ignored, so on a fresh clone copy the values from Firebase console → Project settings → Your apps. Firestore rules and indexes are deployed with:

```sh
npx firebase-tools@latest deploy --only firestore:rules,firestore:indexes
```

To set up a different project from scratch:

1. Create a project in the [Firebase console](https://console.firebase.google.com) and add a **Web app**.
2. Copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values from the web app config.
3. **Authentication → Sign-in method**: enable the providers the app offers — **Google**, **Email/Password**, **Microsoft** and **Facebook**. Microsoft needs an Azure app registration (client ID + secret) and Facebook a Meta developer app (app ID + secret); both take `https://<project>.firebaseapp.com/__/auth/handler` as the OAuth redirect URI. A provider that isn't enabled shows "this sign-in method isn't switched on yet" instead of failing silently.
4. **Authentication → Settings → Authorized domains**: add every domain you'll serve from (`localhost` is there by default; add your `*.web.app` / custom domain before going live).
5. **Firestore Database**: create a database (production mode). Rules live in `firestore.rules`.
6. Put your project id in `.firebaserc` (replace `your-firebase-project-id`).

### Local emulators

Requires Java 11+.

```sh
npm run emulators      # Auth on 9099, Firestore on 8080, UI on 4000 (project demo-caret)
npm run dev:emulated   # Vite with VITE_USE_EMULATORS=true
```

No real Firebase config is needed for the emulators.

### Deploy (later)

```sh
npm run build
npx firebase-tools@latest deploy --only hosting,firestore
```

`firebase.json` serves `dist/` as a single-page app, caches hashed assets for a year and word lists for a day.

## Data model

| Path | Contents |
| --- | --- |
| `users/{uid}` | display name, photo, synced settings, streak, lifetime stats |
| `users/{uid}/runs/{id}` | every finished run (create-only) |
| `leaderboards/{mode}_{lang}_{tier}_{period}/entries/{uid}` | best run per player per board |

Periods are `all`, `week-YYYY-Www` and `day-YYYY-MM-DD` (UTC). Entries are written in a transaction only when they beat the existing score. The rules check ownership, the field set, value ranges and a plausible score ceiling (`chars × 100 + 100 × wave × (wave + 1)`). These checks stop casual tampering but not a determined cheater; server-side run validation (a Cloud Function replaying keystrokes) is the next step if standings matter.

## Project layout

```
src/
  app/          shell: layout, game host, config sentence, focus mode
  game/
    engine/     fixed-step loop, input normalisation, session
    modes/      GameMode interface + registry; ink-invaders/
    words/      word lists loader, picker, grapheme matcher (Thai-aware)
    juice/      particles, screen shake, procedural audio
  features/     auth, leaderboard, results, streak, progress, profile, settings
  theme/        palettes, theme contract, global styles
  ui/           Radix-based primitives
public/words/   word lists per language and tier
```

### Adding a game mode

Implement `GameMode<State, Details>` from `src/game/modes/types.ts` (`init`, `update`, `onKey`, `render`, `isOver`, `result`, optional imperative `draw`) and add it to `MODES` in `src/game/modes/registry.ts`. It appears in the mode picker and gets its own standings automatically.

Each mode also prints its own shareable result card: `details(state)` returns whatever the card needs (never stored), and `card.draw(ctx, input)` paints a 1080×1350 canvas using the helpers in `src/game/cards/print.ts` (stamps, blots, hatching, rough rules) and `src/game/cards/sumi.ts` (ensō, brush strokes, washi fibres, hanko seals). Ink Invaders prints a hanging scroll: the score inside a brushed ensō, a three-line verse, a stat ledger and red seals for personal best, streak and rank — see `src/game/modes/ink-invaders/card.ts`. A mode can also supply its own start screen (`Intro`) and a `seal` shown on the result panel.

### Guest runs

Guests can play freely. Runs are kept locally and queued; when the player signs in, the queue is uploaded, the best run per board is posted to the standings and the guest streak is merged in. A signed-in save that fails is queued the same way and retried on the next sign-in.

### Adding a language

Add an entry to `LANGUAGES` in `src/game/words/languages.ts`, word lists at `public/words/{id}/{easy,medium,hard,expert}.json`, and the code to `validLang` in `firestore.rules`.
