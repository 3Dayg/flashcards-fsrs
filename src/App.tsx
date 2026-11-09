import { useMemo, useState } from 'react'

import { CardForm } from './components/CardForm'
import { CardList } from './components/CardList'
import { StudyDashboard } from './components/StudyDashboard'
import { StudySession } from './components/StudySession'
import { useFlashcards } from './hooks/useFlashcards'
import type {
  AppView,
  Flashcard,
  PracticeSession,
  SessionPreset,
} from './types'

export default function App() {
  const {
    cards,
    tags,
    selectedTags,
    studyPool,
    progress,
    loading,
    error,
    addCard,
    editCard,
    removeCard,
    startSession,
    reviewCard,
    toggleTag,
    clearTags,
  } = useFlashcards()

  const [view, setView] = useState<AppView>('study')
  const [editing, setEditing] = useState<Flashcard | null>(null)
  const [session, setSession] = useState<PracticeSession | null>(null)

  const cardsById = useMemo(() => {
    const map = new Map<string, Flashcard>()
    for (const card of cards) map.set(card.id, card)
    return map
  }, [cards])

  const dueByTag = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const card of studyPool) {
      for (const tag of card.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return counts
  }, [studyPool])

  function beginSession(preset: SessionPreset) {
    const next = startSession(preset)
    if (next) setSession(next)
  }

  function leaveStudyViews() {
    setSession(null)
  }

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden="true" />
      <header className="topbar">
        <div className="brand-block">
          <p className="brand">Flashcards FSRS</p>
          <p className="brand-sub">
            Spaced-repetition deck that keeps your cards across deploys.
          </p>
        </div>
        <nav className="nav" aria-label="Primary">
          <button
            type="button"
            className={view === 'study' ? 'nav-link active' : 'nav-link'}
            onClick={() => setView('study')}
          >
            Study
          </button>
          <button
            type="button"
            className={view === 'library' ? 'nav-link active' : 'nav-link'}
            onClick={() => {
              setEditing(null)
              leaveStudyViews()
              setView('library')
            }}
          >
            Library
          </button>
          <button
            type="button"
            className={
              view === 'create' || view === 'edit'
                ? 'nav-link active'
                : 'nav-link'
            }
            onClick={() => {
              setEditing(null)
              leaveStudyViews()
              setView('create')
            }}
          >
            New card
          </button>
        </nav>
      </header>

      <main id="main" className="main">
        {loading ? <p className="muted">Loading your deck…</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {!loading && view === 'study' && !session ? (
          <StudyDashboard
            dueCount={studyPool.length}
            tags={tags}
            selectedTags={selectedTags}
            dueByTag={dueByTag}
            progress={progress}
            onToggleTag={toggleTag}
            onClearTags={clearTags}
            onStart={beginSession}
          />
        ) : null}

        {!loading && view === 'study' && session ? (
          <StudySession
            key={session.id}
            session={session}
            cardsById={cardsById}
            onReview={reviewCard}
            onFinish={() => setSession(null)}
          />
        ) : null}

        {!loading && view === 'library' ? (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Library</p>
                <h2>Your flashcards</h2>
              </div>
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  setEditing(null)
                  setView('create')
                }}
              >
                New card
              </button>
            </div>
            <CardList
              cards={cards}
              onEdit={(card) => {
                setEditing(card)
                setView('edit')
              }}
              onDelete={(id) => {
                void removeCard(id)
              }}
            />
          </section>
        ) : null}

        {!loading && (view === 'create' || view === 'edit') ? (
          <section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {view === 'edit' ? 'Edit' : 'Create'}
                </p>
                <h2>{view === 'edit' ? 'Update flashcard' : 'New flashcard'}</h2>
              </div>
            </div>
            <CardForm
              key={editing?.id ?? 'new'}
              initial={editing ?? undefined}
              submitLabel={view === 'edit' ? 'Update card' : 'Create card'}
              onCancel={() => {
                setEditing(null)
                setView('library')
              }}
              onSubmit={async (input) => {
                if (editing) {
                  await editCard(editing.id, input)
                } else {
                  await addCard(input)
                }
                setEditing(null)
                setView('library')
              }}
            />
          </section>
        ) : null}
      </main>

      <footer className="footer muted small">
        Signed-in deploys keep your deck in a durable account database. Static
        GitHub Pages builds still use IndexedDB on this device.
      </footer>
    </div>
  )
}
