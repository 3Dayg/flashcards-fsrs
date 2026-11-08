import { useMemo, useState } from 'react'

import { GRADE_LABELS, formatDue, ratingToGrade } from '../lib/fsrs'
import { formatAccuracy } from '../lib/progress'
import type {
  Correctness,
  Difficulty,
  Flashcard,
  PracticeSession,
  SessionSummary,
  StudyRating,
} from '../types'

type StudySessionProps = {
  session: PracticeSession
  cardsById: Map<string, Flashcard>
  onReview: (
    id: string,
    rating: StudyRating,
    sessionId: string,
  ) => Promise<void>
  onFinish: (summary: SessionSummary) => void
}

type Phase = 'prompt' | 'grade' | 'summary'

type CompletedReview = {
  cardId: string
  correctness: Correctness
}

export function StudySession({
  session,
  cardsById,
  onReview,
  onFinish,
}: StudySessionProps) {
  const [index, setIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [selectedBoolean, setSelectedBoolean] = useState<boolean | null>(null)
  const [phase, setPhase] = useState<Phase>('prompt')
  const [correctness, setCorrectness] = useState<Correctness | null>(null)
  const [busy, setBusy] = useState(false)
  const [completed, setCompleted] = useState<CompletedReview[]>([])
  const [endedEarly, setEndedEarly] = useState(false)

  const plannedSize = session.plannedSize
  const cardId = session.cardIds[index] ?? null
  const card = cardId ? (cardsById.get(cardId) ?? null) : null
  const remaining = Math.max(plannedSize - completed.length, 0)

  const summary: SessionSummary = useMemo(
    () => ({
      sessionId: session.id,
      plannedSize,
      completed: completed.length,
      correct: completed.filter((item) => item.correctness === 'right').length,
      endedEarly,
    }),
    [session.id, plannedSize, completed, endedEarly],
  )

  function resetPrompt(nextPhase: Phase = 'prompt') {
    setSelectedOptionId(null)
    setSelectedBoolean(null)
    setCorrectness(null)
    setPhase(nextPhase)
  }

  function buildSummary(
    reviews: CompletedReview[],
    early: boolean,
  ): SessionSummary {
    return {
      sessionId: session.id,
      plannedSize,
      completed: reviews.length,
      correct: reviews.filter((item) => item.correctness === 'right').length,
      endedEarly: early,
    }
  }

  function finishSession(reviews: CompletedReview[], early: boolean) {
    const next = buildSummary(reviews, early)
    setEndedEarly(early)
    setCompleted(reviews)
    if (reviews.length === 0) {
      onFinish(next)
      return
    }
    setPhase('summary')
  }

  async function submitRating(difficulty: Difficulty) {
    if (!card || !correctness) return
    setBusy(true)
    try {
      await onReview(card.id, { correctness, difficulty }, session.id)
      const nextCompleted = [
        ...completed,
        { cardId: card.id, correctness },
      ]
      setCompleted(nextCompleted)

      if (nextCompleted.length >= plannedSize) {
        finishSession(nextCompleted, false)
        return
      }

      setIndex((current) => current + 1)
      resetPrompt('prompt')
    } finally {
      setBusy(false)
    }
  }

  function endSessionEarly() {
    if (busy) return
    // Only completed reviews are measured; unfinished cards are abandoned.
    finishSession(completed, true)
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

  if (phase === 'summary') {
    const accuracy =
      summary.completed === 0 ? null : summary.correct / summary.completed
    return (
      <section className="panel study-stage session-summary">
        <div className="empty-state">
          <p className="eyebrow">
            {summary.endedEarly ? 'Session ended early' : 'Session complete'}
          </p>
          <h2>
            {summary.completed} of {summary.plannedSize} completed
          </h2>
          <p className="muted">
            {summary.completed === 0
              ? 'No cards were finished, so nothing was counted.'
              : `${summary.correct} correct · ${formatAccuracy(accuracy)} accuracy. Only finished cards count toward your progress.`}
          </p>
          <div className="stat-stack summary-stats">
            <div>
              <p className="eyebrow">Completed</p>
              <p className="stat-value">{summary.completed}</p>
            </div>
            <div>
              <p className="eyebrow">Accuracy</p>
              <p className="stat-value">{formatAccuracy(accuracy)}</p>
            </div>
            <div>
              <p className="eyebrow">Skipped</p>
              <p className="stat-value">
                {Math.max(summary.plannedSize - summary.completed, 0)}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="button primary"
            onClick={() => onFinish(summary)}
          >
            Back to dashboard
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="study-layout">
      <aside className="panel study-sidebar">
        <div className="stat-stack">
          <div>
            <p className="eyebrow">Done</p>
            <p className="stat-value">{completed.length}</p>
            <p className="muted small">of {plannedSize} planned</p>
          </div>
          <div>
            <p className="eyebrow">Left</p>
            <p className="stat-value">{remaining}</p>
            <p className="muted small">in this session</p>
          </div>
        </div>
        <button
          type="button"
          className="button ghost"
          disabled={busy}
          onClick={endSessionEarly}
        >
          End session
        </button>
        <p className="muted small">
          Ending early keeps only the cards you already finished. The rest are
          skipped with no review logged.
        </p>
      </aside>

      <div className="panel study-stage">
        {!card ? (
          <div className="empty-state">
            <h2>Session interrupted</h2>
            <p className="muted">
              A card from this session is no longer available.
            </p>
            <button
              type="button"
              className="button primary"
              onClick={endSessionEarly}
            >
              End session
            </button>
          </div>
        ) : (
          <>
            <div className="study-meta">
              <span className="eyebrow">
                Card {Math.min(completed.length + 1, plannedSize)} of{' '}
                {plannedSize}
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
                          Marked as{' '}
                          {correctness === 'right' ? 'right' : 'wrong'}.
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
