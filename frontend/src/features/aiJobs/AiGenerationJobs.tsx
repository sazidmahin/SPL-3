import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, GitCompare, RotateCw, WandSparkles, XCircle } from 'lucide-react'
import type { GenerationJob } from '../../domains/srs/types'
import type { Project } from '../../domains/project/types'
import type { PipelineRun, PipelineStage } from '../../domains/generationPipeline/types'
import { Button, Card, Chip, DataTable, EmptyState, PageHeader, ProgressBar, Select, StatTile, cn } from '../../shared/ui'
import type { Tone } from '../../shared/ui'
import { DrawioEmbed } from '../diagram/DrawioEmbed'

type AiGenerationJobsProps = {
  generationJobs: GenerationJob[]
  projects: Project[]
  pipelineRuns?: PipelineRun[]
}

function readablePipelineMode(mode: PipelineRun['generation_mode']) {
  return mode === 'rule_based' ? 'Rule-Based Engine' : mode === 'ollama' ? 'Local AI (Ollama)' : mode === 'srsgen' ? 'SrsGen' : 'AI-Gen'
}

const COMPARE_STAGES: Array<{ id: PipelineStage; label: string }> = [
  { id: 'input', label: 'Input' },
  { id: 'clarifications', label: 'Clarifications' },
  { id: 'final-story', label: 'Final story' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'class-model', label: 'Class model' },
  { id: 'xml', label: 'Draw.io XML' },
]

type StageEntry = {
  id: string
  label?: string
  text: string
}

function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null) : []
}

function stageRevision(run: PipelineRun | undefined, stage: PipelineStage) {
  return run?.stages.find((item) => item.stage_name === stage)
}

function clarificationEntries(run: PipelineRun | undefined): StageEntry[] {
  const payload = stageRevision(run, 'clarifications')?.payload
  const questions = asRecords(payload?.clarificationQuestions)
  const answers = asRecords(payload?.answers)
  return questions.map((question, index) => {
    const id = question.id
    const answer = answers.find((item) => item.questionStableId === id || item.question_id === id)
    const answerText = !answer ? 'Unanswered' : answer.status === 'skipped' ? 'Skipped' : String(answer.answerText ?? '') || 'Unanswered'
    return {
      id: String(id ?? index),
      label: String(question.category ?? 'Clarification'),
      text: `${String(question.text ?? question.question ?? `Question ${index + 1}`)} — Answer: ${answerText}`,
    }
  })
}

function finalStoryEntries(run: PipelineRun | undefined): StageEntry[] {
  const payload = stageRevision(run, 'final-story')?.payload
  const sections = asRecords(payload?.atomicStorySections)
  return sections.map((section, index) => ({
    id: String(section.id ?? index),
    label: section.modality ? String(section.modality) : undefined,
    text:
      String(section.normalizedSentence ?? '').trim() ||
      [section.actor, section.action, section.object].filter(Boolean).map(String).join(' · '),
  }))
}

function requirementEntries(run: PipelineRun | undefined): StageEntry[] {
  const payload = stageRevision(run, 'requirements')?.payload
  const requirements = asRecords(payload?.requirements).filter((item) => item.enabled !== false)
  return requirements.map((item, index) => ({
    id: String(item.requirementId ?? item.id ?? `#${index + 1}`),
    label: String(item.requirementType ?? 'functional').replaceAll('_', ' '),
    text: String(item.statement ?? ''),
  }))
}

function classModelEntries(run: PipelineRun | undefined): StageEntry[] {
  const payload = stageRevision(run, 'class-model')?.payload
  const classes = asRecords(payload?.classes).filter((item) => item.enabled !== false)
  return classes.map((item, index) => {
    const attributeCount = asRecords(item.attributes).length
    const methodCount = asRecords(item.methods).length
    return {
      id: String(item.id ?? item.name ?? index),
      text: `${String(item.name ?? 'Unnamed class')} — ${attributeCount} attribute${attributeCount === 1 ? '' : 's'}, ${methodCount} method${methodCount === 1 ? '' : 's'}`,
    }
  })
}

function entriesFor(run: PipelineRun | undefined, stage: PipelineStage): StageEntry[] {
  if (stage === 'clarifications') return clarificationEntries(run)
  if (stage === 'final-story') return finalStoryEntries(run)
  if (stage === 'requirements') return requirementEntries(run)
  if (stage === 'class-model') return classModelEntries(run)
  return []
}

