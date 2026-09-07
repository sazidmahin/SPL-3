import { AlertTriangle, ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { PipelineStageRevision } from '../../domains/generationPipeline/types'
import { Button, inputClasses } from '../../shared/ui'

type Entity = Record<string, unknown>
type Props = {
  revision: PipelineStageRevision
  busy: boolean
  onSave: (payload: Record<string, unknown>, expectedVersion: number) => Promise<void>
  onDraftChange: (payload: Record<string, unknown>) => void
  onReviewStateChange: (ready: boolean) => void
}

const control = inputClasses()

function asRows(value: unknown): Entity[] {
  return Array.isArray(value) ? value.filter((item): item is Entity => typeof item === 'object' && item !== null) : []
}
function text(item: Entity, key: string) {
  return typeof item[key] === 'string' ? item[key] : ''
}
function identifier(label: string, prefix: string) {
  return `${prefix}_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || Date.now()}`
}
function warnings(item: Entity) {
  return Array.isArray(item.warnings) ? item.warnings.map(String) : []
}

export function ClassModelReview({ revision, busy, onSave, onDraftChange, onReviewStateChange }: Props) {
  const [draft, setDraft] = useState<Record<string, unknown>>(revision.payload)
  const [phase, setPhase] = useState<'classes' | 'relationships'>('classes')
  const classes = asRows(draft.classes)
  const relationships = asRows(draft.relationships)

  function updateDraft(updater: (current: Record<string, unknown>) => Record<string, unknown>) {
    setDraft((current) => {
      const next = updater(current)
      onDraftChange(next)
      return next
    })
  }
  function updateClass(index: number, patch: Entity) {
    updateDraft((current) => ({
      ...current,
      classes: asRows(current.classes).map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }))
  }
  function updateRelationship(index: number, patch: Entity) {
    updateDraft((current) => ({
      ...current,
      relationships: asRows(current.relationships).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }))
  }
  function addClass() {
    updateDraft((current) => ({
      ...current,
      classes: [
        ...asRows(current.classes),
        { id: identifier('NewClass', 'class'), name: 'NewClass', enabled: true, attributes: [], methods: [], sourceRequirementIds: [], warnings: [] },
      ],
    }))
  }
  function removeClass(index: number) {
    const removed = text(classes[index], 'id')
    if (window.confirm('Delete this class? Any relationships connected to it will also be removed.'))
      updateDraft((current) => ({
        ...current,
        classes: asRows(current.classes).filter((_, itemIndex) => itemIndex !== index),
        relationships: asRows(current.relationships).filter(
          (relationship) =>
            text(relationship, 'sourceClassId') !== removed && text(relationship, 'targetClassId') !== removed,
        ),
      }))
  }
  function addRelationship() {
    if (!classes.length) return
    updateDraft((current) => ({
      ...current,
      relationships: [
        ...asRows(current.relationships),
        {
          id: identifier(`edge_${relationships.length + 1}`, 'edge'),
          type: 'association',
          sourceClassId: text(classes[0], 'id'),
          targetClassId: text(classes[1] ?? classes[0], 'id'),
          direction: 'undirected',
          sourceMultiplicity: '1',
          targetMultiplicity: '0..*',
          label: '',
          enabled: true,
          warnings: [],
        },
      ],
    }))
  }
  function reviewRelationships() {
    setPhase('relationships')
    onReviewStateChange(true)
  }
  function reviewClasses() {
    setPhase('classes')
    onReviewStateChange(false)
  }

  if (phase === 'classes')
    return (
      <section className="grid content-start gap-5">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-fg">Check class names</h2>
            <p className="mt-1 text-[13px] text-fg-3">
              Confirm that these are the right classes. You do not need to review technical details here.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addClass}>
            <Plus /> Add class
          </Button>
        </header>
        <div className="grid gap-3">
          {classes.map((item, index) => (
            <article
              className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
              key={text(item, 'id') || index}
            >
              <input
                className={control}
                aria-label={`Class ${index + 1} name`}
                value={text(item, 'name')}
                onChange={(event) => updateClass(index, { name: event.target.value })}
              />
              <label className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-fg-2">
                <input
                  className="size-4 accent-accent"
                  type="checkbox"
                  checked={item.enabled !== false}
                  onChange={(event) => updateClass(index, { enabled: event.target.checked })}
                />
                Include
              </label>
              <button
                className="rounded-md p-2 text-danger hover:bg-danger/10"
                type="button"
                aria-label={`Delete ${text(item, 'name') || 'class'}`}
                onClick={() => removeClass(index)}
              >
                <Trash2 className="size-4" />
              </button>
              {warnings(item).length ? (
                <span title={warnings(item).join('\n')} className="text-warning">
                  <AlertTriangle className="size-4" />
                </span>
              ) : null}
            </article>
          ))}
        </div>
        {!classes.length ? (
          <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">
            No classes were generated. Add the classes you want to include.
          </p>
        ) : null}
        <footer className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button onClick={reviewRelationships} disabled={busy || !classes.length}>
            Class names look good <ArrowRight />
          </Button>
          <Button variant="secondary" onClick={() => void onSave(draft, revision.version_number)} disabled={busy}>
            {busy ? 'Saving…' : 'Save draft'}
          </Button>
        </footer>
      </section>
    )

  return (
    <section className="grid content-start gap-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-fg">Review relationships</h2>
          <p className="mt-1 text-[13px] text-fg-3">
            Connect the approved classes and confirm their relationship type and multiplicity.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={addRelationship} disabled={!classes.length}>
          <Plus /> Add relationship
        </Button>
      </header>
      <div className="grid gap-4">
        {relationships.map((item, index) => (
          <article className="grid gap-3 rounded-lg border border-border p-4" key={text(item, 'id') || index}>
            <div className="grid gap-3 sm:grid-cols-3">
              <ClassSelect
                label="From"
                classes={classes}
                selected={text(item, 'sourceClassId')}
                onChange={(sourceClassId) => updateRelationship(index, { sourceClassId })}
              />
              <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
                Relationship
                <select
                  className={control}
                  value={text(item, 'type') || 'association'}
                  onChange={(event) => updateRelationship(index, { type: event.target.value })}
                >
                  {['association', 'aggregation', 'composition', 'dependency', 'inheritance', 'realization'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <ClassSelect
                label="To"
                classes={classes}
                selected={text(item, 'targetClassId')}
                onChange={(targetClassId) => updateRelationship(index, { targetClassId })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
                From multiplicity
                <input
                  className={control}
                  placeholder="e.g. 1"
                  value={text(item, 'sourceMultiplicity')}
                  onChange={(event) => updateRelationship(index, { sourceMultiplicity: event.target.value || null })}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
                To multiplicity
                <input
                  className={control}
                  placeholder="e.g. 0..*"
                  value={text(item, 'targetMultiplicity')}
                  onChange={(event) => updateRelationship(index, { targetMultiplicity: event.target.value || null })}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
                Label (optional)
                <input
                  className={control}
                  value={text(item, 'label')}
                  onChange={(event) => updateRelationship(index, { label: event.target.value })}
                />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-fg-2">
                <input
                  className="size-4 accent-accent"
                  type="checkbox"
                  checked={item.enabled !== false}
                  onChange={(event) => updateRelationship(index, { enabled: event.target.checked })}
                />
                Include
              </label>
              <button
                className="rounded-md p-2 text-danger hover:bg-danger/10"
                type="button"
                aria-label="Delete relationship"
                onClick={() =>
                  updateDraft((current) => ({
                    ...current,
                    relationships: asRows(current.relationships).filter(
                      (_, relationshipIndex) => relationshipIndex !== index,
                    ),
                  }))
                }
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {warnings(item).length ? (
              <div className="rounded-md bg-warning/10 p-3 text-[13px] text-warning">
                <strong>Needs attention</strong>
                <ul className="mt-1 list-disc pl-5">
                  {warnings(item).map((warning, warningIndex) => (
                    <li key={warningIndex}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {!relationships.length ? (
        <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">
          No relationships were generated. Add any relationships you need before continuing.
        </p>
      ) : null}
      <footer className="flex flex-wrap gap-3 border-t border-border pt-4">
        <Button variant="secondary" onClick={reviewClasses}>
          <ArrowLeft /> Back to class names
        </Button>
        <Button variant="secondary" onClick={() => void onSave(draft, revision.version_number)} disabled={busy}>
          {busy ? 'Saving…' : 'Save draft'}
        </Button>
      </footer>
    </section>
  )
}

function ClassSelect({
  label,
  classes,
  selected,
  onChange,
}: {
  label: string
  classes: Entity[]
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
      {label}
      <select className={control} value={selected} onChange={(event) => onChange(event.target.value)}>
        {classes.map((item) => (
          <option key={text(item, 'id')} value={text(item, 'id')}>
            {text(item, 'name') || 'Unnamed class'}
          </option>
        ))}
      </select>
    </label>
  )
}
