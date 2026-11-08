import { useState } from 'react'

import { CardForm } from './components/CardForm'
import { CardList } from './components/CardList'
import { StudySession } from './components/StudySession'
import { useFlashcards } from './hooks/useFlashcards'
import type { AppView, Flashcard } from './types'

export default function App() {
  const {
    cards,
    tags,
    selectedTags,
    studyPool,
    loading,
    error,
    addCard,
    editCard,
    removeCard,
    reviewCard,
    toggleTag,
    clearTags,
  } = useFlashcards()

  const [view, setView] = useState<AppView>('study')
  const [editing, setEditing] = useState<Flashcard | null>(null)

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden="true" />
      <header className="topbar">
        <div className="brand-block">
          <p className="brand">Flashcards FSRS</p>
          <p className="brand-sub">
            Local study deck with spaced repetition — no account, no server.
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
              setView('create')
            }}
          >
            New card
          </button>
        </nav>
      </header>

      <main id="main" className="main">
        {loading ? <p className="muted">Loading your local deck…</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {!loading && view === 'study' ? (
          <StudySession
            pool={studyPool}
            tags={tags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onClearTags={clearTags}
            onReview={reviewCard}
            totalCards={cards.length}
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
        Cards stay in IndexedDB on this device. Deployable as a static GitHub
        Pages site.
      </footer>
    </div>
  )
}
