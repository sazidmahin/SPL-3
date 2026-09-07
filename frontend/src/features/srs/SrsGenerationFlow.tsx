import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Download, Loader2, Play, Quote, RotateCcw, Save } from 'lucide-react'
import type { AiProviderSetting } from '../../domains/aiSettings/types'
import type { GenerationMode, PipelineRun, PipelineStage, PipelineStageRevision } from '../../domains/generationPipeline/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Button, Card, Chip, Modal, ModalClose, ModalContent, PageHeader, RadioCard, StepTrack, Textarea, inputClasses, cn } from '../../shared/ui'
import { ClassModelReview } from '../classModelReview/ClassModelReview'
import { DrawioEmbed } from '../diagram/DrawioEmbed'

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
  onSavePipelineRevision: (
    runId: string,
    stage: PipelineStage,
    payload: Record<string, unknown>,
    expectedVersion: number,
  ) => Promise<PipelineStageRevision>
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

const engineOptions: Array<{ id: GenerationMode; title: string; description: string }> = [
  { id: 'rule_based', title: 'Rule-Based Engine', description: 'Deterministic local extraction. No API key required.' },
  { id: 'ollama', title: 'Local AI (Ollama)', description: 'Runs on the bundled Ollama server. No API key required.' },
  { id: 'srsgen', title: 'SrsGen', description: 'Platform-managed custom generation model.' },
  { id: 'byok', title: 'AI-Gen', description: 'Uses your active provider and model from AI Settings.' },
]

function revisionFor(run: PipelineRun | null, stage: PipelineStage) {
  return run?.stages.find((item) => item.stage_name === stage) ?? null
}
function readableMode(mode: GenerationMode) {
  return mode === 'rule_based' ? 'Rule Based' : mode === 'srsgen' ? 'SrsGen' : 'AI-Gen'
}
function validByok(providers: AiProviderSetting[]) {
  return providers.some((provider) => provider.credential?.is_default && provider.credential.status === 'valid')
}
function defaultTitle(raw: string, project?: Project) {
  return raw.trim().split(/[.!?\n]/)[0]?.trim().slice(0, 100) || `${project?.name ?? 'Project'} requirements`
}

