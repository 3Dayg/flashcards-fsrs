import type { Flashcard } from '../types'
import { isDue } from './fsrs'

/** Due cards, optionally limited to selected tags (OR match). */
export function buildStudyPool(
  cards: Flashcard[],
  selectedTags: string[],
  now = new Date(),
): Flashcard[] {
  const tagSet = new Set(selectedTags.map((tag) => tag.toLowerCase()))
  return cards
    .filter((card) => isDue(card.fsrs, now))
    .filter((card) => {
      if (tagSet.size === 0) return true
      return card.tags.some((tag) => tagSet.has(tag))
    })
    .sort((a, b) => a.fsrs.due.localeCompare(b.fsrs.due))
}

export function collectTags(cards: Flashcard[]): string[] {
  const tags = new Set<string>()
  for (const card of cards) {
    for (const tag of card.tags) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b))
}
