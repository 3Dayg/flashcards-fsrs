import { useMemo, useState, type FormEvent } from 'react'

import type { FlashcardInput } from '../lib/db'
import type { Flashcard } from '../types'

type CardFormProps = {
  initial?: Flashcard
  onSubmit: (input: FlashcardInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

const EMPTY_OPTIONS = ['', '', '', '']

export function CardForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save card',
}: CardFormProps) {
  const initialOptions = useMemo(() => {
    if (!initial) return EMPTY_OPTIONS
    const texts = initial.options.map((option) => option.text)
    while (texts.length < 4) texts.push('')
    return texts.slice(0, 4)
  }, [initial])

  const [question, setQuestion] = useState(initial?.question ?? '')
  const [answer, setAnswer] = useState(initial?.answer ?? '')
  const [options, setOptions] = useState<string[]>(initialOptions)
  const [correctIndex, setCorrectIndex] = useState(() => {
    if (!initial) return 0
    const index = initial.options.findIndex(
      (option) => option.id === initial.correctOptionId,
    )
    return index >= 0 ? index : 0
  })
  const [tagsText, setTagsText] = useState(initial?.tags.join(', ') ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
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
        question,
        answer,
        options: compact.length >= 2 ? compact : filled,
        correctIndex: nextCorrect,
        tags: tagsText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
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

  return (
    <form className="card-form panel" onSubmit={handleSubmit}>
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
        <span>Answer (shown after you choose)</span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={2}
          required
          placeholder="Short explanation or canonical answer"
        />
      </label>

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
