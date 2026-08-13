import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2, Play, RotateCcw, Save, Sparkles } from 'lucide-react'
import type { AiProviderSetting } from '../../domains/aiSettings/types'
import type { GenerationMode, PipelineRun, PipelineStage, PipelineStageRevision } from '../../domains/generationPipeline/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { ClassModelReview } from '../classModelReview/ClassModelReview'
import './SrsGenerationFlow.css'

type Props = {
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  srsTitle: string
  srsRawText: string
  canGenerateSrs: boolean
  isStartingGeneration: boolean
  pipelineRuns: PipelineRun[]
  aiProviders: AiProviderSetting[]
  onSrsRawTextChange: (value: string) => void
  onStartPipeline: (payload: { title: string; raw_text: string; generation_mode: GenerationMode }) => Promise<PipelineRun>
  onSavePipelineRevision: (runId: string, stage: PipelineStage, payload: Record<string, unknown>, expectedVersion: number) => Promise<unknown>
  onApprovePipelineRevision: (runId: string, stage: PipelineStage, version: number) => Promise<PipelineRun>
  onReopenPipelineRevision: (runId: string, stage: PipelineStage) => Promise<void>
}

const stages: Array<{ id: PipelineStage; label: string; help: string }> = [
  { id: 'input', label: 'Input', help: 'Normalize and review the source story.' },
  { id: 'clarifications', label: 'Clarifications', help: 'Answer or edit ambiguity questions.' },
  { id: 'final-story', label: 'Final story', help: 'Review the refined story sections.' },
  { id: 'requirements', label: 'Requirements', help: 'Review normalized requirements.' },
  { id: 'class-model', label: 'Class model', help: 'Edit classes, methods, attributes, and relationships.' },
  { id: 'xml', label: 'Draw.io XML', help: 'Review the deterministic diagram payload.' },
]

function revisionFor(run: PipelineRun | null, stage: PipelineStage) { return run?.stages.find((item) => item.stage_name === stage) ?? null }
function readableMode(mode: GenerationMode) { return mode === 'rule_based' ? 'Rule Based' : mode === 'srsgen' ? 'SrsGen' : 'AI-Gen' }
function validByok(providers: AiProviderSetting[]) { return providers.some((provider) => provider.credential?.is_default && provider.credential.status === 'valid') }
function defaultTitle(raw: string, project?: Project) { const first = raw.trim().split(/[.!?\n]/)[0]?.trim(); return first?.slice(0, 100) || `${project?.name ?? 'Project'} requirements` }