function normalize(text: string) {
  return text.trim().toLowerCase()
}

const STATUS_TABS = ['all', 'running', 'completed', 'failed', 'pending'] as const
type StatusTab = (typeof STATUS_TABS)[number]

const statusTone: Record<string, Tone> = {
  completed: 'active',
  running: 'sky',
  pending: 'ai',
  partially_completed: 'pending',
  failed: 'danger',
}

type JobRow = {
  id: string
  kind: string
  project: string
  type: string
  progressPercent: number
  statusLabel: string
  filterStatus: StatusTab
  createdAt: string
}

function pipelineFilterStatus(status: string): Exclude<StatusTab, 'all'> {
  if (status === 'running') return 'running'
  if (status === 'failed') return 'failed'
  if (status === 'completed' || status === 'approved') return 'completed'
  return 'pending'
}

function pipelineProgressPercent(status: string): number {
  if (status === 'completed' || status === 'approved') return 100
  if (status === 'running') return 50
  if (status === 'failed') return 0
  return 15
}

export function AiGenerationJobs({ generationJobs, projects, pipelineRuns = [] }: AiGenerationJobsProps) {
  const [tab, setTab] = useState<StatusTab>('all')
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareLeftId, setCompareLeftId] = useState('')
  const [compareRightId, setCompareRightId] = useState('')
  const [openRunId, setOpenRunId] = useState<string | null>(null)
  const projectName = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects])
  const openRun = pipelineRuns.find((run) => run.id === openRunId) ?? null

  const rows: JobRow[] = useMemo(() => {
    const legacyRows: JobRow[] = generationJobs.map((job) => ({
      id: job.id,
      kind: 'AI Generation',
      project: projectName.get(job.project_id) ?? '—',
      type: job.job_type.replaceAll('_', ' '),
      progressPercent: job.progress_percent,
      statusLabel: job.status.replaceAll('_', ' '),
      filterStatus: job.status === 'partially_completed' ? 'failed' : (job.status as StatusTab),
      createdAt: job.created_at,
    }))
    const pipelineRows: JobRow[] = pipelineRuns.map((run) => ({
      id: run.id,
      kind: 'SRS Pipeline',
      project: projectName.get(run.project_id) ?? '—',
      type: readablePipelineMode(run.generation_mode),
      progressPercent: pipelineProgressPercent(run.status),
      statusLabel: run.status.replaceAll('_', ' '),
      filterStatus: pipelineFilterStatus(run.status),
      createdAt: run.created_at,
    }))
    return [...legacyRows, ...pipelineRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [generationJobs, pipelineRuns, projectName])

  const counts = {
    all: rows.length,
    running: rows.filter((row) => row.filterStatus === 'running').length,
    completed: rows.filter((row) => row.filterStatus === 'completed').length,
    failed: rows.filter((row) => row.filterStatus === 'failed').length,
    pending: rows.filter((row) => row.filterStatus === 'pending').length,
  }

  const visible = tab === 'all' ? rows : rows.filter((row) => row.filterStatus === tab)

  return (
    <section className="grid gap-6" id="ai-jobs">
      <PageHeader title="AI Generation Jobs" description="Track and manage AI-generated SRS and diagram jobs." />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total jobs" value={counts.all} icon={WandSparkles} />
        <StatTile label="Completed" value={counts.completed} icon={CheckCircle2} />
        <StatTile label="Running" value={counts.running} icon={RotateCw} />
        <StatTile label="Failed" value={counts.failed} icon={XCircle} />
      </div>

      {pipelineRuns.length ? (
        <Card className="grid gap-2.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-3">
              SRS generation pipeline runs ({pipelineRuns.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={pipelineRuns.length < 2}
              onClick={() => {
                if (!compareOpen) {
                  setCompareLeftId(pipelineRuns[0]?.id ?? '')
                  setCompareRightId(pipelineRuns[1]?.id ?? '')
                }
                setCompareOpen((open) => !open)
              }}
            >
              <GitCompare /> {compareOpen ? 'Hide compare' : 'Compare runs'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="SRS generation pipeline runs">
            {pipelineRuns.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => setOpenRunId((current) => (current === run.id ? null : run.id))}
                className={cn(
                  'grid gap-0.5 rounded-md border px-3 py-2 text-left text-sm font-semibold transition',
                  openRunId === run.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-fg-2 hover:border-border-strong',
                )}
              >
                <span className="truncate">{run.title}</span>
                <small className="text-[10px] font-medium capitalize opacity-75">
                  {readablePipelineMode(run.generation_mode)} · {run.status.replaceAll('_', ' ')} ·{' '}
                  {new Date(run.created_at).toLocaleString()}
                </small>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {openRun ? <PipelineRunDocumentCard run={openRun} onClose={() => setOpenRunId(null)} /> : null}

      {compareOpen ? (
        <RunComparePanel
          runs={pipelineRuns}
          leftId={compareLeftId}
          rightId={compareRightId}
          onLeftChange={setCompareLeftId}
          onRightChange={setCompareRightId}
        />
      ) : null}

      <Card>
        <div className="flex flex-wrap gap-1 border-b border-border p-3">
          {STATUS_TABS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-[13px] font-semibold capitalize transition',
                tab === value ? 'bg-accent/15 text-accent' : 'text-fg-3 hover:bg-surface-2 hover:text-fg',
              )}
            >
              {value} ({counts[value]})
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            className="m-5"
            icon={Clock3}
            title="No jobs to show"
            description="Generation jobs appear here once you run the SRS pipeline."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Job</th>
                <th>Kind</th>
                <th>Project</th>
                <th>Type</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono text-[12px] text-fg">{row.id.slice(0, 8)}</td>
                  <td>{row.kind}</td>
                  <td>{row.project}</td>
                  <td className="capitalize">{row.type}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ProgressBar className="w-20" value={row.progressPercent} />
                      <span className="text-xs text-fg-3">{row.progressPercent}%</span>
                    </div>
                  </td>
                  <td>
                    <Chip tone={statusTone[row.filterStatus] ?? 'muted'} className="capitalize">
                      {row.statusLabel}
                    </Chip>
                  </td>
                  <td className="whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </section>
  )
}

function PipelineRunDocumentCard({ run, onClose }: { run: PipelineRun; onClose: () => void }) {
  const storySections = finalStoryEntries(run)
  const requirements = requirementEntries(run)
  const xml = stageRevision(run, 'xml')?.payload.xml
  const xmlText = typeof xml === 'string' ? xml : ''

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <PageHeader size="section" eyebrow="Generated via pipeline" title={run.title} />
          <Chip tone="ai">{readablePipelineMode(run.generation_mode)}</Chip>
          <Chip tone="muted" className="capitalize">
            {run.status.replaceAll('_', ' ')}
          </Chip>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {storySections.length > 0 ? (
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-fg-3">Final story</h3>
          <ul className="grid gap-2">
            {storySections.map((section) => (
              <li key={section.id} className="rounded-md border border-border bg-surface-2 p-3 text-[13px] leading-6 text-fg-2">
                {section.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {requirements.length > 0 ? (
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-fg-3">Requirements</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Extracted requirements">
            {requirements.map((requirement) => (
              <div key={requirement.id} className="grid gap-1 rounded-lg border border-border bg-surface p-3">
                <strong className="font-mono text-[13px] text-accent">{requirement.id}</strong>
                <span className="text-[11px] font-bold uppercase tracking-wide text-fg-3">{requirement.label}</span>
                <p className="text-[13px] leading-6 text-fg-2">{requirement.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {xmlText ? (
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-fg-3">Class diagram</h3>
          <DrawioEmbed xml={xmlText} title={`${run.title} diagram`} className="h-[26rem]" />
        </div>
      ) : null}

      {storySections.length === 0 && requirements.length === 0 && !xmlText ? (
        <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">
          This run hasn't generated any content yet. Open it in the Generate SRS pipeline tab to continue.
        </p>
      ) : null}
    </Card>
  )
}

function RunComparePanel({
  runs,
  leftId,
  rightId,
  onLeftChange,
  onRightChange,
}: {
  runs: PipelineRun[]
  leftId: string
  rightId: string
  onLeftChange: (id: string) => void
  onRightChange: (id: string) => void
}) {
  const [stage, setStage] = useState<PipelineStage>('requirements')
  const leftRun = runs.find((run) => run.id === leftId)
  const rightRun = runs.find((run) => run.id === rightId)

  function runLabel(run: PipelineRun | undefined) {
    if (!run) return 'Select a run'
    return `${readablePipelineMode(run.generation_mode)} · ${new Date(run.created_at).toLocaleString()}`
  }

  return (
    <Card className="grid gap-4 p-5">
      <PageHeader
        size="section"
        eyebrow="Compare"
        title="Compare two generation runs"
        description="Pick a stage tab, then compare that stage's output between the two runs."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
          Run A
          <Select value={leftId} onChange={(event) => onLeftChange(event.target.value)}>
            <option value="" disabled>
              Select a run
            </option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.title} — {runLabel(run)}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-fg-2">
          Run B
          <Select value={rightId} onChange={(event) => onRightChange(event.target.value)}>
            <option value="" disabled>
              Select a run
            </option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.title} — {runLabel(run)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {leftRun && rightRun ? (
        <>
          <div className="flex flex-wrap gap-1 rounded-md bg-surface-2 p-1" role="tablist" aria-label="Comparison stage">
            {COMPARE_STAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={stage === item.id}
                onClick={() => setStage(item.id)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition',
                  stage === item.id ? 'bg-surface text-fg shadow-sm' : 'text-fg-3 hover:text-fg',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {stage === 'input' || stage === 'xml' ? (
            <FullTextCompare stage={stage} leftRun={leftRun} rightRun={rightRun} />
          ) : (
            <EntryCompare stage={stage} leftRun={leftRun} rightRun={rightRun} />
          )}
        </>
      ) : (
        <p className="text-[13px] text-fg-3">Select two runs to compare.</p>
      )}
    </Card>
  )
}

function EntryCompare({ stage, leftRun, rightRun }: { stage: PipelineStage; leftRun: PipelineRun; rightRun: PipelineRun }) {
  const leftEntries = entriesFor(leftRun, stage)
  const rightEntries = entriesFor(rightRun, stage)
  const rowCount = Math.max(leftEntries.length, rightEntries.length)
  const matched = leftEntries.filter((item, index) => rightEntries[index] && normalize(rightEntries[index].text) === normalize(item.text)).length
  const hasStage = Boolean(stageRevision(leftRun, stage) || stageRevision(rightRun, stage))

  if (!hasStage) {
    return <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">Neither run has generated this stage yet.</p>
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3 text-[13px] text-fg-2">
        <span>
          <strong className="text-fg">{leftEntries.length}</strong> in Run A
        </span>
        <span>
          <strong className="text-fg">{rightEntries.length}</strong> in Run B
        </span>
        <span>
          <strong className="text-fg">{matched}</strong> matched
        </span>
      </div>
      <div className="grid overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-2 border-b border-border bg-surface-2">
          <div className="border-r border-border px-4 py-2 text-[12px] font-bold text-fg">{leftRun.title}</div>
          <div className="px-4 py-2 text-[12px] font-bold text-fg">{rightRun.title}</div>
        </div>
        {rowCount === 0 ? (
          <p className="p-4 text-[13px] text-fg-3">Neither run produced any items for this stage.</p>
        ) : (
          Array.from({ length: rowCount }, (_, index) => {
            const left = leftEntries[index]
            const right = rightEntries[index]
            const same = Boolean(left && right && normalize(left.text) === normalize(right.text))
            return (
              <div key={index} className="grid grid-cols-2 border-b border-border last:border-b-0">
                <EntryCell entry={left} tone={!left ? 'empty' : same ? 'match' : !right ? 'only' : 'diff'} />
                <EntryCell
                  entry={right}
                  tone={!right ? 'empty' : same ? 'match' : !left ? 'only' : 'diff'}
                  className="border-l border-border"
                />
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

function FullTextCompare({ stage, leftRun, rightRun }: { stage: 'input' | 'xml'; leftRun: PipelineRun; rightRun: PipelineRun }) {
  const leftRevision = stageRevision(leftRun, stage)
  const rightRevision = stageRevision(rightRun, stage)
  if (!leftRevision && !rightRevision) {
    return <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">Neither run has generated this stage yet.</p>
  }
  const leftText =
    stage === 'input'
      ? String(((leftRevision?.payload.normalization as Record<string, unknown> | undefined) ?? {}).rawText ?? '')
      : String(leftRevision?.payload.xml ?? '')
  const rightText =
    stage === 'input'
      ? String(((rightRevision?.payload.normalization as Record<string, unknown> | undefined) ?? {}).rawText ?? '')
      : String(rightRevision?.payload.xml ?? '')
  const same = normalize(leftText) === normalize(rightText)

  if (stage === 'xml') {
    return (
      <>
        {same ? (
          <div className="rounded-md bg-success/10 px-4 py-2.5 text-[13px] text-success">Both runs produced an identical diagram.</div>
        ) : (
          <div className="rounded-md bg-warning/10 px-4 py-2.5 text-[13px] text-warning">The two diagrams differ.</div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <div className="rounded-md bg-surface-2 px-4 py-2 text-[12px] font-bold text-fg">{leftRun.title}</div>
            {leftText ? (
              <DrawioEmbed xml={leftText} title={`${leftRun.title} diagram`} className="h-[28rem]" />
            ) : (
              <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">No diagram generated.</p>
            )}
          </div>
          <div className="grid gap-2">
            <div className="rounded-md bg-surface-2 px-4 py-2 text-[12px] font-bold text-fg">{rightRun.title}</div>
            {rightText ? (
              <DrawioEmbed xml={rightText} title={`${rightRun.title} diagram`} className="h-[28rem]" />
            ) : (
              <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">No diagram generated.</p>
            )}
          </div>
        </div>
        <details className="rounded-md border border-border p-4">
          <summary className="cursor-pointer text-sm font-semibold text-fg-2">View raw XML</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-sidebar p-3 font-mono text-[11px] leading-5 text-sidebar-fg-active">
              {leftText || 'Not generated.'}
            </pre>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-sidebar p-3 font-mono text-[11px] leading-5 text-sidebar-fg-active">
              {rightText || 'Not generated.'}
            </pre>
          </div>
        </details>
      </>
    )
  }

  return (
    <>
      {same ? (
        <div className="rounded-md bg-success/10 px-4 py-2.5 text-[13px] text-success">Both runs produced identical content for this stage.</div>
      ) : (
        <div className="rounded-md bg-warning/10 px-4 py-2.5 text-[13px] text-warning">The two runs differ for this stage.</div>
      )}
      <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-2">
        <div className="border-b border-border sm:border-b-0 sm:border-r">
          <div className="border-b border-border bg-surface-2 px-4 py-2 text-[12px] font-bold text-fg">{leftRun.title}</div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4 font-mono text-[11.5px] leading-5 text-fg-2">
            {leftText || 'Not generated.'}
          </pre>
        </div>
        <div>
          <div className="border-b border-border bg-surface-2 px-4 py-2 text-[12px] font-bold text-fg">{rightRun.title}</div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4 font-mono text-[11.5px] leading-5 text-fg-2">
            {rightText || 'Not generated.'}
          </pre>
        </div>
      </div>
    </>
  )
}

function EntryCell({
  entry,
  tone,
  className,
}: {
  entry: StageEntry | undefined
  tone: 'match' | 'diff' | 'only' | 'empty'
  className?: string
}) {
  if (!entry) {
    return (
      <div className={cn('grid place-items-center bg-surface-2 px-4 py-3 text-[12px] italic text-fg-3', className)}>
        Not present in this run
      </div>
    )
  }
  return (
    <div className={cn('grid gap-1 px-4 py-3', tone === 'diff' && 'bg-warning/5', tone === 'only' && 'bg-sky/5', className)}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-bold text-fg-3">{entry.id}</span>
        {entry.label ? (
          <Chip tone="muted" className="text-[9.5px]">
            {entry.label}
          </Chip>
        ) : null}
        {tone === 'diff' ? (
          <Chip tone="warning" className="ml-auto text-[9.5px]">
            Different
          </Chip>
        ) : null}
        {tone === 'only' ? (
          <Chip tone="ai" className="ml-auto text-[9.5px]">
            Only here
          </Chip>
        ) : null}
      </div>
      <p className="text-[13px] text-fg-2">{entry.text}</p>
    </div>
  )
}
