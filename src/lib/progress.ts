import { State } from 'ts-fsrs'

import type {
  Flashcard,
  ProgressStats,
  ReviewEvent,
  WindowStats,
} from '../types'
import { isDue } from './fsrs'

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dayKey(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  const local = startOfLocalDay(date)
  const y = local.getFullYear()
  const m = String(local.getMonth() + 1).padStart(2, '0')
  const d = String(local.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function windowStats(
  reviews: ReviewEvent[],
  startMs: number,
  endMs: number,
): WindowStats {
  let total = 0
  let correct = 0
  for (const review of reviews) {
    const t = new Date(review.ratedAt).getTime()
    if (t < startMs || t >= endMs) continue
    total += 1
    if (review.correctness === 'right') correct += 1
  }
  return {
    reviews: total,
    correct,
    accuracy: total === 0 ? null : correct / total,
  }
}

function streakDays(reviews: ReviewEvent[], now: Date): number {
  if (reviews.length === 0) return 0
  const daysWithReviews = new Set(reviews.map((review) => dayKey(review.ratedAt)))
  let cursor = startOfLocalDay(now)
  // If nothing today yet, start counting from yesterday so an active streak
  // is not broken mid-day before the first review.
  if (!daysWithReviews.has(dayKey(cursor))) {
    cursor = new Date(cursor.getTime() - 86_400_000)
  }
  let streak = 0
  while (daysWithReviews.has(dayKey(cursor))) {
    streak += 1
    cursor = new Date(cursor.getTime() - 86_400_000)
  }
  return streak
}

/** Build dashboard progress metrics from the deck and review log. */
export function computeProgressStats(
  cards: Flashcard[],
  reviews: ReviewEvent[],
  now = new Date(),
): ProgressStats {
  const todayStart = startOfLocalDay(now)
  const last7Start = new Date(todayStart.getTime() - 6 * 86_400_000)
  const previous7Start = new Date(last7Start.getTime() - 7 * 86_400_000)
  const nowMs = now.getTime()
  const todayStartMs = todayStart.getTime()
  const last7StartMs = last7Start.getTime()
  const previous7StartMs = previous7Start.getTime()

  let dueNow = 0
  let neverStudied = 0
  let learning = 0
  let review = 0
  for (const card of cards) {
    if (isDue(card.fsrs, now)) dueNow += 1
    if (!card.fsrs.reps) neverStudied += 1
    if (
      card.fsrs.state === State.Learning ||
      card.fsrs.state === State.Relearning
    ) {
      learning += 1
    } else if (card.fsrs.state === State.Review) {
      review += 1
    }
  }

  const today = windowStats(reviews, todayStartMs, nowMs + 1)
  const last7Days = windowStats(reviews, last7StartMs, nowMs + 1)
  const previous7Days = windowStats(
    reviews,
    previous7StartMs,
    last7StartMs,
  )

  const accuracyDelta =
    last7Days.accuracy === null || previous7Days.accuracy === null
      ? null
      : last7Days.accuracy - previous7Days.accuracy

  return {
    dueNow,
    total: cards.length,
    neverStudied,
    learning,
    review,
    today,
    last7Days,
    previous7Days,
    accuracyDelta,
    volumeDelta: last7Days.reviews - previous7Days.reviews,
    streakDays: streakDays(reviews, now),
  }
}

export function formatAccuracy(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

export function formatDelta(value: number | null, asPercent = false): string {
  if (value === null) return '—'
  const scaled = asPercent ? Math.round(value * 100) : value
  if (scaled === 0) return asPercent ? '0 pts' : '0'
  const sign = scaled > 0 ? '+' : ''
  return asPercent ? `${sign}${scaled} pts` : `${sign}${scaled}`
}
