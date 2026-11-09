import { describe, expect, it } from 'vitest'

import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  buildBackup,
  parseBackup,
  parseBackupJson,
} from './backup'
import { newFsrsCard } from './fsrs'
import type { Flashcard, ReviewEvent } from '../types'

function multipleCard(): Flashcard {
  const now = '2026-03-01T12:00:00.000Z'
  return {
    id: 'card_test',
    type: 'multiple',
    question: 'What does FSRS stand for?',
    answer: 'Free Spaced Repetition Scheduler',
    options: [
      { id: 'opt_a', text: 'Fast Study Recall System' },
      { id: 'opt_b', text: 'Free Spaced Repetition Scheduler' },
      { id: 'opt_c', text: 'Fixed Sequence Review Standard' },
      { id: 'opt_d', text: 'Forgetting Slope Regression Score' },
    ],
    correctOptionId: 'opt_b',
    tags: ['fsrs', 'basics'],
    createdAt: now,
    updatedAt: now,
    fsrs: newFsrsCard(new Date(now)),
  }
}

describe('backup', () => {
  const card = multipleCard()

  const review: ReviewEvent = {
    id: 'rev_test',
    cardId: card.id,
    sessionId: 'session_test',
    correctness: 'right',
    difficulty: 'good',
    ratedAt: '2026-03-01T12:00:00.000Z',
  }

  it('round-trips cards and reviews', () => {
    const doc = buildBackup([card], [review], '2026-03-09T10:00:00.000Z')
    expect(doc).toMatchObject({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: '2026-03-09T10:00:00.000Z',
    })
    expect(doc.cards).toHaveLength(1)
    expect(doc.reviews).toEqual([review])

    const parsed = parseBackup(JSON.parse(JSON.stringify(doc)))
    expect(parsed.cards[0]).toMatchObject({
      id: card.id,
      type: 'multiple',
      question: card.question,
      answer: card.answer,
      correctOptionId: 'opt_b',
    })
    expect(parsed.reviews).toEqual([review])
  })

  it('parses JSON text for a minimal valid fixture', () => {
    const text = JSON.stringify(buildBackup([card], [review]))
    const parsed = parseBackupJson(text)
    expect(parsed.cards).toHaveLength(1)
    expect(parsed.reviews).toHaveLength(1)
  })

  it('rejects invalid backup files', () => {
    expect(() => parseBackup(null)).toThrow(/JSON object/)
    expect(() => parseBackup({ format: 'other', version: 1 })).toThrow(
      /Not a Flashcards FSRS backup/,
    )
    expect(() =>
      parseBackup({ format: BACKUP_FORMAT, version: 99, cards: [], reviews: [] }),
    ).toThrow(/Unsupported backup version/)
    expect(() =>
      parseBackup({ format: BACKUP_FORMAT, version: 1, cards: 'nope', reviews: [] }),
    ).toThrow(/cards must be an array/)
    expect(() =>
      parseBackup({
        format: BACKUP_FORMAT,
        version: 1,
        cards: [{ id: 'broken' }],
        reviews: [],
      }),
    ).toThrow(/card at index 0/)
    expect(() =>
      parseBackup({
        format: BACKUP_FORMAT,
        version: 1,
        cards: [],
        reviews: [{ id: 'broken' }],
      }),
    ).toThrow(/review at index 0/)
    expect(() => parseBackupJson('{not json')).toThrow(/not valid JSON/)
  })
})
