import type { Flashcard, ReviewEvent } from '../types'
import type { FlashcardInput } from './cardFactory'
import { createId } from './id'

export type ReviewInput = Omit<ReviewEvent, 'id'>

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(
      typeof data === 'object' && data && 'error' in data && data.error
        ? data.error
        : `Request failed (${response.status})`,
    )
  }
  return data
}

export async function probeRemoteStore(): Promise<boolean> {
  try {
    const response = await fetch('/api/cards', {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return false
    // Only use the durable API when the viewer is authenticated.
    return response.ok
  } catch {
    return false
  }
}

export async function listCards(): Promise<Flashcard[]> {
  const response = await fetch('/api/cards', {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })
  return parseJson<Flashcard[]>(response)
}

export async function createCard(input: FlashcardInput): Promise<Flashcard> {
  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })
  return parseJson<Flashcard>(response)
}

export async function updateCard(
  id: string,
  input: FlashcardInput,
): Promise<Flashcard> {
  const response = await fetch(`/api/cards/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })
  return parseJson<Flashcard>(response)
}

export async function saveCard(card: Flashcard): Promise<void> {
  const response = await fetch(`/api/cards/${encodeURIComponent(card.id)}`, {
    method: 'PUT',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ card }),
    cache: 'no-store',
  })
  await parseJson<Flashcard>(response)
}

export async function deleteCard(id: string): Promise<void> {
  const response = await fetch(`/api/cards/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok && response.status !== 204) {
    await parseJson<{ error?: string }>(response)
  }
}

export async function countCards(): Promise<number> {
  const cards = await listCards()
  return cards.length
}

export async function addReview(input: ReviewInput): Promise<ReviewEvent> {
  const event: ReviewEvent = {
    id: createId('rev'),
    ...input,
  }
  return saveReview(event)
}

export async function saveReview(event: ReviewEvent): Promise<ReviewEvent> {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(event),
    cache: 'no-store',
  })
  return parseJson<ReviewEvent>(response)
}

export async function listReviews(): Promise<ReviewEvent[]> {
  const response = await fetch('/api/reviews', {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })
  return parseJson<ReviewEvent[]>(response)
}
