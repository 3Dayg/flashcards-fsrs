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

  return (
    <section className="study-layout">
      <aside className="panel progress-strip">
        <div className="stat-stack strip-stats">
          <div>
            <p className="eyebrow">Due now</p>
            <p className="stat-value">{progress.dueNow}</p>
            <p className="muted small">ready to practice</p>
          </div>
          <div>
            <p className="eyebrow">Library</p>
            <p className="stat-value">{progress.total}</p>
            <p className="muted small">total cards</p>
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
          <p className="muted small strip-hint">
            Presets pull the oldest due cards
            {selectedTags.length > 0
              ? ' matching a selected tag'
              : ''}
            .
          </p>
        </div>
      </aside>

      <div className="dashboard-stack">
        <section className="panel study-stage">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Practice</p>
              <h2>Start a session</h2>
            </div>
          </div>
          <p className="muted">
            {canStart
              ? `${dueCount} card${dueCount === 1 ? '' : 's'} due${
                  selectedTags.length > 0 ? ' for these tags' : ''
                }. Pick how many to review.`
              : selectedTags.length > 0
                ? 'No cards are due for the selected tags.'
                : 'No cards are due. Create more cards or check back later.'}
          </p>
          <div className="preset-actions" role="group" aria-label="Session size">
            {SESSION_PRESETS.map((preset) => {
              const size = Math.min(preset, dueCount)
              const disabled = !canStart
              return (
                <button
                  key={preset}
                  type="button"
                  className="button primary preset-button"
                  disabled={disabled}
                  onClick={() => onStart(preset)}
                >
                  <span className="preset-count">{preset}</span>
                  <span className="button-hint">
                    {disabled
                      ? 'none due'
                      : size < preset
                        ? `${size} available`
                        : 'cards'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="panel study-stage">
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

          <div className="progress-footnotes muted small">
            <p>
              Deck: {progress.neverStudied} never studied · {progress.learning}{' '}
              learning · {progress.review} in review.
            </p>
            <p>
              Only completed cards count toward progress. Ending a session early
              skips the rest with no penalty.
            </p>
          </div>
        </section>
      </div>
    </section>
  )
}
