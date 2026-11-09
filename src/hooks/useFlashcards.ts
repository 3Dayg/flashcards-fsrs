import { useCallback, useEffect, useMemo, useState } from 'react'

import type { DeckBackup } from '../lib/backup'
import {
  addReview,
  createCard,
  deleteCard,
  listCards,
  listReviews,
  saveCard,
  saveReview,
  updateCard,
  type FlashcardInput,
} from '../lib/db'
import { scheduleAfterReview } from '../lib/fsrs'
import { createId } from '../lib/id'
import { computeProgressStats } from '../lib/progress'
import { seedDemoCardsIfEmpty } from '../lib/seed'
import { buildStudyPool, collectTags, takeSessionCards } from '../lib/study'
import type {
  Flashcard,
  PracticeSession,
  ProgressStats,
  ReviewEvent,
  SessionPreset,
  StudyRating,
} from '../types'

export function useFlashcards() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [reviews, setReviews] = useState<ReviewEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await seedDemoCardsIfEmpty()
      const [nextCards, nextReviews] = await Promise.all([
        listCards(),
        listReviews(),
      ])
      setCards(nextCards)
      setReviews(nextReviews)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const tags = useMemo(() => collectTags(cards), [cards])
  const studyPool = useMemo(
    () => buildStudyPool(cards, selectedTags),
    [cards, selectedTags],
  )
  const progress: ProgressStats = useMemo(
    () => computeProgressStats(cards, reviews),
    [cards, reviews],
  )

  const addCard = useCallback(async (input: FlashcardInput) => {
    const card = await createCard(input)
    setCards((prev) => [card, ...prev])
    return card
  }, [])

  const editCard = useCallback(async (id: string, input: FlashcardInput) => {
    const card = await updateCard(id, input)
    setCards((prev) => prev.map((item) => (item.id === id ? card : item)))
    return card
  }, [])

  const removeCard = useCallback(async (id: string) => {
    await deleteCard(id)
    setCards((prev) => prev.filter((item) => item.id !== id))
    setReviews((prev) => prev.filter((item) => item.cardId !== id))
  }, [])

  const importBackup = useCallback(async (doc: DeckBackup) => {
    for (const card of doc.cards) {
      await saveCard(card)
    }
    for (const event of doc.reviews) {
      await saveReview(event)
    }
    const [nextCards, nextReviews] = await Promise.all([
      listCards(),
      listReviews(),
    ])
    setCards(nextCards)
    setReviews(nextReviews)
    return {
      cards: doc.cards.length,
      reviews: doc.reviews.length,
    }
  }, [])

  const startSession = useCallback(
    (preset: SessionPreset): PracticeSession | null => {
      const queue = takeSessionCards(cards, selectedTags, preset)
      if (queue.length === 0) return null
      return {
        id: createId('session'),
        cardIds: queue.map((card) => card.id),
        plannedSize: queue.length,
        startedAt: new Date().toISOString(),
      }
    },
    [cards, selectedTags],
  )

  const reviewCard = useCallback(
    async (id: string, rating: StudyRating, sessionId: string) => {
      const existing = cards.find((card) => card.id === id)
      if (!existing) return
      const { next } = scheduleAfterReview(existing.fsrs, rating)
      const updated: Flashcard = {
        ...existing,
        fsrs: next,
        updatedAt: new Date().toISOString(),
      }
      const event = await addReview({
        cardId: id,
        sessionId,
        correctness: rating.correctness,
        difficulty: rating.difficulty,
        ratedAt: new Date().toISOString(),
      })
      await saveCard(updated)
      setCards((prev) => prev.map((card) => (card.id === id ? updated : card)))
      setReviews((prev) => [event, ...prev])
    },
    [cards],
  )

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )
  }, [])

  const clearTags = useCallback(() => setSelectedTags([]), [])

  return {
    cards,
    reviews,
    tags,
    selectedTags,
    studyPool,
    progress,
    loading,
    error,
    refresh,
    addCard,
    editCard,
    removeCard,
    importBackup,
    startSession,
    reviewCard,
    toggleTag,
    clearTags,
  }
}
