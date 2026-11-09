# Flashcards FSRS

A React flashcard app with multiple-choice, true/false, and open recall
questions, tags, and
[FSRS](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)
spaced repetition.

**Durable storage:** when you run or publish the Next.js app (for example with
Cursor Apps), cards and review history are saved per signed-in user in Postgres,
so redeploys do not wipe your deck. Preview and production stay separated by
identity stage. Static GitHub Pages builds still use **IndexedDB** on the
device.

## Project structure

```
flashcards-fsrs/
├── .github/workflows/deploy-pages.yml  # static Vite build → GitHub Pages
├── app/                                # Next.js App Router + API routes
├── cursor/                             # Cursor app identity helper
├── cursor-app.json                     # requests Postgres for Cursor Apps
├── migrations/                         # additive SQL migrations
├── public/                             # static assets
├── scripts/migrate.mjs                 # applies migrations when DATABASE_URL is set
├── src/
│   ├── components/                     # Study, library, form, tag filter UI
│   ├── hooks/useFlashcards.ts          # deck state + CRUD + reviews
│   ├── lib/
│   │   ├── db.ts                       # remote API or IndexedDB facade
│   │   ├── localDb.ts                  # Dexie / IndexedDB persistence
│   │   ├── remoteApi.ts                # browser client for /api/*
│   │   ├── serverStore.ts              # Postgres-backed card/review CRUD
│   │   ├── fsrs.ts                     # FSRS grade mapping + scheduling
│   │   ├── seed.ts                     # first-run demo cards
│   │   └── study.ts                    # due pool + tag filtering
│   ├── App.tsx                         # Study / Library / Create views
│   └── types.ts
├── package.json
└── vite.config.ts                      # static Pages base path /flashcards-fsrs/
```

## Run locally

```bash
pnpm install
pnpm dev
```

Open the URL Next prints (usually `http://localhost:3000`). Local API calls use
an in-memory PGlite database and a simulated signed-in viewer.

Other scripts:

```bash
pnpm build         # Next.js production build + migrate (no-op without DATABASE_URL)
pnpm start         # serve the Next.js build
pnpm build:pages   # static Vite bundle for GitHub Pages
pnpm test          # Vitest
```

## Deploy

### Cursor Apps (durable deck)

Publish this app with Cursor Apps as **private** or **team** so sign-in is
available. The app declares Postgres in `cursor-app.json`; your cards are keyed
by viewer identity and survive redeploys.

### GitHub Pages (device-local deck)

1. Create a public GitHub repo named **`flashcards-fsrs`** (the Vite `base`
   path matches this name).
2. Push this project to the repo’s `main` branch.
3. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
   builds the static Vite bundle and deploys `dist/` on every push to `main`.

Site URL:

`https://<your-github-username>.github.io/flashcards-fsrs/`

If you rename the repository, change `base` in `vite.config.ts` to
`/<new-repo-name>/` and update this README.

## How studying works

### Creating cards

Each flashcard has a **type**, a question, a short answer explanation, and
comma-separated **tags**:

- **Multiple choice** — up to four options with one marked correct
- **True / false** — statement graded against a True or False answer
- **Open question** — recall the answer, then reveal and self-check

### Study dashboard and sessions

The Study view opens on a **dashboard**:

- Pick a practice size with **10 / 25 / 50** (uses up to that many due cards).
- Optional tag filters keep only cards that have at least one selected tag
  (logical OR). Cards sort by due time so the oldest debt comes first.
- Progress shows today’s accuracy, streak, and 7-day accuracy/volume vs the
  prior week.

During a session you can **End session** early. Only cards you finished are
rated and counted; unfinished cards are skipped with no penalty.

### Rating after an answer

1. Answer the prompt (pick an option, choose true/false, or reveal an open
   answer and mark whether your recall was right).
2. Rate difficulty: **hard**, **good**, or **easy**.

Those two signals map into a single FSRS grade:

| Correctness | Difficulty | FSRS grade |
| ----------- | ---------- | ---------- |
| Wrong       | any        | Again      |
| Right       | hard       | Hard       |
| Right       | good       | Good       |
| Right       | easy       | Easy       |

`ts-fsrs` then updates stability, difficulty, and the next `due` timestamp so
well-known cards reappear later and misses return sooner.

### Persistence

- **Next.js / Cursor Apps:** Postgres via `/api/cards` and `/api/reviews`, scoped
  to the signed-in viewer (`sub` + `stage`).
- **GitHub Pages / offline:** [Dexie](https://dexie.org/) wraps IndexedDB
  (`flashcards-fsrs` database) on the device. Clearing site data deletes that
  local deck.
