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

/** Human-readable labels for card types in the UI. */
export const CARD_TYPE_LABELS: Record<CardType, string> = {
  multiple: 'Multiple choice',
  trueFalse: 'True / false',
  open: 'Open question',
}
