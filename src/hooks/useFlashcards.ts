import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createCard,
  deleteCard,
  listCards,
  saveCard,
  updateCard,
  type FlashcardInput,
} from '../lib/db'
import { scheduleAfterReview } from '../lib/fsrs'
import { seedDemoCardsIfEmpty } from '../lib/seed'
import { buildStudyPool, collectTags } from '../lib/study'
import type { Flashcard, StudyRating } from '../types'

export function useFlashcards() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await seedDemoCardsIfEmpty()
      const next = await listCards()
      setCards(next)
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
  }, [])

  const reviewCard = useCallback(
    async (id: string, rating: StudyRating) => {
      const existing = cards.find((card) => card.id === id)
      if (!existing) return
      const { next } = scheduleAfterReview(existing.fsrs, rating)
      const updated: Flashcard = {
        ...existing,
        fsrs: next,
        updatedAt: new Date().toISOString(),
      }
      await saveCard(updated)
      setCards((prev) => prev.map((card) => (card.id === id ? updated : card)))
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
    tags,
    selectedTags,
    studyPool,
    loading,
    error,
    refresh,
    addCard,
    editCard,
    removeCard,
    reviewCard,
    toggleTag,
    clearTags,
  }
}
