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
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div>
        <span className="block text-xs font-extrabold uppercase tracking-wide text-brand-600">{label}</span>
        <h2 className="mt-2 text-xl font-bold leading-tight text-ink">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
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
    <article className={`grid min-h-32 gap-2 rounded-lg border border-slate-200 border-t-4 bg-white p-4 shadow-sm ${toneClass[tone]}`}>
      <span className="text-sm font-semibold text-muted">{label}</span>
      <strong className="text-3xl font-bold leading-none text-ink">{value}</strong>
      <small className="text-sm font-semibold text-muted">{meta}</small>
    </article>
  )
}

type StatusChipProps = {
  children: ReactNode
  tone?: Tone
}

export function StatusChip({ children, tone = 'neutral' }: StatusChipProps) {
  return <span className={`inline-flex min-h-7 max-w-full items-center justify-center rounded-full border px-2.5 py-1 text-xs font-extrabold capitalize whitespace-nowrap ${chipClass[tone]}`}>{children}</span>
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
    return <p className="text-sm text-muted">{emptyText}</p>
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <article className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5" key={item.id}>
          <div>
            <strong className="block font-bold capitalize text-ink">{item.title}</strong>
            <small className="block text-sm text-muted">{item.meta}</small>
          </div>
          {item.value ? <StatusChip tone={item.tone}>{item.value}</StatusChip> : null}
        </article>
      ))}
    </div>
  )
}

const toneClass: Record<Tone, string> = {
  neutral: 'border-t-slate-300', info: 'border-t-blue-600', success: 'border-t-brand-600', warning: 'border-t-amber-600', danger: 'border-t-red-700',
}

const chipClass: Record<Tone, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-900', info: 'border-blue-300 bg-blue-100 text-blue-700', success: 'border-emerald-300 bg-emerald-100 text-emerald-800', warning: 'border-amber-300 bg-amber-100 text-amber-700', danger: 'border-red-200 bg-red-50 text-red-800',
}
