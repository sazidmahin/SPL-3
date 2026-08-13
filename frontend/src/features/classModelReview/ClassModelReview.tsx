import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import type { PipelineStageRevision } from '../../domains/generationPipeline/types'
import './ClassModelReview.css'

type Entity = Record<string, unknown>

type Props = {
  revision: PipelineStageRevision
  busy: boolean
  onSave: (payload: Record<string, unknown>, expectedVersion: number) => Promise<void>
}

function asRows(value: unknown): Entity[] { return Array.isArray(value) ? value.filter((item): item is Entity => typeof item === 'object' && item !== null) : [] }
function value(item: Entity, key: string) { return typeof item[key] === 'string' ? item[key] : '' }
function identifier(label: string, prefix: string) { return `${prefix}_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || Date.now()}` }

export function ClassModelReview({ revision, busy, onSave }: Props) {
  const [draft, setDraft] = useState<Record<string, unknown>>(revision.payload)
  useEffect(() => setDraft(revision.payload), [revision])
  const classes = useMemo(() => asRows(draft.classes), [draft.classes])
  const relationships = useMemo(() => asRows(draft.relationships), [draft.relationships])
  const warnings = classes.flatMap((item) => asRows(item.warnings)).length + relationships.flatMap((item) => asRows(item.warnings)).length

  function updateClass(index: number, patch: Entity) {
    setDraft((current) => ({ ...current, classes: classes.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }))
  }
  function updateRelationship(index: number, patch: Entity) {
    setDraft((current) => ({ ...current, relationships: relationships.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }))
  }
  function addClass() {
    const name = 'NewClass'
    setDraft((current) => ({ ...current, classes: [...classes, { id: identifier(name, 'class'), name, enabled: true, attributes: [], methods: [], sourceRequirementIds: [], warnings: [] }] }))
  }
  function removeClass(index: number) {
    const removed = value(classes[index], 'id')
    if (!window.confirm('Delete this class? Relationships connected to it will also be removed.')) return
    setDraft((current) => ({ ...current, classes: classes.filter((_, itemIndex) => itemIndex !== index), relationships: relationships.filter((relationship) => value(relationship, 'sourceClassId') !== removed && value(relationship, 'targetClassId') !== removed) }))
  }
  function addRelationship() {
    setDraft((current) => ({ ...current, relationships: [...relationships, { id: identifier(`edge_${relationships.length + 1}`, 'edge'), type: 'association', sourceClassId: value(classes[0] ?? {}, 'id'), targetClassId: value(classes[1] ?? classes[0] ?? {}, 'id'), direction: 'undirected', sourceMultiplicity: '1', targetMultiplicity: '0..*', label: '', enabled: true, warnings: [] }] }))
  }
  async function save() { await onSave(draft, revision.version_number) }

  return <section className="class-model-review">
    <header><div><h2>Class model review</h2><p>Edit the generated model. Disabled items are omitted from the approved diagram.</p></div><button type="button" onClick={addClass}><Plus size={16} /> Add class</button></header>
    {warnings ? <p className="class-model-warning"><AlertTriangle size={16} /> Review warnings before approval.</p> : null}
    <div className="class-editor-grid">
      <div className="class-list">{classes.map((item, index) => <article key={value(item, 'id') || index}>
        <div><input aria-label="Class name" value={value(item, 'name')} onChange={(event) => updateClass(index, { name: event.target.value })} /><label><input type="checkbox" checked={item.enabled !== false} onChange={(event) => updateClass(index, { enabled: event.target.checked })} /> Enabled</label></div>
        <small>{value(item, 'id')} · requirements: {asRows(item.sourceRequirementIds).length || (Array.isArray(item.sourceRequirementIds) ? item.sourceRequirementIds.length : 0)}</small>
        <label>Attributes<textarea value={JSON.stringify(item.attributes ?? [], null, 2)} onChange={(event) => { try { updateClass(index, { attributes: JSON.parse(event.target.value) }) } catch {} }} /></label>
        <label>Methods<textarea value={JSON.stringify(item.methods ?? [], null, 2)} onChange={(event) => { try { updateClass(index, { methods: JSON.parse(event.target.value) }) } catch {} }} /></label>
        <button className="danger" type="button" onClick={() => removeClass(index)}><Trash2 size={15} /> Delete</button>
      </article>)}</div>
      <div className="relationship-list"><header><h3>Relationships</h3><button type="button" onClick={addRelationship}><Plus size={15} /> Add</button></header>{relationships.map((item, index) => <article key={value(item, 'id') || index}>
        <select value={value(item, 'sourceClassId')} onChange={(event) => updateRelationship(index, { sourceClassId: event.target.value })}>{classes.map((classItem) => <option key={value(classItem, 'id')} value={value(classItem, 'id')}>{value(classItem, 'name')}</option>)}</select>
        <select value={value(item, 'type') || 'association'} onChange={(event) => updateRelationship(index, { type: event.target.value })}>{['association', 'aggregation', 'composition', 'dependency', 'inheritance', 'realization'].map((type) => <option key={type}>{type}</option>)}</select>
        <select value={value(item, 'targetClassId')} onChange={(event) => updateRelationship(index, { targetClassId: event.target.value })}>{classes.map((classItem) => <option key={value(classItem, 'id')} value={value(classItem, 'id')}>{value(classItem, 'name')}</option>)}</select>
        <input placeholder="Label" value={value(item, 'label')} onChange={(event) => updateRelationship(index, { label: event.target.value })} />
        <select value={value(item, 'direction') || 'undirected'} onChange={(event) => updateRelationship(index, { direction: event.target.value })}>{['undirected', 'source-to-target', 'target-to-source', 'bidirectional'].map((direction) => <option key={direction}>{direction}</option>)}</select>
        <input placeholder="Source multiplicity" value={value(item, 'sourceMultiplicity')} onChange={(event) => updateRelationship(index, { sourceMultiplicity: event.target.value || null })} />
        <input placeholder="Target multiplicity" value={value(item, 'targetMultiplicity')} onChange={(event) => updateRelationship(index, { targetMultiplicity: event.target.value || null })} />
        <label className="relationship-enabled"><input type="checkbox" checked={item.enabled !== false} onChange={(event) => updateRelationship(index, { enabled: event.target.checked })} /> Enabled</label>
        <button className="danger" type="button" onClick={() => setDraft((current) => ({ ...current, relationships: relationships.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={15} /></button>
      </article>)}</div>
    </div>
    <footer><button type="button" onClick={() => void save()} disabled={busy}>{busy ? 'Saving…' : 'Save draft'}</button></footer>
  </section>
}
