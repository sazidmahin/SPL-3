import type { ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

type SectionHeaderProps = {
  label: string
  title: string
  description?: string
  actions?: ReactNode
}

export function SectionHeader({ label, title, description, actions }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <span className="panel-label">{label}</span>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </div>
  )
}

type StatTileProps = {
  label: string
  value: string | number
  meta: string
  tone?: Tone
}

export function StatTile({ label, value, meta, tone = 'neutral' }: StatTileProps) {
  return (
    <article className={`stat-tile tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </article>
  )
}

type StatusChipProps = {
  children: ReactNode
  tone?: Tone
}

export function StatusChip({ children, tone = 'neutral' }: StatusChipProps) {
  return <span className={`status-chip tone-${tone}`}>{children}</span>
}

type CompactListItem = {
  id: string
  title: string
  meta: string
  value?: string
  tone?: Tone
}

type CompactListProps = {
  items: CompactListItem[]
  emptyText: string
}

export function CompactList({ items, emptyText }: CompactListProps) {
  if (items.length === 0) {
    return <p className="empty-copy">{emptyText}</p>
  }

  return (
    <div className="compact-list">
      {items.map((item) => (
        <article className="compact-list-item" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <small>{item.meta}</small>
          </div>
          {item.value ? <StatusChip tone={item.tone}>{item.value}</StatusChip> : null}
        </article>
      ))}
    </div>
  )
}
