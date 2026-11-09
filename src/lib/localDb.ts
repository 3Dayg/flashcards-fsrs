import Dexie, { type EntityTable } from 'dexie'

import type { Flashcard, ReviewEvent } from '../types'
import {
  normalizeStoredCard,
  toFlashcard,
  type FlashcardInput,
} from './cardFactory'
import { createId } from './id'

export type { FlashcardInput } from './cardFactory'

type FlashcardsDatabase = Dexie & {
  cards: EntityTable<Flashcard, 'id'>
  reviews: EntityTable<ReviewEvent, 'id'>
}

const db = new Dexie('flashcards-fsrs') as FlashcardsDatabase

db.version(1).stores({
  cards: 'id, *tags, updatedAt, fsrs.due',
})

db.version(2)
  .stores({
    cards: 'id, *tags, updatedAt, fsrs.due',
  })
  .upgrade(async (tx) => {
    await tx
      .table('cards')
      .toCollection()
      .modify((card: Record<string, unknown>) => {
        if (!card.type) {
          card.type = 'multiple'
        }
      })
  })

db.version(3).stores({
  cards: 'id, *tags, updatedAt, fsrs.due',
  reviews: 'id, cardId, sessionId, ratedAt',
})

export async function listCards(): Promise<Flashcard[]> {
  const cards = await db.cards.toArray()
  return cards
    .map((card) => normalizeStoredCard(card))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getCard(id: string): Promise<Flashcard | undefined> {
  const card = await db.cards.get(id)
  return card ? normalizeStoredCard(card) : undefined
}

export async function createCard(input: FlashcardInput): Promise<Flashcard> {
  const card = toFlashcard(input)
  await db.cards.add(card)
  return card
}

export async function updateCard(
  id: string,
  input: FlashcardInput,
): Promise<Flashcard> {
  const existing = await db.cards.get(id)
  if (!existing) {
    throw new Error('Card not found.')
  }
  const card = toFlashcard(input, normalizeStoredCard(existing))
  await db.cards.put(card)
  return card
}

export async function saveCard(card: Flashcard): Promise<void> {
  await db.cards.put(card)
}

export async function deleteCard(id: string): Promise<void> {
  await db.transaction('rw', db.cards, db.reviews, async () => {
    await db.reviews.where('cardId').equals(id).delete()
    await db.cards.delete(id)
  })
}

export async function listAllTags(): Promise<string[]> {
  const cards = await db.cards.toArray()
  const tags = new Set<string>()
  for (const card of cards) {
    for (const tag of card.tags) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b))
}

export async function countCards(): Promise<number> {
  return db.cards.count()
}

export type ReviewInput = Omit<ReviewEvent, 'id'>

export async function addReview(input: ReviewInput): Promise<ReviewEvent> {
  const event: ReviewEvent = {
    id: createId('rev'),
    ...input,
  }
  await db.reviews.add(event)
  return event
}

export async function saveReview(event: ReviewEvent): Promise<ReviewEvent> {
  await db.reviews.put(event)
  return event
}

export async function listReviews(): Promise<ReviewEvent[]> {
  const reviews = await db.reviews.toArray()
  return reviews.sort((a, b) => b.ratedAt.localeCompare(a.ratedAt))
}

export async function listReviewsForSession(
  sessionId: string,
): Promise<ReviewEvent[]> {
  const reviews = await db.reviews.where('sessionId').equals(sessionId).toArray()
  return reviews.sort((a, b) => a.ratedAt.localeCompare(b.ratedAt))
}

export { db }
