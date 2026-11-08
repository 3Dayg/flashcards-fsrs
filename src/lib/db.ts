import Dexie, { type EntityTable } from 'dexie'

import type { Flashcard } from '../types'
import { newFsrsCard } from './fsrs'
import { createId } from './id'

export type FlashcardInput = {
  question: string
  answer: string
  options: string[]
  correctIndex: number
  tags: string[]
}

type FlashcardsDatabase = Dexie & {
  cards: EntityTable<Flashcard, 'id'>
}

const db = new Dexie('flashcards-fsrs') as FlashcardsDatabase

db.version(1).stores({
  cards: 'id, *tags, updatedAt, fsrs.due',
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

function toFlashcard(input: FlashcardInput, existing?: Flashcard): Flashcard {
  const now = new Date().toISOString()
  const options = input.options.map((text, index) => ({
    id: existing?.options[index]?.id ?? createId('opt'),
    text: text.trim(),
  }))

  if (options.length < 2) {
    throw new Error('A flashcard needs at least two options.')
  }
  if (input.correctIndex < 0 || input.correctIndex >= options.length) {
    throw new Error('Correct option index is out of range.')
  }
  if (!input.question.trim()) {
    throw new Error('Question is required.')
  }
  if (!input.answer.trim()) {
    throw new Error('Answer is required.')
  }
  if (options.some((option) => !option.text)) {
    throw new Error('Every option needs text.')
  }

  return {
    id: existing?.id ?? createId('card'),
    question: input.question.trim(),
    answer: input.answer.trim(),
    options,
    correctOptionId: options[input.correctIndex].id,
    tags: normalizeTags(input.tags),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    fsrs: existing?.fsrs ?? newFsrsCard(),
  }
}

export async function listCards(): Promise<Flashcard[]> {
  const cards = await db.cards.toArray()
  return cards.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getCard(id: string): Promise<Flashcard | undefined> {
  return db.cards.get(id)
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
  const card = toFlashcard(input, existing)
  await db.cards.put(card)
  return card
}

export async function saveCard(card: Flashcard): Promise<void> {
  await db.cards.put(card)
}

export async function deleteCard(id: string): Promise<void> {
  await db.cards.delete(id)
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

export { db }