export function SrsGenerationFlow({
  activeWorkspace,
  activeProject,
  srsTitle,
  srsRawText,
  canGenerateSrs,
  isStartingGeneration,
  pipelineRuns,
  aiProviders,
  onSrsRawTextChange,
  onStartPipeline,
  onSavePipelineRevision,
  onApprovePipelineRevision,
  onReopenPipelineRevision,
}: Props) {
  const [mode, setMode] = useState<GenerationMode>('rule_based')
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(pipelineRuns[0] ?? null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<{ stage: PipelineStage; payload: Record<string, unknown> } | null>(null)
  const [classModelReady, setClassModelReady] = useState(false)
  const [srsgenNoticeOpen, setSrsgenNoticeOpen] = useState(false)
  const hasByok = validByok(aiProviders)

  useEffect(() => {
    setSelectedRun((current) =>
      current ? pipelineRuns.find((item) => item.id === current.id) ?? current : pipelineRuns[0] ?? null,
    )
  }, [pipelineRuns])

  const currentStage = selectedRun?.current_stage ?? 'input'
  const currentRevision = revisionFor(selectedRun, currentStage)
  const currentStageIndex = Math.max(0, stages.findIndex((stage) => stage.id === currentStage))
  const engineDetail =
    selectedRun?.generation_mode === 'byok'
      ? `${selectedRun.provider} · ${selectedRun.model_name}`
      : selectedRun?.generation_mode === 'srsgen'
      ? `SrsGen · ${selectedRun.model_name ?? 'platform managed'}`
      : 'Local deterministic rule engine'

  // Rule-Based and Local AI (Ollama) run locally and are free for every plan.
  // Only AI-Gen (bring-your-own paid provider) is gated by the subscription plan.
  const startBlockReason = !activeWorkspace
    ? 'Select a workspace before starting the pipeline.'
    : !activeProject
    ? 'Select or create a project first.'
    : mode === 'byok' && !canGenerateSrs
    ? 'Your current plan does not include AI-Gen. Use the Rule-Based Engine or Local AI (Ollama) instead.'
    : mode === 'byok' && !hasByok
    ? 'Configure a default AI provider in AI Settings, or pick another method.'
    : !srsRawText.trim()
    ? 'Paste your requirements in the box above.'
    : null

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (startBlockReason) return
    setError(null)
    try {
      setSelectedRun(
        await onStartPipeline({
          title: srsTitle.trim() || defaultTitle(srsRawText, activeProject),
          raw_text: srsRawText.trim(),
          generation_mode: mode,
        }),
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to begin generation')
    }
  }

  async function save(stage: PipelineStage, payload: Record<string, unknown>, version: number) {
    if (!selectedRun) return undefined
    setSaving(true)
    setError(null)
    try {
      const revision = await onSavePipelineRevision(selectedRun.id, stage, payload, version)
      setDraft(null)
      return revision
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save draft')
      return undefined
    } finally {
      setSaving(false)
    }
  }

  async function approve() {
    if (!selectedRun || !currentRevision) return
    setSaving(true)
    setError(null)
    try {
      const revision =
        draft?.stage === currentStage
          ? await onSavePipelineRevision(selectedRun.id, currentStage, draft.payload, currentRevision.version_number)
          : currentRevision
      setDraft(null)
      setSelectedRun(await onApprovePipelineRevision(selectedRun.id, currentStage, revision.version_number))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to accept this stage')
    } finally {
      setSaving(false)
    }
  }

  async function reopen() {
    if (!selectedRun) return
    setSaving(true)
    try {
      await onReopenPipelineRevision(selectedRun.id, currentStage)
      if (currentStage === 'class-model') setClassModelReady(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to reopen this stage')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="grid gap-5">
      <Modal open={srsgenNoticeOpen} onOpenChange={setSrsgenNoticeOpen}>
        <ModalContent
          title="SrsGen unavailable"
          description="SrsGen will not be available for now. Pick the Rule-Based Engine, Local AI (Ollama), or AI-Gen instead."
        >
          <div className="flex justify-end">
            <ModalClose asChild>
              <Button>Got it</Button>
            </ModalClose>
          </div>
        </ModalContent>
      </Modal>

      <StepTrack steps={stages.map((stage) => stage.label)} current={selectedRun ? currentStageIndex : 0} />

      <PageHeader
        title="Generation pipeline"
        description="Choose an engine once, then review and accept every canonical artifact."
        actions={
          selectedRun ? (
            <Chip tone="ai">
              {readableMode(selectedRun.generation_mode)} · {engineDetail}
            </Chip>
          ) : undefined
        }
      />

      {selectedRun?.status === 'completed' ? (
        <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-success/20 bg-success/[0.08] px-4 py-3">
          <CheckCircle2 className="size-4 shrink-0 text-success" />
          <span className="text-[13px] font-medium text-fg">
            SRS pipeline complete — {readableMode(selectedRun.generation_mode)} · {engineDetail} · all six stages approved.
          </span>
          <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setSelectedRun(null)}>
            <Play /> New run
          </Button>
        </div>
      ) : null}

      {!selectedRun ? (
        <Card className="p-6">
          <form className="grid gap-5" onSubmit={start}>
            <label className="grid gap-2">
              <span className="text-[12.5px] font-semibold text-fg-2">Requirements</span>
              <Textarea
                className="min-h-48"
                value={srsRawText}
                maxLength={200000}
                placeholder="Describe the system, users, goals, and constraints…"
                onChange={(event) => onSrsRawTextChange(event.target.value)}
              />
            </label>

            <div className="grid gap-2">
              <span className="text-[12.5px] font-semibold text-fg-2">Generation method</span>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {engineOptions.map((option) => (
                  <RadioCard
                    key={option.id}
                    name="generation-mode"
                    value={option.id}
                    checked={mode === option.id}
                    onChange={(value) => {
                      if (value === 'srsgen') {
                        setSrsgenNoticeOpen(true)
                        return
                      }
                      setMode(value as GenerationMode)
                    }}
                    disabled={option.id === 'byok' && !hasByok}
                    title={option.title}
                    description={
                      option.id === 'byok' && !hasByok ? (
                        <>
                          Configure a default provider in{' '}
                          <a className="font-semibold text-accent hover:underline" href="#ai-settings">
                            AI Settings
                          </a>
                          .
                        </>
                      ) : (
                        option.description
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                type="submit"
                className="w-max"
                disabled={isStartingGeneration || Boolean(startBlockReason)}
              >
                {isStartingGeneration ? <Loader2 className="animate-spin" /> : <Play />} Start pipeline
              </Button>
              {startBlockReason ? <small className="text-xs text-fg-3">{startBlockReason}</small> : null}
            </div>
            {error ? <ErrorNotice text={error} /> : null}
          </form>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
          <Card className="grid content-start gap-1 p-3">
            <div className="grid gap-1 border-b border-border px-2 pb-3">
              <strong className="truncate text-sm text-fg">{selectedRun.title}</strong>
              <small className="text-xs text-fg-3">{engineDetail}</small>
            </div>
            {stages.map((stage, index) => {
              const revision = revisionFor(selectedRun, stage.id)
              const active = stage.id === currentStage
              return (
                <button
                  type="button"
                  key={stage.id}
                  disabled={!revision}
                  onClick={() => active && setSelectedRun({ ...selectedRun, current_stage: stage.id })}
                  className={cn(
                    'grid grid-cols-[1.5rem_1fr] items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition disabled:cursor-default disabled:opacity-55',
                    active ? 'bg-accent/15 text-accent' : 'text-fg-2 hover:bg-surface-2',
                  )}
                >
                  <b
                    className={cn(
                      'grid size-5 place-items-center rounded-full text-[11px]',
                      active ? 'bg-accent text-fg-invert' : 'bg-surface-3 text-fg-2',
                    )}
                  >
                    {index + 1}
                  </b>
                  <span className="grid gap-0.5 font-semibold">
                    {stage.label}
                    <small className="text-[10px] font-medium capitalize text-fg-3">
                      {revision?.status.replaceAll('_', ' ') ?? 'waiting'}
                    </small>
                  </span>
                </button>
              )
            })}
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setSelectedRun(null)}>
              Start a new run
            </Button>
          </Card>

          <Card className="grid min-h-[32.5rem] gap-5 p-6">
            {currentRevision ? (
              <StageReview
                revision={currentRevision}
                stage={currentStage}
                busy={saving}
                onSave={save}
                onDraftChange={(payload) => setDraft({ stage: currentStage, payload })}
                onClassModelReviewStateChange={setClassModelReady}
              />
            ) : (
              <p className="text-[13px] text-fg-3">This stage has not been generated yet.</p>
            )}
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              {currentRevision?.status === 'approved' ? (
                <Button onClick={() => void reopen()} disabled={saving}>
                  <RotateCcw /> Reopen
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => void approve()}
                    disabled={saving || !currentRevision || (currentStage === 'class-model' && !classModelReady)}
                  >
                    <CheckCircle2 /> Accept &amp; Proceed
                  </Button>
                  <small className="text-xs text-fg-3">
                    {currentStage === 'class-model' && !classModelReady
                      ? 'Confirm the class names, then review relationships before proceeding.'
                      : 'Acceptance saves unsaved edits, validates, and runs the next canonical stage.'}
                  </small>
                </>
              )}
            </div>
            {error ? <ErrorNotice text={error} /> : null}
          </Card>
        </div>
      )}
    </section>
  )
}

function StageReview({
  revision,
  stage,
  busy,
  onSave,
  onDraftChange,
  onClassModelReviewStateChange,
}: {
  revision: PipelineStageRevision
  stage: PipelineStage
  busy: boolean
  onSave: (
    stage: PipelineStage,
    payload: Record<string, unknown>,
    version: number,
  ) => Promise<PipelineStageRevision | undefined>
  onDraftChange: (payload: Record<string, unknown>) => void
  onClassModelReviewStateChange: (ready: boolean) => void
}) {
  if (stage === 'class-model')
    return (
      <ClassModelReview
        revision={revision}
        busy={busy}
        onSave={async (payload, version) => {
          await onSave(stage, payload, version)
        }}
        onDraftChange={onDraftChange}
        onReviewStateChange={onClassModelReviewStateChange}
      />
    )
  if (stage === 'xml') return <XmlReview revision={revision} />
  return <GenericStageEditor revision={revision} stage={stage} busy={busy} onSave={onSave} onDraftChange={onDraftChange} />
}

function GenericStageEditor({
  revision,
  stage,
  busy,
  onSave,
  onDraftChange,
}: {
  revision: PipelineStageRevision
  stage: PipelineStage
  busy: boolean
  onSave: (
    stage: PipelineStage,
    payload: Record<string, unknown>,
    version: number,
  ) => Promise<PipelineStageRevision | undefined>
  onDraftChange: (payload: Record<string, unknown>) => void
}) {
  const [payload, setPayload] = useState(revision.payload)
  useEffect(() => setPayload(revision.payload), [revision])
  function updatePayload(nextPayload: Record<string, unknown>) {
    setPayload(nextPayload)
    onDraftChange(nextPayload)
  }

  if (stage === 'input') {
    const normalization = (payload.normalization as Record<string, unknown> | undefined) ?? {}
    return (
      <section className="grid content-start gap-3">
        <h2 className="font-display text-xl font-bold text-fg">Review input story</h2>
        <p className="text-[13px] text-fg-3">Improve the source before the pipeline generates clarifications.</p>
        <Textarea
          className="min-h-64"
          value={String(normalization.rawText ?? '')}
          onChange={(event) => updatePayload({ ...payload, normalization: { ...normalization, rawText: event.target.value } })}
        />
        <SaveButton busy={busy} onClick={() => void onSave(stage, payload, revision.version_number)} />
      </section>
    )
  }

  if (stage === 'clarifications')
    return <ClarificationsReview revision={revision} payload={payload} busy={busy} onSave={onSave} onChange={updatePayload} />


  if (stage === 'final-story')
    return <FinalStoryReview revision={revision} payload={payload} busy={busy} onSave={onSave} onChange={updatePayload} />
  if (stage === 'requirements')
    return <RequirementsReview revision={revision} payload={payload} busy={busy} onSave={onSave} onChange={updatePayload} />
  return <JsonStageEditor revision={revision} stage={stage} payload={payload} setPayload={updatePayload} busy={busy} onSave={onSave} />
}

const CLARIFICATION_TONES: Record<string, 'warning' | 'ai' | 'danger' | 'muted' | 'accent'> = {
  'Missing Actor': 'warning',
  'Missing Object': 'ai',
  'Missing Action': 'ai',
  'Unknown Action': 'muted',
  'Vague Metric': 'danger',
  'Vague Timing': 'danger',
  'Ambiguous Quantity': 'warning',
  'Pronoun Reference': 'accent',
  'Conflicting Rule': 'danger',
}

type ClarificationAnswer = Record<string, unknown> & {
  questionStableId?: unknown
  question_id?: unknown
  answerText?: unknown
  status?: unknown
}

function ClarificationsReview({
  revision,
  payload,
  busy,
  onSave,
  onChange,
}: {
  revision: PipelineStageRevision
  payload: Record<string, unknown>
  busy: boolean
  onSave: (
    stage: PipelineStage,
    payload: Record<string, unknown>,
    version: number,
  ) => Promise<PipelineStageRevision | undefined>
  onChange: (payload: Record<string, unknown>) => void
}) {
  const questions = Array.isArray(payload.clarificationQuestions)
    ? (payload.clarificationQuestions as Array<Record<string, unknown>>)
    : []
  const answers = Array.isArray(payload.answers) ? (payload.answers as ClarificationAnswer[]) : []

  const matches = (item: ClarificationAnswer, id: unknown) => item.questionStableId === id || item.question_id === id
  const answerFor = (id: unknown) => answers.find((item) => matches(item, id))
  const isResolved = (item: ClarificationAnswer | undefined) =>
    Boolean(item && (String(item.answerText ?? '').trim() || item.status === 'skipped'))
  const resolvedCount = questions.filter((question) => isResolved(answerFor(question.id))).length

  const writeAnswer = (id: unknown, patch: Partial<ClarificationAnswer> | null) =>
    onChange({
      ...payload,
      answers: [
        ...answers.filter((item) => !matches(item, id)),
        ...(patch ? [{ questionStableId: id, ...patch }] : []),
      ],
    })

  return (
    <section className="grid content-start gap-4">
      <header>
        <h2 className="font-display text-xl font-bold text-fg">Clarifying questions</h2>
        <p className="mt-1 text-[13px] text-fg-3">
          Each question links back to the sentence that triggered it. Answer or skip every one, then accept to build the
          final story.
        </p>
      </header>

      {questions.length ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/20 bg-warning/[0.08] px-4 py-3">
          <AlertTriangle className="size-4 shrink-0 text-warning" />
          <p className="text-[13px] text-fg-2">
            {questions.length} question{questions.length === 1 ? '' : 's'} identified. You can skip any or all and generate
            anyway.
          </p>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-warning/20">
              <div
                className="h-full rounded-full bg-warning transition-[width]"
                style={{ width: `${questions.length ? (resolvedCount / questions.length) * 100 : 0}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-[13px] font-bold text-fg">
              {resolvedCount} / {questions.length}
            </span>
          </div>
        </div>
      ) : (
        <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">
          No ambiguities were detected. Accept this stage to continue.
        </p>
      )}

      <div className="grid gap-3.5 lg:grid-cols-2">
        {questions.map((question, index) => {
          const id = question.id
          const answer = answerFor(id)
          const skipped = answer?.status === 'skipped'
          const category = String(question.category ?? 'Clarification')
          const sourceSentence = String(question.sourceSentence ?? question.sourceClause ?? '')
          const sentenceIndex = question.sentenceIndex
          return (
            <Card key={String(id ?? index)} className={cn('p-[18px]', skipped && 'opacity-60')}>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-fg-3">Q{index + 1}</span>
                  <Chip tone={CLARIFICATION_TONES[category] ?? 'muted'} className="text-[10px]">
                    {category}
                  </Chip>
                </div>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-fg-3 transition hover:text-fg"
                  onClick={() => writeAnswer(id, skipped ? null : { status: 'skipped' })}
                >
                  {skipped ? 'Undo skip' : 'Skip'}
                </button>
              </div>
              <p className="mb-2.5 text-sm font-semibold text-fg">
                {String(question.text ?? question.question ?? `Question ${index + 1}`)}
              </p>
              {sourceSentence ? (
                <div className="mb-3 flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5">
                  <Quote className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  <p className="text-xs italic text-fg-2">
                    {sentenceIndex ? (
                      <span className="mr-1 font-mono not-italic text-fg-3">S{String(sentenceIndex)}</span>
                    ) : null}
                    “{sourceSentence}”
                  </p>
                </div>
              ) : null}
              {question.reason ? (
                <p className="mb-2 text-[11.5px] text-fg-3">{String(question.reason)}</p>
              ) : null}
              <label className="mb-1.5 block text-[11.5px] font-semibold text-fg-3">Your answer</label>
              <input
                className={inputClasses()}
                value={String(answer?.answerText ?? '')}
                placeholder={skipped ? 'Skipped — click Undo skip to answer' : 'Type your answer…'}
                disabled={skipped}
                onChange={(event) => writeAnswer(id, { answerText: event.target.value })}
              />
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SaveButton busy={busy} onClick={() => void onSave('clarifications', payload, revision.version_number)} />
        {questions.length ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => {
              onChange({
                ...payload,
                answers: questions.map((question) => ({ questionStableId: question.id, status: 'skipped' })),
              })
            }}
          >
            Skip all
          </Button>
        ) : null}
        <small className="text-xs text-fg-3">
          {resolvedCount} of {questions.length} answered or skipped
        </small>
      </div>
    </section>
  )
}

function FinalStoryReview({
  revision,
  payload,
  busy,
  onSave,
  onChange,
}: {
  revision: PipelineStageRevision
  payload: Record<string, unknown>
  busy: boolean
  onSave: (
    stage: PipelineStage,
    payload: Record<string, unknown>,
    version: number,
  ) => Promise<PipelineStageRevision | undefined>
  onChange: (payload: Record<string, unknown>) => void
}) {
  const sections = Array.isArray(payload.atomicStorySections)
    ? payload.atomicStorySections.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    : []
  const warnings = Array.isArray(payload.warnings) ? payload.warnings.map(String) : []
  const answers = Array.isArray(payload.appliedClarificationAnswers)
    ? payload.appliedClarificationAnswers.filter(
        (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
      )
    : []
  function updateSection(index: number, field: string, value: string) {
    const nextSections = sections.map((section, sectionIndex) =>
      sectionIndex === index ? { ...section, [field]: value || null } : section,
    )
    onChange({ ...payload, atomicStorySections: nextSections })
  }
  return (
    <section className="grid content-start gap-5">
      <header>
        <h2 className="font-display text-xl font-bold text-fg">Final story</h2>
        <p className="mt-1 text-[13px] text-fg-3">
          Review each generated user story. Correct the sentence or its actor, action, and object before proceeding.
        </p>
      </header>
      {sections.length ? (
        <div className="grid gap-4">
          {sections.map((section, index) => {
            const sectionWarnings = Array.isArray(section.warnings) ? section.warnings.map(String) : []
            return (
              <article className="grid gap-4 rounded-lg border border-border p-4 shadow-sm" key={String(section.id ?? index)}>
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <Chip tone="accent">{String(section.id ?? `Story ${index + 1}`)}</Chip>
                  {section.modality ? <Chip tone="muted">{String(section.modality)}</Chip> : null}
                </header>
                <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
                  User story
                  <Textarea
                    className="min-h-20 font-normal"
                    value={String(section.normalizedSentence ?? '')}
                    onChange={(event) => updateSection(index, 'normalizedSentence', event.target.value)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StoryField label="Actor" value={section.actor} onChange={(value) => updateSection(index, 'actor', value)} />
                  <StoryField label="Action" value={section.action} onChange={(value) => updateSection(index, 'action', value)} />
                  <StoryField label="Object" value={section.object} onChange={(value) => updateSection(index, 'object', value)} />
                </div>
                {sectionWarnings.length ? (
                  <div className="rounded-md bg-warning/10 p-3 text-[13px] text-warning">
                    <strong>Needs attention</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {sectionWarnings.map((warning, warningIndex) => (
                        <li key={warningIndex}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">No individual user stories were generated.</p>
      )}
      {answers.length ? (
        <details className="rounded-md border border-border p-4">
          <summary className="cursor-pointer text-sm font-semibold text-fg-2">
            Applied clarification answers ({answers.length})
          </summary>
          <ul className="mt-3 grid gap-2 text-[13px] text-fg-2">
            {answers.map((answer, index) => (
              <li key={String(answer.questionStableId ?? index)}>
                <span className="font-semibold">{String(answer.questionStableId ?? `Answer ${index + 1}`)}:</span>{' '}
                {String(answer.answerText ?? '')}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {warnings.length ? (
        <div className="rounded-md bg-warning/10 p-4 text-[13px] text-warning">
          <strong>Story-wide warnings</strong>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <SaveButton busy={busy} onClick={() => void onSave('final-story', payload, revision.version_number)} />
    </section>
  )
}

function StoryField({ label, value, onChange }: { label: string; value: unknown; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
      {label}
      <input className={inputClasses()} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function RequirementsReview({
  revision,
  payload,
  busy,
  onSave,
  onChange,
}: {
  revision: PipelineStageRevision
  payload: Record<string, unknown>
  busy: boolean
  onSave: (
    stage: PipelineStage,
    payload: Record<string, unknown>,
    version: number,
  ) => Promise<PipelineStageRevision | undefined>
  onChange: (payload: Record<string, unknown>) => void
}) {
  const requirements = Array.isArray(payload.requirements)
    ? payload.requirements.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    : []
  const enabledCount = requirements.filter((requirement) => requirement.enabled !== false).length
  function updateRequirement(index: number, field: string, value: unknown) {
    const nextRequirements = requirements.map((requirement, requirementIndex) =>
      requirementIndex === index ? { ...requirement, [field]: value } : requirement,
    )
    onChange({ ...payload, requirements: nextRequirements })
  }
  return (
    <section className="grid content-start gap-5">
      <header>
        <h2 className="font-display text-xl font-bold text-fg">Requirements review</h2>
        <p className="mt-1 text-[13px] text-fg-3">
          Review the generated requirements, adjust wording, and disable any item you do not want to carry forward.
        </p>
        <p className="mt-2 text-[13px] font-semibold text-fg-2">
          {enabledCount} of {requirements.length} requirements included
        </p>
      </header>
      {requirements.length ? (
        <div className="grid gap-4">
          {requirements.map((requirement, index) => {
            const type = String(requirement.requirementType ?? 'functional')
            const isNfr = type === 'non_functional'
            const warnings = Array.isArray(requirement.warnings) ? requirement.warnings.map(String) : []
            const enabled = requirement.enabled !== false
            return (
              <article
                className={cn(
                  'grid gap-4 rounded-lg border border-border p-4 shadow-sm',
                  !enabled && 'bg-surface-2 opacity-65',
                )}
                key={String(requirement.id ?? index)}
              >
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="accent">
                      {String(requirement.requirementId ?? requirement.id ?? `Requirement ${index + 1}`)}
                    </Chip>
                    <Chip tone="muted">{type.replaceAll('_', ' ')}</Chip>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-fg-2">
                    <input
                      className="size-4 accent-accent"
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) => updateRequirement(index, 'enabled', event.target.checked)}
                    />
                    Include
                  </label>
                </header>
                <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
                  Requirement statement
                  <Textarea
                    className="min-h-20 font-normal"
                    value={String(requirement.statement ?? '')}
                    onChange={(event) => updateRequirement(index, 'statement', event.target.value)}
                  />
                </label>
                {requirement.sourceSentence ? (
                  <p className="-mt-2 text-[11.5px] italic text-fg-3">
                    Traces to: “{String(requirement.sourceSentence)}”
                  </p>
                ) : null}
                {isNfr ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StoryField label="Category" value={requirement.nfrCategory} onChange={(value) => updateRequirement(index, 'nfrCategory', value || null)} />
                    <StoryField label="Metric" value={requirement.metric} onChange={(value) => updateRequirement(index, 'metric', value || null)} />
                    <StoryField label="Target" value={requirement.targetValue} onChange={(value) => updateRequirement(index, 'targetValue', value || null)} />
                    <StoryField label="Unit" value={requirement.unit} onChange={(value) => updateRequirement(index, 'unit', value || null)} />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StoryField label="Actor" value={requirement.actor} onChange={(value) => updateRequirement(index, 'actor', value || null)} />
                    <StoryField label="Action" value={requirement.action} onChange={(value) => updateRequirement(index, 'action', value || null)} />
                    <StoryField label="Object" value={requirement.object} onChange={(value) => updateRequirement(index, 'object', value || null)} />
                  </div>
                )}
                {warnings.length ? (
                  <div className="rounded-md bg-warning/10 p-3 text-[13px] text-warning">
                    <strong>Needs attention</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {warnings.map((warning, warningIndex) => (
                        <li key={warningIndex}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">No requirements were generated.</p>
      )}
      <SaveButton busy={busy} onClick={() => void onSave('requirements', payload, revision.version_number)} />
    </section>
  )
}

function XmlReview({ revision }: { revision: PipelineStageRevision }) {
  const xml = typeof revision.payload.xml === 'string' ? revision.payload.xml : ''
  const valid = (revision.payload.validation as Record<string, unknown> | undefined)?.valid === true
  function download() {
    const file = new Blob([xml], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'class-diagram.drawio'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }
  return (
    <section className="grid content-start gap-5">
      <header>
        <h2 className="font-display text-xl font-bold text-fg">Draw.io class diagram</h2>
        <p className="mt-1 text-[13px] text-fg-3">
          Preview the generated class diagram, then download the compatible Draw.io XML file if you need to keep editing it.
        </p>
      </header>
      <div className={cn('rounded-md p-4 text-[13px]', valid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
        <strong>{valid ? 'Diagram validated' : 'Diagram needs review'}</strong>
        <p className="mt-1">
          {valid ? 'The XML is ready to preview, download, and open in Draw.io.' : 'Review the XML before using it.'}
        </p>
      </div>
      {xml ? <DrawioEmbed xml={xml} title="Draw.io class diagram preview" className="h-[32rem]" /> : null}
      <Button className="w-max" disabled={!xml} onClick={download}>
        <Download /> Download Draw.io XML
      </Button>
      <details className="rounded-md border border-border p-4">
        <summary className="cursor-pointer text-sm font-semibold text-fg-2">View XML source</summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-sidebar p-3 font-mono text-xs leading-5 text-sidebar-fg-active">
          {xml || 'No XML was generated.'}
        </pre>
      </details>
    </section>
  )
}

function JsonStageEditor({
  revision,
  stage,
  payload,
  setPayload,
  busy,
  onSave,
}: {
  revision: PipelineStageRevision
  stage: PipelineStage
  payload: Record<string, unknown>
  setPayload: (value: Record<string, unknown>) => void
  busy: boolean
  onSave: (
    stage: PipelineStage,
    payload: Record<string, unknown>,
    version: number,
  ) => Promise<PipelineStageRevision | undefined>
}) {
  const [text, setText] = useState(() => JSON.stringify(payload, null, 2))
  const [invalid, setInvalid] = useState(false)
  useEffect(() => {
    setText(JSON.stringify(payload, null, 2))
    setInvalid(false)
  }, [payload])
  function change(value: string) {
    setText(value)
    try {
      const parsed = JSON.parse(value)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error()
      setPayload(parsed as Record<string, unknown>)
      setInvalid(false)
    } catch {
      setInvalid(true)
    }
  }
  return (
    <section className="grid content-start gap-3">
      <h2 className="font-display text-xl font-bold text-fg">{stages.find((item) => item.id === stage)?.label} review</h2>
      <p className="text-[13px] text-fg-3">{stages.find((item) => item.id === stage)?.help}</p>
      <Textarea
        className="min-h-[22rem] font-mono text-xs leading-5"
        value={text}
        onChange={(event) => change(event.target.value)}
        spellCheck={false}
      />
      {invalid ? <ErrorNotice text="This draft must be valid JSON before it can be saved." /> : null}
      <SaveButton busy={busy || invalid} onClick={() => void onSave(stage, payload, revision.version_number)} />
    </section>
  )
}

function SaveButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <Button className="w-max" disabled={busy} onClick={onClick}>
      <Save /> {busy ? 'Saving…' : 'Save draft'}
    </Button>
  )
}

function ErrorNotice({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 rounded-md bg-danger/10 p-3 text-[13px] text-danger">
      <AlertTriangle className="size-4" /> {text}
    </p>
  )
}
