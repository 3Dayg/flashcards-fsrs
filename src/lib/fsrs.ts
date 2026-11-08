import {
  Rating,
  createEmptyCard,
  fsrs,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs'

import type { StoredFsrsCard, StudyRating } from '../types'

const scheduler = fsrs({
  enable_fuzz: false,
  enable_short_term: true,
})

/** Map right/wrong + difficulty into an FSRS grade. */
export function ratingToGrade(rating: StudyRating): Grade {
  if (rating.correctness === 'wrong') {
    return Rating.Again
  }
  switch (rating.difficulty) {
    case 'hard':
      return Rating.Hard
    case 'easy':
      return Rating.Easy
    default:
      return Rating.Good
  }
}

export function newFsrsCard(now = new Date()): StoredFsrsCard {
  return serializeFsrsCard(createEmptyCard(now))
}

export function serializeFsrsCard(card: FsrsCard): StoredFsrsCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  }
}

export function deserializeFsrsCard(stored: StoredFsrsCard): FsrsCard {
  return {
    due: new Date(stored.due),
    stability: stored.stability,
    difficulty: stored.difficulty,
    scheduled_days: stored.scheduled_days,
    learning_steps: stored.learning_steps,
    reps: stored.reps,
    lapses: stored.lapses,
    state: stored.state,
    last_review: stored.last_review ? new Date(stored.last_review) : undefined,
  }
}

export function scheduleAfterReview(
  stored: StoredFsrsCard,
  rating: StudyRating,
  now = new Date(),
): { next: StoredFsrsCard; grade: Grade; due: Date } {
  const grade = ratingToGrade(rating)
  const current = deserializeFsrsCard(stored)
  const { card } = scheduler.next(current, now, grade)
  return {
    next: serializeFsrsCard(card),
    grade,
    due: card.due,
  }
}

export function isDue(stored: StoredFsrsCard, now = new Date()): boolean {
  return new Date(stored.due).getTime() <= now.getTime()
}

export function formatDue(stored: StoredFsrsCard, now = new Date()): string {
  const due = new Date(stored.due)
  const ms = due.getTime() - now.getTime()
  if (ms <= 0) return 'Due now'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `in ${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `in ${hours}h`
  const days = Math.round(hours / 24)
  return `in ${days}d`
}

export const GRADE_LABELS: Record<Grade, string> = {
  [Rating.Again]: 'Again',
  [Rating.Hard]: 'Hard',
  [Rating.Good]: 'Good',
  [Rating.Easy]: 'Easy',
}
