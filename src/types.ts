import type { Card as FsrsCard, Grade } from 'ts-fsrs'

/** Supported flashcard prompt styles. */
export type CardType = 'multiple' | 'trueFalse' | 'open'

/** One multiple-choice option on a flashcard. */
export type ChoiceOption = {
  id: string
  text: string
}

type FlashcardBase = {
  id: string
  question: string
  /** Canonical answer / short explanation shown after answering or revealing. */
  answer: string
  tags: string[]
  createdAt: string
  updatedAt: string
  /** Serialized FSRS card fields (dates as ISO strings in storage). */
  fsrs: StoredFsrsCard
}

export type MultipleChoiceCard = FlashcardBase & {
  type: 'multiple'
  /** Typically four choices; exactly one matches `correctOptionId`. */
  options: ChoiceOption[]
  correctOptionId: string
}

export type TrueFalseCard = FlashcardBase & {
  type: 'trueFalse'
  correctBoolean: boolean
}

export type OpenCard = FlashcardBase & {
  type: 'open'
}

/** User-facing flashcard content plus FSRS scheduling state. */
export type Flashcard = MultipleChoiceCard | TrueFalseCard | OpenCard

export type StoredFsrsCard = {
  due: string
  stability: number
  difficulty: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: FsrsCard['state']
  last_review?: string | null
}

export type Correctness = 'right' | 'wrong'
export type Difficulty = 'hard' | 'good' | 'easy'

export type StudyRating = {
  correctness: Correctness
  difficulty: Difficulty
}

export type AppView = 'study' | 'library' | 'create' | 'edit'

export type GradeMapping = {
  grade: Grade
  label: string
}

export type DueStats = {
  dueNow: number
  total: number
  byTag: Record<string, number>
}

/** One completed review logged during a practice session. */
export type ReviewEvent = {
  id: string
  cardId: string
  sessionId: string
  correctness: Correctness
  difficulty: Difficulty
  ratedAt: string
}

/** Snapshot of a practice run started from the Study dashboard. */
export type PracticeSession = {
  id: string
  cardIds: string[]
  plannedSize: number
  startedAt: string
}

export type SessionSummary = {
  sessionId: string
  plannedSize: number
  completed: number
  correct: number
  endedEarly: boolean
}

export type WindowStats = {
  reviews: number
  correct: number
  accuracy: number | null
}

/** Dashboard progress derived from cards + review history. */
export type ProgressStats = {
  dueNow: number
  total: number
  neverStudied: number
  learning: number
  review: number
  today: WindowStats
  last7Days: WindowStats
  previous7Days: WindowStats
  accuracyDelta: number | null
  volumeDelta: number
  streakDays: number
}

export const SESSION_PRESETS = [10, 25, 50] as const
export type SessionPreset = (typeof SESSION_PRESETS)[number]

/** Human-readable labels for card types in the UI. */
export const CARD_TYPE_LABELS: Record<CardType, string> = {
  multiple: 'Multiple choice',
  trueFalse: 'True / false',
  open: 'Open question',
}
