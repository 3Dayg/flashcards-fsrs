import { useRef, useState } from 'react'

import {
  buildBackup,
  downloadBackup,
  parseBackupJson,
  type DeckBackup,
} from '../lib/backup'
import type { Flashcard, ReviewEvent } from '../types'

type DeckTransferProps = {
  cards: Flashcard[]
  reviews: ReviewEvent[]
  onImport: (doc: DeckBackup) => Promise<{ cards: number; reviews: number }>
}

export function DeckTransfer({ cards, reviews, onImport }: DeckTransferProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleDownload() {
    setError(null)
    const doc = buildBackup(cards, reviews)
    downloadBackup(doc)
    setMessage(
      `Downloaded backup with ${doc.cards.length} cards and ${doc.reviews.length} reviews.`,
    )
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const text = await file.text()
      const doc = parseBackupJson(text)
      const confirmed = window.confirm(
        `Import ${doc.cards.length} cards and ${doc.reviews.length} reviews? Existing items with the same id will be updated; nothing else is deleted.`,
      )
      if (!confirmed) return
      const result = await onImport(doc)
      setMessage(
        `Imported ${result.cards} cards and ${result.reviews} reviews.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import backup.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="deck-transfer">
      <p className="muted small">
        Download a JSON backup to email or keep offline. Import merges by id and
        keeps scheduling state.
      </p>
      <div className="deck-transfer-actions">
        <button
          type="button"
          className="button ghost"
          onClick={handleDownload}
          disabled={busy}
        >
          Download backup
        </button>
        <button
          type="button"
          className="button ghost"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Importing…' : 'Import backup'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            void handleFile(event.target.files?.[0])
          }}
        />
      </div>
      {message ? <p className="muted small">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  )
}
