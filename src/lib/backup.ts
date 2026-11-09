import { CARD_TYPE_LABELS, type Flashcard, type ReviewEvent } from '../types'

export type DeckBackup = {
  app: 'flashcards-fsrs'
  version: 1
  exportedAt: string
  cards: Flashcard[]
  reviews: ReviewEvent[]
}

/** Soft limit so most mail clients can open the compose window. */
const MAILTO_BODY_LIMIT = 1800

export function buildDeckBackup(
  cards: Flashcard[],
  reviews: ReviewEvent[],
  exportedAt = new Date().toISOString(),
): DeckBackup {
  return {
    app: 'flashcards-fsrs',
    version: 1,
    exportedAt,
    cards,
    reviews,
  }
}

export function backupFilename(exportedAt: string): string {
  const day = exportedAt.slice(0, 10)
  return `flashcards-fsrs-backup-${day}.json`
}

function formatCardForMail(card: Flashcard, index: number): string {
  const lines = [
    `${index + 1}. [${CARD_TYPE_LABELS[card.type]}] ${card.question}`,
    `   Answer: ${card.answer}`,
  ]
  if (card.type === 'multiple') {
    lines.push(
      `   Options: ${card.options.map((option) => option.text).join(' | ')}`,
    )
  }
  if (card.type === 'trueFalse') {
    lines.push(`   Correct: ${card.correctBoolean ? 'True' : 'False'}`)
  }
  if (card.tags.length > 0) {
    lines.push(`   Tags: ${card.tags.join(', ')}`)
  }
  return lines.join('\n')
}

export function formatBackupEmailBody(
  backup: DeckBackup,
  filename: string,
): string {
  const header = [
    'Flashcards FSRS backup',
    `Exported: ${backup.exportedAt}`,
    `Cards: ${backup.cards.length}`,
    `Reviews: ${backup.reviews.length}`,
    '',
    `A full JSON backup was also downloaded as ${filename}.`,
    'Please attach that file to this email before sending.',
    '',
    'Cards:',
    '',
  ].join('\n')

  if (backup.cards.length === 0) {
    return `${header}(no cards yet)\n`
  }

  const cardBlocks = backup.cards.map((card, index) =>
    formatCardForMail(card, index),
  )
  let body = header
  let included = 0

  for (const block of cardBlocks) {
    const next =
      included === 0 ? `${body}${block}\n` : `${body}\n${block}\n`
    const remaining = backup.cards.length - (included + 1)
    const suffix =
      remaining > 0
        ? `\n…and ${remaining} more card${remaining === 1 ? '' : 's'} in the attached JSON.\n`
        : ''
    if ((next + suffix).length > MAILTO_BODY_LIMIT) {
      const omitted = backup.cards.length - included
      body += `\n…and ${omitted} more card${omitted === 1 ? '' : 's'} in the attached JSON.\n`
      return body
    }
    body = next
    included += 1
  }

  return body
}

export function downloadBackupJson(backup: DeckBackup, filename: string): void {
  const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function openBackupMailto(backup: DeckBackup, filename: string): void {
  const subject = `Flashcards FSRS backup (${filename.replace(/\.json$/i, '')})`
  const body = formatBackupEmailBody(backup, filename)
  const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = href
}

/** Download the JSON backup and open the user's mail client to send it. */
export function emailDeckBackup(
  cards: Flashcard[],
  reviews: ReviewEvent[],
): { filename: string; cardCount: number } {
  const backup = buildDeckBackup(cards, reviews)
  const filename = backupFilename(backup.exportedAt)
  downloadBackupJson(backup, filename)
  openBackupMailto(backup, filename)
  return { filename, cardCount: cards.length }
}
