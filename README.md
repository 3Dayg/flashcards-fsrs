# Flashcards FSRS

A client-only React flashcard app with multiple-choice, true/false, and open
recall questions, tags, and
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
│   │   ├── backup.ts                   # JSON backup download / import
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
  prior week. Metrics use a local review log in IndexedDB.

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

### Tags

Tags are stored on each card in IndexedDB. The library lists them; Study uses
them to narrow the due pool by topic.

### Persistence

[Dexie](https://dexie.org/) wraps IndexedDB (`flashcards-fsrs` database). Data
never leaves the browser. Clearing site data deletes the deck.

### Backup and import

In **Library**, use **Download backup** to save a JSON copy of your cards and
review history (including FSRS scheduling). Use **Import backup** to merge a
previously downloaded file by id — existing cards/reviews with the same id are
updated; nothing else is deleted.
