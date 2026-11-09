import type { Flashcard, ReviewEvent } from '../types'
import { normalizeStoredCard } from './cardFactory'

export const BACKUP_FORMAT = 'flashcards-fsrs-backup' as const
export const BACKUP_VERSION = 1 as const

export type DeckBackup = {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: string
  cards: Flashcard[]
  reviews: ReviewEvent[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isReviewEvent(value: unknown): value is ReviewEvent {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.cardId === 'string' &&
    typeof value.sessionId === 'string' &&
    (value.correctness === 'right' || value.correctness === 'wrong') &&
    (value.difficulty === 'hard' ||
      value.difficulty === 'good' ||
      value.difficulty === 'easy') &&
    typeof value.ratedAt === 'string'
  )
}

function isFlashcardLike(value: unknown): value is Flashcard {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.question === 'string' &&
    typeof value.answer === 'string' &&
    Array.isArray(value.tags) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    isRecord(value.fsrs)
  )
}

/** Build a versioned backup document from the current deck. */
export function buildBackup(
  cards: Flashcard[],
  reviews: ReviewEvent[],
  exportedAt = new Date().toISOString(),
): DeckBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    cards: cards.map((card) => normalizeStoredCard(card)),
    reviews: [...reviews],
  }
}

/** Validate and normalize a parsed backup payload. */
export function parseBackup(raw: unknown): DeckBackup {
  if (!isRecord(raw)) {
    throw new Error('Backup file must be a JSON object.')
  }
  if (raw.format !== BACKUP_FORMAT) {
    throw new Error('Not a Flashcards FSRS backup file.')
  }
  if (raw.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${String(raw.version)}.`)
  }
  if (!Array.isArray(raw.cards)) {
    throw new Error('Backup cards must be an array.')
  }
  if (!Array.isArray(raw.reviews)) {
    throw new Error('Backup reviews must be an array.')
  }

  const cards: Flashcard[] = []
  for (const [index, item] of raw.cards.entries()) {
    if (!isFlashcardLike(item)) {
      throw new Error(`Backup card at index ${index} is invalid.`)
    }
    cards.push(normalizeStoredCard(item))
  }

  const reviews: ReviewEvent[] = []
  for (const [index, item] of raw.reviews.entries()) {
    if (!isReviewEvent(item)) {
      throw new Error(`Backup review at index ${index} is invalid.`)
    }
    reviews.push(item)
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt:
      typeof raw.exportedAt === 'string'
        ? raw.exportedAt
        : new Date().toISOString(),
    cards,
    reviews,
  }
}

/** Parse backup JSON text from a file or clipboard. */
export function parseBackupJson(text: string): DeckBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch {
    throw new Error('Backup file is not valid JSON.')
  }
  return parseBackup(raw)
}

function backupFilename(exportedAt: string): string {
  const day = exportedAt.slice(0, 10)
  return `flashcards-backup-${day || 'export'}.json`
}

/** Trigger a browser download of the backup JSON. */
export function downloadBackup(doc: DeckBackup): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = backupFilename(doc.exportedAt)
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
