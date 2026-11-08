import { useEffect, useMemo, useState } from 'react'

import { GRADE_LABELS, formatDue, ratingToGrade } from '../lib/fsrs'
import type {
  Correctness,
  Difficulty,
  Flashcard,
  StudyRating,
} from '../types'
import { TagFilter } from './TagFilter'

type StudySessionProps = {
  pool: Flashcard[]
  tags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onClearTags: () => void
  onReview: (id: string, rating: StudyRating) => Promise<void>
  totalCards: number
}

type Phase = 'prompt' | 'grade' | 'empty'

export function StudySession({
  pool,
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
  onReview,
  totalCards,
}: StudySessionProps) {
  const [index, setIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [selectedBoolean, setSelectedBoolean] = useState<boolean | null>(null)
  const [phase, setPhase] = useState<Phase>('prompt')
  const [correctness, setCorrectness] = useState<Correctness | null>(null)
  const [busy, setBusy] = useState(false)

  const dueByTag = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const card of pool) {
      for (const tag of card.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return counts
  }, [pool])

  const card = pool[index] ?? null

  function resetPrompt(nextPhase: Phase = 'prompt') {
    setSelectedOptionId(null)
    setSelectedBoolean(null)
    setCorrectness(null)
    setPhase(nextPhase)
  }

  useEffect(() => {
    setIndex(0)
    resetPrompt(pool.length === 0 ? 'empty' : 'prompt')
  }, [selectedTags.join('|'), pool.length === 0])

  useEffect(() => {
    if (pool.length === 0) {
      setPhase('empty')
      return
    }
    if (index >= pool.length) {
      setIndex(0)
      resetPrompt('prompt')
    }
  }, [pool, index])

  async function submitRating(difficulty: Difficulty) {
    if (!card || !correctness) return
    setBusy(true)
    try {
      await onReview(card.id, { correctness, difficulty })
      resetPrompt('prompt')
      // After review the card usually leaves the due pool; stay at same index.
      setIndex((current) => {
        if (pool.length <= 1) return 0
        return current >= pool.length - 1 ? 0 : current
      })
    } finally {
      setBusy(false)
    }
  }

  function chooseOption(optionId: string) {
    if (!card || card.type !== 'multiple' || phase !== 'prompt') return
    setSelectedOptionId(optionId)
    const wasRight = optionId === card.correctOptionId
    setCorrectness(wasRight ? 'right' : 'wrong')
    setPhase('grade')
  }

  function chooseBoolean(value: boolean) {
    if (!card || card.type !== 'trueFalse' || phase !== 'prompt') return
    setSelectedBoolean(value)
    const wasRight = value === card.correctBoolean
    setCorrectness(wasRight ? 'right' : 'wrong')
    setPhase('grade')
  }

  function revealOpenAnswer() {
    if (!card || card.type !== 'open' || phase !== 'prompt') return
    setPhase('grade')
  }

  function markOpenCorrectness(value: Correctness) {
    if (!card || card.type !== 'open' || phase !== 'grade') return
    setCorrectness(value)
  }

  function previewGrade(difficulty: Difficulty) {
    if (!correctness) return ''
    return GRADE_LABELS[ratingToGrade({ correctness, difficulty })]
  }

  function promptHint(current: Flashcard) {
    if (current.type === 'open') {
      return 'Recall the answer, then reveal to check yourself.'
    }
    if (current.type === 'trueFalse') {
      return 'Choose true or false to reveal the answer.'
    }
    return 'Pick an option to reveal the answer.'
  }

  return (
    <section className="study-layout">
      <aside className="panel study-sidebar">
        <div className="stat-stack">
          <div>
            <p className="eyebrow">Study pool</p>
            <p className="stat-value">{pool.length}</p>
            <p className="muted small">due now</p>
          </div>
          <div>
            <p className="eyebrow">Library</p>
            <p className="stat-value">{totalCards}</p>
            <p className="muted small">total cards</p>
          </div>
        </div>
        <TagFilter
          tags={tags}
          selected={selectedTags}
          onToggle={onToggleTag}
          onClear={onClearTags}
          dueByTag={dueByTag}
        />
        <p className="muted small">
          The pool is every card whose FSRS due time is now or earlier
          {selectedTags.length > 0
            ? ', matching at least one selected tag'
            : ''}
          .
        </p>
      </aside>

      <div className="panel study-stage">
        {phase === 'empty' || !card ? (
          <div className="empty-state">
            <h2>You are caught up</h2>
            <p className="muted">
              No cards are due
              {selectedTags.length > 0 ? ' for the selected tags' : ''}. Create
              more cards or check back when scheduled reviews arrive.
            </p>
          </div>
        ) : (
          <>
            <div className="study-meta">
              <span className="eyebrow">
                Card {Math.min(index + 1, pool.length)} of {pool.length}
              </span>
              <span className="muted small">Was due {formatDue(card.fsrs)}</span>
            </div>
            <h2 className="question">{card.question}</h2>
            <div className="tag-row compact">
              {card.tags.map((tag) => (
                <span key={tag} className="tag static">
                  {tag}
                </span>
              ))}
            </div>

            {card.type === 'multiple' ? (
              <div className="choices" role="group" aria-label="Answer choices">
                {card.options.map((option) => {
                  const selected = selectedOptionId === option.id
                  const showResult = phase === 'grade'
                  const isCorrect = option.id === card.correctOptionId
                  let className = 'choice'
                  if (showResult && isCorrect) className += ' choice-correct'
                  if (showResult && selected && !isCorrect) {
                    className += ' choice-wrong'
                  }
                  if (selected) className += ' choice-selected'
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={className}
                      disabled={phase !== 'prompt'}
                      onClick={() => chooseOption(option.id)}
                    >
                      {option.text}
                    </button>
                  )
                })}
              </div>
            ) : null}

            {card.type === 'trueFalse' ? (
              <div
                className="choices true-false-choices"
                role="group"
                aria-label="True or false"
              >
                {([true, false] as const).map((value) => {
                  const selected = selectedBoolean === value
                  const showResult = phase === 'grade'
                  const isCorrect = value === card.correctBoolean
                  let className = 'choice'
                  if (showResult && isCorrect) className += ' choice-correct'
                  if (showResult && selected && !isCorrect) {
                    className += ' choice-wrong'
                  }
                  if (selected) className += ' choice-selected'
                  return (
                    <button
                      key={value ? 'true' : 'false'}
                      type="button"
                      className={className}
                      disabled={phase !== 'prompt'}
                      onClick={() => chooseBoolean(value)}
                    >
                      {value ? 'True' : 'False'}
                    </button>
                  )
                })}
              </div>
            ) : null}

            {card.type === 'open' && phase === 'prompt' ? (
              <div className="open-prompt">
                <button
                  type="button"
                  className="button primary"
                  onClick={revealOpenAnswer}
                >
                  Reveal answer
                </button>
              </div>
            ) : null}

            {phase === 'grade' ? (
              <div className="grade-panel">
                {card.type === 'open' ? (
                  <>
                    <p className="answer-reveal">
                      <strong>Answer:</strong> {card.answer}
                    </p>
                    {correctness === null ? (
                      <>
                        <p className="muted small">
                          Compare what you recalled. Was it right or wrong?
                        </p>
                        <div className="grade-actions self-grade-actions">
                          <button
                            type="button"
                            className="button primary"
                            onClick={() => markOpenCorrectness('right')}
                          >
                            I got it right
                          </button>
                          <button
                            type="button"
                            className="button danger"
                            onClick={() => markOpenCorrectness('wrong')}
                          >
                            I got it wrong
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className={correctness === 'right' ? 'ok' : 'error'}>
                          Marked as {correctness === 'right' ? 'right' : 'wrong'}.
                        </p>
                        <p className="muted small">
                          Now rate difficulty — FSRS uses that (wrong answers
                          always schedule as Again).
                        </p>
                        <div className="grade-actions">
                          {(['hard', 'good', 'easy'] as Difficulty[]).map(
                            (difficulty) => (
                              <button
                                key={difficulty}
                                type="button"
                                className={
                                  correctness === 'wrong'
                                    ? 'button danger'
                                    : 'button primary'
                                }
                                disabled={busy}
                                onClick={() => submitRating(difficulty)}
                              >
                                {correctness === 'right' ? 'Right' : 'Wrong'} ·{' '}
                                {difficulty}{' '}
                                <span className="button-hint">
                                  ({previewGrade(difficulty)})
                                </span>
                              </button>
                            ),
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className={correctness === 'right' ? 'ok' : 'error'}>
                      {correctness === 'right' ? 'Correct.' : 'Not quite.'}
                    </p>
                    <p className="answer-reveal">
                      <strong>Answer:</strong> {card.answer}
                    </p>
                    <p className="muted small">
                      You marked this{' '}
                      <strong>
                        {correctness === 'right' ? 'right' : 'wrong'}
                      </strong>
                      . Now rate difficulty — FSRS uses that (wrong answers
                      always schedule as Again).
                    </p>
                    <div className="grade-actions">
                      {(['hard', 'good', 'easy'] as Difficulty[]).map(
                        (difficulty) => (
                          <button
                            key={difficulty}
                            type="button"
                            className={
                              correctness === 'wrong'
                                ? 'button danger'
                                : 'button primary'
                            }
                            disabled={busy}
                            onClick={() => submitRating(difficulty)}
                          >
                            {correctness === 'right' ? 'Right' : 'Wrong'} ·{' '}
                            {difficulty}{' '}
                            <span className="button-hint">
                              ({previewGrade(difficulty)})
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="muted small">{promptHint(card)}</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
