import type { Card as FsrsCard, Grade } from 'ts-fsrs'

/** One multiple-choice option on a flashcard. */
export type ChoiceOption = {
  id: string
  text: string
}

/** User-facing flashcard content plus FSRS scheduling state. */
export type Flashcard = {
  id: string
  question: string
  answer: string
  /** Typically four choices; exactly one matches `correctOptionId`. */
  options: ChoiceOption[]
  correctOptionId: string
  tags: string[]
  createdAt: string
  updatedAt: string
  /** Serialized FSRS card fields (dates as ISO strings in storage). */
  fsrs: StoredFsrsCard
}

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
