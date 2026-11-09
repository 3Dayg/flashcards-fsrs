import { describe, expect, it } from 'vitest'

import { newFsrsCard } from './fsrs'
import {
  buildDeckBackup,
  backupFilename,
  formatBackupEmailBody,
} from './backup'
import type { Flashcard } from '../types'

function openCard(question: string, answer: string): Flashcard {
  const now = '2026-11-09T08:00:00.000Z'
  return {
    id: `card_${question}`,
    type: 'open',
    question,
    answer,
    tags: ['test'],
    createdAt: now,
    updatedAt: now,
    fsrs: newFsrsCard(new Date(now)),
  }
}

describe('backup', () => {
  it('builds a versioned deck backup', () => {
    const cards = [openCard('Q1', 'A1')]
    const backup = buildDeckBackup(cards, [], '2026-11-09T08:15:00.000Z')
    expect(backup).toMatchObject({
      app: 'flashcards-fsrs',
      version: 1,
      exportedAt: '2026-11-09T08:15:00.000Z',
      cards,
      reviews: [],
    })
    expect(backupFilename(backup.exportedAt)).toBe(
      'flashcards-fsrs-backup-2026-11-09.json',
    )
  })

  it('formats an email body with cards and attach instructions', () => {
    const backup = buildDeckBackup(
      [openCard('What is FSRS?', 'A scheduler')],
      [],
      '2026-11-09T08:15:00.000Z',
    )
    const body = formatBackupEmailBody(
      backup,
      'flashcards-fsrs-backup-2026-11-09.json',
    )
    expect(body).toContain('Flashcards FSRS backup')
    expect(body).toContain('Please attach that file')
    expect(body).toContain('What is FSRS?')
    expect(body).toContain('A scheduler')
  })

  it('truncates very large decks in the email body', () => {
    const cards = Array.from({ length: 80 }, (_, index) =>
      openCard(
        `Question number ${index} with enough text to fill the mailto body limit quickly`,
        `Answer number ${index} also padded with extra detail for length`,
      ),
    )
    const backup = buildDeckBackup(cards, [], '2026-11-09T08:15:00.000Z')
    const body = formatBackupEmailBody(
      backup,
      'flashcards-fsrs-backup-2026-11-09.json',
    )
    expect(body.length).toBeLessThanOrEqual(1900)
    expect(body).toMatch(/…and \d+ more cards? in the attached JSON/)
  })
})
