import type { Flashcard, ReviewEvent } from '../types'
import type { FlashcardInput } from './cardFactory'
import * as local from './localDb'
import * as remote from './remoteApi'

export type { FlashcardInput } from './cardFactory'
export type ReviewInput = local.ReviewInput

export type StorageMode = 'remote' | 'local'

let modePromise: Promise<StorageMode> | undefined

async function detectMode(): Promise<StorageMode> {
  if (await remote.probeRemoteStore()) return 'remote'
  return 'local'
}

export async function getStorageMode(): Promise<StorageMode> {
  modePromise ??= detectMode().catch((error: unknown) => {
    modePromise = undefined
    throw error
  })
  return modePromise
}

export async function listCards(): Promise<Flashcard[]> {
  return (await getStorageMode()) === 'remote'
    ? remote.listCards()
    : local.listCards()
}

export async function createCard(input: FlashcardInput): Promise<Flashcard> {
  return (await getStorageMode()) === 'remote'
    ? remote.createCard(input)
    : local.createCard(input)
}

export async function updateCard(
  id: string,
  input: FlashcardInput,
): Promise<Flashcard> {
  return (await getStorageMode()) === 'remote'
    ? remote.updateCard(id, input)
    : local.updateCard(id, input)
}

export async function saveCard(card: Flashcard): Promise<void> {
  return (await getStorageMode()) === 'remote'
    ? remote.saveCard(card)
    : local.saveCard(card)
}

export async function deleteCard(id: string): Promise<void> {
  return (await getStorageMode()) === 'remote'
    ? remote.deleteCard(id)
    : local.deleteCard(id)
}

export async function countCards(): Promise<number> {
  return (await getStorageMode()) === 'remote'
    ? remote.countCards()
    : local.countCards()
}

export async function addReview(input: ReviewInput): Promise<ReviewEvent> {
  return (await getStorageMode()) === 'remote'
    ? remote.addReview(input)
    : local.addReview(input)
}

export async function saveReview(event: ReviewEvent): Promise<ReviewEvent> {
  return (await getStorageMode()) === 'remote'
    ? remote.saveReview(event)
    : local.saveReview(event)
}

export async function listReviews(): Promise<ReviewEvent[]> {
  return (await getStorageMode()) === 'remote'
    ? remote.listReviews()
    : local.listReviews()
}