export function SrsGenerationFlow({ activeWorkspace, activeProject, srsTitle, srsRawText, canGenerateSrs, isStartingGeneration, pipelineRuns, aiProviders, onSrsRawTextChange, onStartPipeline, onSavePipelineRevision, onApprovePipelineRevision, onReopenPipelineRevision }: Props) {
  const [mode, setMode] = useState<GenerationMode>('rule_based')
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(pipelineRuns[0] ?? null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const hasByok = validByok(aiProviders)

  useEffect(() => { setSelectedRun((current) => current ? pipelineRuns.find((item) => item.id === current.id) ?? current : pipelineRuns[0] ?? null) }, [pipelineRuns])
  const currentStage = selectedRun?.current_stage ?? 'input'
  const currentRevision = revisionFor(selectedRun, currentStage)
  const engineDetail = selectedRun?.generation_mode === 'byok' ? `${selectedRun.provider} · ${selectedRun.model_name}` : selectedRun?.generation_mode === 'srsgen' ? `SrsGen · ${selectedRun.model_name ?? 'platform managed'}` : 'Local deterministic rule engine'

  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!activeProject || !srsRawText.trim() || !canGenerateSrs || (mode === 'byok' && !hasByok)) return
    setError(null)
    try { const run = await onStartPipeline({ title: srsTitle.trim() || defaultTitle(srsRawText, activeProject), raw_text: srsRawText.trim(), generation_mode: mode }); setSelectedRun(run) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to begin generation') }
  }
  async function save(stage: PipelineStage, payload: Record<string, unknown>, version: number) {
    if (!selectedRun) return; setSaving(true); setError(null)
    try { await onSavePipelineRevision(selectedRun.id, stage, payload, version) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save draft') } finally { setSaving(false) }
  }
  async function approve() {
    if (!selectedRun || !currentRevision) return; setSaving(true); setError(null)
    try { setSelectedRun(await onApprovePipelineRevision(selectedRun.id, currentStage, currentRevision.version_number)) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to accept this stage') } finally { setSaving(false) }
  }
  async function reopen() { if (!selectedRun) return; setSaving(true); try { await onReopenPipelineRevision(selectedRun.id, currentStage) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to reopen this stage') } finally { setSaving(false) } }

  return <section className="canonical-pipeline-page">
    <header className="canonical-pipeline-heading"><div><span><Sparkles size={20} /></span><div><h1>Generation pipeline</h1><p>Choose an engine once, then review and accept every canonical artifact.</p></div></div>{selectedRun ? <small>{readableMode(selectedRun.generation_mode)} · {engineDetail}</small> : null}</header>
    {!selectedRun ? <form className="canonical-start-card" onSubmit={start}><label>Requirements<textarea value={srsRawText} maxLength={200000} placeholder="Describe the system, users, goals, and constraints…" onChange={(event) => onSrsRawTextChange(event.target.value)} /></label><div className="generation-options"><label>Generation method<select value={mode} onChange={(event) => setMode(event.target.value as GenerationMode)}><option value="rule_based">Rule Based</option><option value="srsgen">SrsGen</option><option value="byok" disabled={!hasByok}>AI-Gen</option></select></label><p>{mode === 'rule_based' ? 'Uses local deterministic extraction. No API key required.' : mode === 'srsgen' ? 'Uses the platform custom generation model.' : hasByok ? 'Uses your active provider and model from Settings.' : <>Configure an active credential first in <a href="#settings">Settings → AI Providers</a>.</>}</p></div><button className="canonical-primary" type="submit" disabled={isStartingGeneration || !canGenerateSrs || !activeWorkspace || (mode === 'byok' && !hasByok)}>{isStartingGeneration ? <Loader2 className="spin" size={16} /> : <Play size={16} />} Start pipeline</button>{error ? <ErrorNotice text={error} /> : null}</form> : <div className="canonical-workspace"><aside className="canonical-stage-list"><header><strong>{selectedRun.title}</strong><small>{engineDetail}</small></header>{stages.map((stage, index) => { const revision = revisionFor(selectedRun, stage.id); const active = stage.id === currentStage; return <button type="button" className={active ? 'active' : ''} key={stage.id} onClick={() => active && setSelectedRun({ ...selectedRun, current_stage: stage.id })} disabled={!revision}><b>{index + 1}</b><span>{stage.label}<small>{revision?.status?.replaceAll('_', ' ') ?? 'waiting'}</small></span><ChevronRight size={15} /></button> })}<button className="new-run" type="button" onClick={() => setSelectedRun(null)}>Start a new run</button></aside><main className="canonical-review">{currentRevision ? <StageReview revision={currentRevision} stage={currentStage} busy={saving} onSave={save} /> : <p>This stage has not been generated yet.</p>}<footer className="canonical-review-actions">{currentRevision?.status === 'approved' ? <button type="button" onClick={() => void reopen()} disabled={saving}><RotateCcw size={16} /> Reopen</button> : <><button type="button" onClick={() => void approve()} disabled={saving || !currentRevision}><CheckCircle2 size={16} /> Accept &amp; Proceed</button><small>Approval validates and runs only the next canonical stage.</small></>}</footer>{error ? <ErrorNotice text={error} /> : null}</main></div>}
  </section>
}

function StageReview({ revision, stage, busy, onSave }: { revision: PipelineStageRevision; stage: PipelineStage; busy: boolean; onSave: (stage: PipelineStage, payload: Record<string, unknown>, version: number) => Promise<void> }) {
  if (stage === 'class-model') return <ClassModelReview revision={revision} busy={busy} onSave={async (payload, version) => onSave(stage, payload, version)} />
  return <GenericStageEditor revision={revision} stage={stage} busy={busy} onSave={onSave} />
}

function GenericStageEditor({ revision, stage, busy, onSave }: { revision: PipelineStageRevision; stage: PipelineStage; busy: boolean; onSave: (stage: PipelineStage, payload: Record<string, unknown>, version: number) => Promise<void> }) {
  const [payload, setPayload] = useState(revision.payload)
  useEffect(() => setPayload(revision.payload), [revision])
  if (stage === 'input') { const normalization = (payload.normalization as Record<string, unknown> | undefined) ?? {}; return <section className="stage-editor"><h2>Review input story</h2><p>Improve the source before the pipeline generates clarifications.</p><textarea value={String(normalization.rawText ?? '')} onChange={(event) => setPayload({ ...payload, normalization: { ...normalization, rawText: event.target.value } })} /><SaveButton busy={busy} onClick={() => void onSave(stage, payload, revision.version_number)} /></section> }
  if (stage === 'clarifications') { const questions = Array.isArray(payload.clarificationQuestions) ? payload.clarificationQuestions as Array<Record<string, unknown>> : []; const answers = Array.isArray(payload.answers) ? payload.answers as Array<Record<string, unknown>> : []; function answerFor(id: unknown) { return String(answers.find((item) => item.questionStableId === id || item.question_id === id)?.answerText ?? '') } function updateAnswer(id: unknown, text: string) { const rest = answers.filter((item) => item.questionStableId !== id && item.question_id !== id); setPayload({ ...payload, answers: [...rest, { questionStableId: id, answerText: text }] }) } return <section className="stage-editor"><h2>Clarifications</h2><p>Answer each open question, then accept to generate the final story.</p>{questions.map((question, index) => <label className="clarification-answer" key={String(question.id ?? index)}><strong>{String(question.question ?? question.text ?? `Question ${index + 1}`)}</strong><small>{String(question.reason ?? '')}</small><textarea value={answerFor(question.id)} onChange={(event) => updateAnswer(question.id, event.target.value)} /></label>)}<SaveButton busy={busy} onClick={() => void onSave(stage, payload, revision.version_number)} /></section> }
  return <JsonStageEditor revision={revision} stage={stage} payload={payload} setPayload={setPayload} busy={busy} onSave={onSave} />
}

function JsonStageEditor({ revision, stage, payload, setPayload, busy, onSave }: { revision: PipelineStageRevision; stage: PipelineStage; payload: Record<string, unknown>; setPayload: (value: Record<string, unknown>) => void; busy: boolean; onSave: (stage: PipelineStage, payload: Record<string, unknown>, version: number) => Promise<void> }) {
  const [text, setText] = useState(() => JSON.stringify(payload, null, 2)); const [invalid, setInvalid] = useState(false); useEffect(() => { setText(JSON.stringify(payload, null, 2)); setInvalid(false) }, [payload]); function change(value: string) { setText(value); try { const parsed = JSON.parse(value); if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error(); setPayload(parsed as Record<string, unknown>); setInvalid(false) } catch { setInvalid(true) } }
  return <section className="stage-editor"><h2>{stages.find((item) => item.id === stage)?.label} review</h2><p>{stages.find((item) => item.id === stage)?.help}</p><textarea className="json-stage" value={text} onChange={(event) => change(event.target.value)} spellCheck={false} />{invalid ? <ErrorNotice text="This draft must be valid JSON before it can be saved." /> : null}<SaveButton busy={busy || invalid} onClick={() => void onSave(stage, payload, revision.version_number)} /></section>
}

function SaveButton({ busy, onClick }: { busy: boolean; onClick: () => void }) { return <button className="save-draft" type="button" disabled={busy} onClick={onClick}><Save size={16} /> {busy ? 'Saving…' : 'Save draft'}</button> }
function ErrorNotice({ text }: { text: string }) { return <p className="canonical-error"><AlertTriangle size={16} /> {text}</p> }
