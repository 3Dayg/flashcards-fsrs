import { formatDue } from '../lib/fsrs'
import type { Flashcard } from '../types'

type CardListProps = {
  cards: Flashcard[]
  onEdit: (card: Flashcard) => void
  onDelete: (id: string) => void
}

export function CardList({ cards, onEdit, onDelete }: CardListProps) {
  if (cards.length === 0) {
    return (
      <p className="muted">
        No flashcards yet. Create one to start building your study pool.
      </p>
    )
  }

  return (
    <ul className="card-list">
      {cards.map((card) => (
        <li key={card.id} className="library-item">
          <div className="library-item-main">
            <h3>{card.question}</h3>
            <p className="muted small">{card.answer}</p>
            <div className="tag-row compact">
              {card.tags.length === 0 ? (
                <span className="muted small">untagged</span>
              ) : (
                card.tags.map((tag) => (
                  <span key={tag} className="tag static">
                    {tag}
                  </span>
                ))
              )}
            </div>
            <p className="muted small">Next review: {formatDue(card.fsrs)}</p>
          </div>
          <div className="library-actions">
            <button
              type="button"
              className="button ghost"
              onClick={() => onEdit(card)}
            >
              Edit
            </button>
            <button
              type="button"
              className="button danger"
              onClick={() => {
                if (
                  window.confirm('Delete this flashcard? This cannot be undone.')
                ) {
                  onDelete(card.id)
                }
              }}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
