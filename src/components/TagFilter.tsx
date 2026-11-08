type TagFilterProps = {
  tags: string[]
  selected: string[]
  onToggle: (tag: string) => void
  onClear: () => void
  dueByTag?: Record<string, number>
}

export function TagFilter({
  tags,
  selected,
  onToggle,
  onClear,
  dueByTag,
}: TagFilterProps) {
  if (tags.length === 0) {
    return (
      <p className="muted small">
        No tags yet. Add tags when you create a card to filter the study pool.
      </p>
    )
  }

  return (
    <div className="tag-filter">
      <div className="tag-filter-header">
        <span className="eyebrow">Filter by tag</span>
        {selected.length > 0 ? (
          <button type="button" className="text-button" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>
      <div className="tag-row" role="group" aria-label="Tag filters">
        {tags.map((tag) => {
          const active = selected.includes(tag)
          const due = dueByTag?.[tag]
          return (
            <button
              key={tag}
              type="button"
              className={active ? 'tag tag-active' : 'tag'}
              aria-pressed={active}
              onClick={() => onToggle(tag)}
            >
              {tag}
              {typeof due === 'number' ? (
                <span className="tag-count">{due}</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
