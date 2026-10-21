# caret — type in ink

A minimalist, gamified typing game. Words drift down the page as ink-stamped enemies; type them to blot them out.

- React 19 + TypeScript, Vite, Radix Primitives, Vanilla Extract, Zustand
- Firebase Auth (Google) and Firestore for accounts, synced progress and standings
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

1. Create a project in the [Firebase console](https://console.firebase.google.com) and add a **Web app**.
2. Copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values from the web app config.
3. **Authentication → Sign-in method**: enable **Google**.
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

Periods are `all`, `week-YYYY-Www` and `day-YYYY-MM-DD` (UTC). Entries are written in a transaction only when they beat the existing score. The rules check ownership, the field set, value ranges and a plausible score ceiling (`chars × 80 + 100 × wave × (wave + 1)`). These checks stop casual tampering but not a determined cheater; server-side run validation (a Cloud Function replaying keystrokes) is the next step if standings matter.

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

Implement `GameMode<State>` from `src/game/modes/types.ts` (`init`, `update`, `onKey`, `render`, `isOver`, `result`, optional imperative `draw`) and add it to `MODES` in `src/game/modes/registry.ts`. It appears in the mode picker and gets its own standings automatically.

### Adding a language

Add an entry to `LANGUAGES` in `src/game/words/languages.ts`, word lists at `public/words/{id}/{easy,medium,hard,expert}.json`, and the code to `validLang` in `firestore.rules`.
