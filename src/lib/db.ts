import Dexie, { type EntityTable } from 'dexie'

import type { CardType, Flashcard, ReviewEvent } from '../types'
import { newFsrsCard } from './fsrs'
import { createId } from './id'

type FlashcardInputBase = {
  question: string
  answer: string
  tags: string[]
}

export type MultipleChoiceInput = FlashcardInputBase & {
  type: 'multiple'
  options: string[]
  correctIndex: number
}

export type TrueFalseInput = FlashcardInputBase & {
  type: 'trueFalse'
  correctBoolean: boolean
}

export type OpenInput = FlashcardInputBase & {
  type: 'open'
}

export type FlashcardInput =
  | MultipleChoiceInput
  | TrueFalseInput
  | OpenInput

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

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase()
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    result.push(tag)
  }
  return result
}

function baseFields(input: FlashcardInput, existing?: Flashcard) {
  const now = new Date().toISOString()
  if (!input.question.trim()) {
    throw new Error('Question is required.')
  }
  if (!input.answer.trim()) {
    throw new Error('Answer is required.')
  }
  return {
    id: existing?.id ?? createId('card'),
    question: input.question.trim(),
    answer: input.answer.trim(),
    tags: normalizeTags(input.tags),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    fsrs: existing?.fsrs ?? newFsrsCard(),
  }
}

function toFlashcard(input: FlashcardInput, existing?: Flashcard): Flashcard {
  const base = baseFields(input, existing)

  if (input.type === 'trueFalse') {
    return {
      ...base,
      type: 'trueFalse',
      correctBoolean: input.correctBoolean,
    }
  }

  if (input.type === 'open') {
    return {
      ...base,
      type: 'open',
    }
  }

  const existingOptions =
    existing?.type === 'multiple' ? existing.options : undefined
  const options = input.options.map((text, index) => ({
    id: existingOptions?.[index]?.id ?? createId('opt'),
    text: text.trim(),
  }))

  if (options.length < 2) {
    throw new Error('A flashcard needs at least two options.')
  }
  if (input.correctIndex < 0 || input.correctIndex >= options.length) {
    throw new Error('Correct option index is out of range.')
  }
  if (options.some((option) => !option.text)) {
    throw new Error('Every option needs text.')
  }

  return {
    ...base,
    type: 'multiple',
    options,
    correctOptionId: options[input.correctIndex].id,
  }
}

export async function listCards(): Promise<Flashcard[]> {
  const cards = await db.cards.toArray()
  return cards
    .map((card) => normalizeStoredCard(card))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Coerce legacy rows (no `type`) into the current Flashcard union. */
function normalizeStoredCard(raw: Flashcard): Flashcard {
  const type = (raw as { type?: CardType }).type ?? 'multiple'

  if (type === 'trueFalse') {
    const card = raw as Flashcard & { correctBoolean?: boolean }
    return {
      id: card.id,
      type: 'trueFalse',
      question: card.question,
      answer: card.answer,
      correctBoolean: Boolean(card.correctBoolean),
      tags: card.tags,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      fsrs: card.fsrs,
    }
  }

  if (type === 'open') {
    return {
      id: raw.id,
      type: 'open',
      question: raw.question,
      answer: raw.answer,
      tags: raw.tags,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      fsrs: raw.fsrs,
    }
  }

  const multiple = raw as Flashcard & {
    options?: { id: string; text: string }[]
    correctOptionId?: string
  }
  return {
    id: multiple.id,
    type: 'multiple',
    question: multiple.question,
    answer: multiple.answer,
    options: multiple.options ?? [],
    correctOptionId: multiple.correctOptionId ?? '',
    tags: multiple.tags,
    createdAt: multiple.createdAt,
    updatedAt: multiple.updatedAt,
    fsrs: multiple.fsrs,
  }
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
