# Flashcards FSRS

A client-only React flashcard app with multiple-choice questions, tags, and
[FSRS](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)
spaced repetition. Everything runs in the browser and persists to **IndexedDB**
on the user’s machine — no backend, suitable for **GitHub Pages**.

## Project structure

```
flashcards-fsrs/
├── .github/workflows/deploy-pages.yml  # build + deploy to GitHub Pages
├── public/                             # static assets
├── src/
│   ├── components/                     # Study, library, form, tag filter UI
│   ├── hooks/useFlashcards.ts          # deck state + CRUD + reviews
│   ├── lib/
│   │   ├── db.ts                       # Dexie / IndexedDB persistence
│   │   ├── fsrs.ts                     # FSRS grade mapping + scheduling
│   │   ├── seed.ts                     # first-run demo cards
│   │   └── study.ts                    # due pool + tag filtering
│   ├── App.tsx                         # Study / Library / Create views
│   ├── types.ts
│   └── index.css
├── index.html
├── package.json
└── vite.config.ts                      # base path /flashcards-fsrs/
```

## Run locally

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints (usually `http://localhost:5173/flashcards-fsrs/`).

Other scripts:

```bash
pnpm build    # production build into dist/
pnpm preview  # serve dist locally
```

## Deploy to GitHub Pages

1. Create a public GitHub repo named **`flashcards-fsrs`** (the Vite `base`
   path matches this name).
2. Push this project to the repo’s `main` branch.
3. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
   builds with pnpm and deploys the `dist/` folder on every push to `main`.

Site URL:

`https://<your-github-username>.github.io/flashcards-fsrs/`

If you rename the repository, change `base` in `vite.config.ts` to
`/<new-repo-name>/` and update this README.

### Manual deploy alternative

```bash
pnpm build
pnpm dlx gh-pages -d dist
```

Prefer the Actions workflow above so Pages stays in sync with `main`.

## How studying works

### Creating cards

Each flashcard has a question, a short answer explanation, up to four
multiple-choice options (one marked correct), and comma-separated **tags**.

### Study pool

The Study view builds a pool of cards whose FSRS **due** time is now or earlier.
Optional tag filters keep only cards that have at least one selected tag
(logical OR). Cards sort by due time so the oldest debt comes first.

### Rating after an answer

1. Choose a multiple-choice option (the UI records right vs wrong).
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

### Tags

Tags are stored on each card in IndexedDB. The library lists them; Study uses
them to narrow the due pool by topic.

### Persistence

[Dexie](https://dexie.org/) wraps IndexedDB (`flashcards-fsrs` database). Data
never leaves the browser. Clearing site data deletes the deck.
