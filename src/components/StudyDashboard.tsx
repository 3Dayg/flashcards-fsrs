import {
  formatAccuracy,
  formatDelta,
} from '../lib/progress'
import type {
  ProgressStats,
  SessionPreset,
} from '../types'
import { SESSION_PRESETS } from '../types'
import { TagFilter } from './TagFilter'

type StudyDashboardProps = {
  dueCount: number
  tags: string[]
  selectedTags: string[]
  dueByTag: Record<string, number>
  progress: ProgressStats
  onToggleTag: (tag: string) => void
  onClearTags: () => void
  onStart: (preset: SessionPreset) => void
}

export function StudyDashboard({
  dueCount,
  tags,
  selectedTags,
  dueByTag,
  progress,
  onToggleTag,
  onClearTags,
  onStart,
}: StudyDashboardProps) {
  const canStart = dueCount > 0
  const dueHint = canStart
    ? `${dueCount} due${selectedTags.length > 0 ? ' for selected tags' : ''}`
    : selectedTags.length > 0
      ? 'No cards due for selected tags'
      : 'No cards due right now'

  return (
    <section className="study-layout study-dashboard">
      <aside className="panel progress-strip">
        <div className="stat-stack strip-stats">
          <div>
            <p className="eyebrow">Due now</p>
            <p className="stat-value">{progress.dueNow}</p>
            <p className="muted small strip-caption">ready to practice</p>
          </div>
          <div>
            <p className="eyebrow">Library</p>
            <p className="stat-value">{progress.total}</p>
            <p className="muted small strip-caption">total cards</p>
          </div>
        </div>
        <div className="progress-strip-filters">
          <TagFilter
            tags={tags}
            selected={selectedTags}
            onToggle={onToggleTag}
            onClear={onClearTags}
            dueByTag={dueByTag}
          />
        </div>
        <div className="progress-strip-actions">
          <div className="practice-launch">
            <div className="practice-copy">
              <p className="eyebrow">Practice</p>
              <h2>Start a session</h2>
              <p className="muted small">{dueHint}</p>
            </div>
            <div className="preset-actions" role="group" aria-label="Session size">
              {SESSION_PRESETS.map((preset) => {
                const size = Math.min(preset, dueCount)
                const disabled = !canStart
                const label = disabled
                  ? `Start ${preset}-card session, none due`
                  : size < preset
                    ? `Start ${preset}-card session, ${size} available`
                    : `Start ${preset}-card session`
                return (
                  <button
                    key={preset}
                    type="button"
                    className="button primary preset-button"
                    disabled={disabled}
                    aria-label={label}
                    title={label}
                    onClick={() => onStart(preset)}
                  >
                    <span className="preset-count" aria-hidden="true">
                      {preset}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      <section className="panel study-stage progress-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Progress</p>
            <h2>How you are improving</h2>
          </div>
        </div>

        <div className="stat-stack progress-grid">
          <div>
            <p className="eyebrow">Today</p>
            <p className="stat-value">
              {formatAccuracy(progress.today.accuracy)}
            </p>
            <p className="muted small">
              {progress.today.reviews} review
              {progress.today.reviews === 1 ? '' : 's'}
            </p>
          </div>
          <div>
            <p className="eyebrow">Streak</p>
            <p className="stat-value">{progress.streakDays}</p>
            <p className="muted small">
              day{progress.streakDays === 1 ? '' : 's'} in a row
            </p>
          </div>
          <div>
            <p className="eyebrow">7-day accuracy</p>
            <p className="stat-value">
              {formatAccuracy(progress.last7Days.accuracy)}
            </p>
            <p className="muted small">
              {formatDelta(progress.accuracyDelta, true)} vs prior week
            </p>
          </div>
          <div>
            <p className="eyebrow">7-day volume</p>
            <p className="stat-value">{progress.last7Days.reviews}</p>
            <p className="muted small">
              {formatDelta(progress.volumeDelta)} vs prior week
            </p>
          </div>
        </div>

        <p className="muted small progress-deck-line">
          Deck: {progress.neverStudied} never studied · {progress.learning}{' '}
          learning · {progress.review} in review.
        </p>
      </section>
    </section>
  )
}
