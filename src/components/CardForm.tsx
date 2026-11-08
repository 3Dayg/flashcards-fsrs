import { useMemo, useState, type FormEvent } from 'react'

import type { FlashcardInput } from '../lib/db'
import type { CardType, Flashcard } from '../types'
import { CARD_TYPE_LABELS } from '../types'

type CardFormProps = {
  initial?: Flashcard
  onSubmit: (input: FlashcardInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

const EMPTY_OPTIONS = ['', '', '', '']
const CARD_TYPES: CardType[] = ['multiple', 'trueFalse', 'open']

function initialType(card?: Flashcard): CardType {
  return card?.type ?? 'multiple'
}

export function CardForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save card',
}: CardFormProps) {
  const initialOptions = useMemo(() => {
    if (!initial || initial.type !== 'multiple') return EMPTY_OPTIONS
    const texts = initial.options.map((option) => option.text)
    while (texts.length < 4) texts.push('')
    return texts.slice(0, 4)
  }, [initial])

  const [type, setType] = useState<CardType>(() => initialType(initial))
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [answer, setAnswer] = useState(initial?.answer ?? '')
  const [options, setOptions] = useState<string[]>(initialOptions)
  const [correctIndex, setCorrectIndex] = useState(() => {
    if (!initial || initial.type !== 'multiple') return 0
    const index = initial.options.findIndex(
      (option) => option.id === initial.correctOptionId,
    )
    return index >= 0 ? index : 0
  })
  const [correctBoolean, setCorrectBoolean] = useState(() =>
    initial?.type === 'trueFalse' ? initial.correctBoolean : true,
  )
  const [tagsText, setTagsText] = useState(initial?.tags.join(', ') ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const tags = tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      if (type === 'trueFalse') {
        await onSubmit({
          type: 'trueFalse',
          question,
          answer,
          correctBoolean,
          tags,
        })
        return
      }

      if (type === 'open') {
        await onSubmit({
          type: 'open',
          question,
          answer,
          tags,
        })
        return
      }

      const filled = options.map((text) => text.trim()).filter(Boolean)
      // Preserve correct choice after removing blank trailing options.
      const trimmedOptions = options.map((text) => text.trim())
      const compact: string[] = []
      let nextCorrect = 0
      trimmedOptions.forEach((text, index) => {
        if (!text) return
        if (index === correctIndex) nextCorrect = compact.length
        compact.push(text)
      })

      await onSubmit({
        type: 'multiple',
        question,
        answer,
        options: compact.length >= 2 ? compact : filled,
        correctIndex: nextCorrect,
        tags,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save card.')
    } finally {
      setBusy(false)
    }
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  const answerLabel =
    type === 'open'
      ? 'Answer (revealed after you recall)'
      : 'Answer (shown after you choose)'

  return (
    <form className="card-form panel" onSubmit={handleSubmit}>
      <fieldset className="field type-picker">
        <legend>Card type</legend>
        <div className="type-options" role="radiogroup" aria-label="Card type">
          {CARD_TYPES.map((value) => (
            <label key={value} className="type-option">
              <input
                type="radio"
                name="card-type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
              />
              <span>{CARD_TYPE_LABELS[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Question</span>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          required
          placeholder="What do you want to remember?"
        />
      </label>

      <label className="field">
        <span>{answerLabel}</span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={2}
          required
          placeholder={
            type === 'open'
              ? 'Canonical answer to compare after recalling'
              : 'Short explanation or canonical answer'
          }
        />
      </label>

      {type === 'multiple' ? (
        <fieldset className="field">
          <legend>Multiple-choice options</legend>
          <p className="muted small">
            Enter up to four options and mark the correct one.
          </p>
          <div className="option-editor">
            {options.map((option, index) => (
              <label key={index} className="option-row">
                <input
                  type="radio"
                  name="correct-option"
                  checked={correctIndex === index}
                  onChange={() => setCorrectIndex(index)}
                  aria-label={`Mark option ${index + 1} as correct`}
                />
                <input
                  type="text"
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {type === 'trueFalse' ? (
        <fieldset className="field">
          <legend>Correct answer</legend>
          <p className="muted small">Mark whether the statement is true or false.</p>
          <div className="type-options" role="radiogroup" aria-label="Correct answer">
            <label className="type-option">
              <input
                type="radio"
                name="correct-boolean"
                checked={correctBoolean === true}
                onChange={() => setCorrectBoolean(true)}
              />
              <span>True</span>
            </label>
            <label className="type-option">
              <input
                type="radio"
                name="correct-boolean"
                checked={correctBoolean === false}
                onChange={() => setCorrectBoolean(false)}
              />
              <span>False</span>
            </label>
          </div>
        </fieldset>
      ) : null}

      <label className="field">
        <span>Tags</span>
        <input
          type="text"
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder="biology, chapter-3, exam"
        />
        <span className="muted small">Comma-separated topics</span>
      </label>

      {error ? <p className="error">{error}</p> : null}

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="button ghost" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="button primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
