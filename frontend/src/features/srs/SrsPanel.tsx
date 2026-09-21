import type { FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ClassDiagramMethod, DiagramDetail } from '../../domains/diagram/types'
import type { GenerationJob, SrsDocument } from '../../domains/srs/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Button, Card, Chip, Field, Input, PageHeader, Textarea, cn } from '../../shared/ui'

const SRS_RAW_TEXT_LIMIT = 200000
const formatCount = new Intl.NumberFormat('en-US')

type SrsPanelProps = {
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  generationJobs: GenerationJob[]
  srsDocuments: SrsDocument[]
  activeSrsDocument: SrsDocument | null
  generatedDiagrams: DiagramDetail[]
  srsTitle: string
  srsRawText: string
  generateClassDiagram: boolean
  isLoadingGenerationJobs: boolean
  isLoadingSrsDocuments: boolean
  isStartingGeneration: boolean
  isGeneratingClassDiagram: boolean
  canGenerateSrs: boolean
  canGenerateAiDiagrams: boolean
  canExportSrs: boolean
  onReload: () => void
  onSrsTitleChange: (value: string) => void
  onSrsRawTextChange: (value: string) => void
  onGenerateClassDiagramChange: (value: boolean) => void
  onStartGeneration: (event: FormEvent<HTMLFormElement>) => void
  onSelectSrsDocument: (documentId: string) => void
  onGenerateClassDiagram: (methods: ClassDiagramMethod[]) => void
  onExportSrs: () => void
  onOpenGeneratedDiagram: (diagram: DiagramDetail) => void
}

export function SrsPanel({
  activeWorkspace,
  activeProject,
  generationJobs,
  srsDocuments,
  activeSrsDocument,
  generatedDiagrams,
  srsTitle,
  srsRawText,
  generateClassDiagram,
  isLoadingGenerationJobs,
  isLoadingSrsDocuments,
  isStartingGeneration,
  isGeneratingClassDiagram,
  canGenerateSrs,
  canGenerateAiDiagrams,
  canExportSrs,
  onReload,
  onSrsTitleChange,
  onSrsRawTextChange,
  onGenerateClassDiagramChange,
  onStartGeneration,
  onSelectSrsDocument,
  onGenerateClassDiagram,
  onExportSrs,
  onOpenGeneratedDiagram,
}: SrsPanelProps) {
  const latestGenerationJob = generationJobs[0]

  return (
    <Card className="grid gap-5 p-5">
      <PageHeader
        size="section"
        eyebrow="SRS generation"
        title="Generate a document"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={onReload}
            disabled={!activeWorkspace || !activeProject || isLoadingGenerationJobs || isLoadingSrsDocuments}
          >
            {isLoadingGenerationJobs || isLoadingSrsDocuments ? 'Loading…' : 'Reload'}
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)]">
        <form className="grid gap-4" onSubmit={onStartGeneration}>
          <Field label="Title" htmlFor="srs-title">
            <Input id="srs-title" value={srsTitle} onChange={(event) => onSrsTitleChange(event.target.value)} required />
          </Field>
          <Field
            label="Requirements"
            htmlFor="srs-raw"
            hint={`${formatCount.format(srsRawText.length)} / ${formatCount.format(SRS_RAW_TEXT_LIMIT)} characters`}
          >
            <Textarea
              id="srs-raw"
              className="min-h-52"
              value={srsRawText}
              maxLength={SRS_RAW_TEXT_LIMIT}
              onChange={(event) => onSrsRawTextChange(event.target.value)}
              rows={10}
              required
            />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-fg-2">
            <input
              checked={generateClassDiagram}
              type="checkbox"
              className="size-4 accent-accent"
              disabled={!canGenerateAiDiagrams}
              onChange={(event) => onGenerateClassDiagramChange(event.target.checked)}
            />
            Also generate a class diagram
          </label>
          {!canGenerateSrs ? <UpgradeNote>Upgrade to generate SRS documents.</UpgradeNote> : null}
          <Button type="submit" className="w-max" disabled={!activeProject || isStartingGeneration || !canGenerateSrs}>
            {isStartingGeneration ? 'Starting…' : generateClassDiagram ? 'Generate SRS + diagram' : 'Start generation'}
          </Button>
        </form>

        <div className="grid content-start gap-3 rounded-lg border border-border bg-surface-2 p-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Latest status</span>
          <h3 className="font-display text-lg font-bold capitalize text-fg">
            {latestGenerationJob?.status.replaceAll('_', ' ') ?? 'No jobs yet'}
          </h3>
          {latestGenerationJob ? (
            <p className="text-[13px] text-fg-2">
              {latestGenerationJob.job_type} · {latestGenerationJob.progress_percent}% ·{' '}
              {new Date(latestGenerationJob.created_at).toLocaleString()}
            </p>
          ) : (
            <p className="text-[13px] text-fg-2">Submit requirements to create a generation job.</p>
          )}
          <div className="grid gap-2" aria-label="Generation jobs">
            {generationJobs.map((job) => (
              <div key={job.id} className="grid gap-1 rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <span className="font-semibold capitalize text-fg">{job.status.replaceAll('_', ' ')}</span>
                <small className="text-xs text-fg-3">
                  {job.job_type} · {new Date(job.created_at).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeSrsDocument ? (
        <div className="grid gap-4 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Generated SRS</span>
            <span className="text-[13px] text-fg-3">{new Date(activeSrsDocument.created_at).toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="SRS documents">
            {srsDocuments.map((document) => (
              <button
                key={document.id}
                type="button"
                onClick={() => onSelectSrsDocument(document.id)}
                className={cn(
                  'grid gap-0.5 rounded-md border px-3 py-2 text-left text-sm font-semibold transition',
                  document.id === activeSrsDocument.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-fg-2 hover:border-border-strong',
                )}
              >
                <span>{document.title}</span>
                <small className="text-xs font-medium opacity-75">{document.status}</small>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onExportSrs} disabled={!canExportSrs}>
              Export SRS
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onGenerateClassDiagram(['rule_based'])}
              disabled={isGeneratingClassDiagram || !canGenerateAiDiagrams}
            >
              {isGeneratingClassDiagram ? 'Generating…' : 'Rule-based diagram'}
            </Button>
            <Button
              size="sm"
              onClick={() => onGenerateClassDiagram(['llm'])}
              disabled={isGeneratingClassDiagram || !canGenerateAiDiagrams}
            >
              {isGeneratingClassDiagram ? 'Generating…' : 'LLM diagram'}
            </Button>
          </div>
          {!canExportSrs ? <UpgradeNote>Upgrade to export SRS documents.</UpgradeNote> : null}
          {!canGenerateAiDiagrams ? <UpgradeNote>Upgrade to generate AI diagrams.</UpgradeNote> : null}

          {generatedDiagrams.length > 0 ? (
            <div className="grid gap-3" aria-label="Generated diagram artifacts">
              {generatedDiagrams.map((diagram) => (
                <div
                  key={diagram.id}
                  className="grid gap-3 rounded-lg border border-border bg-surface-2 p-4 sm:grid-cols-[1fr_auto]"
                >
                  <div className="grid gap-1">
                    <strong className="text-fg">{diagram.title}</strong>
                    <small className="text-xs text-fg-3">
                      {diagram.diagram_type} · v{diagram.current.version_number}
                    </small>
                  </div>
                  <Button variant="secondary" size="sm" className="h-fit" onClick={() => onOpenGeneratedDiagram(diagram)}>
                    Open diagram
                  </Button>
                  <div className="flex flex-wrap gap-1.5 sm:col-span-2" aria-label="Traceability links">
                    {diagram.requirement_links.map((link) => (
                      <Chip key={link.id} tone="muted">
                        {link.requirement_code} → {link.diagram_element_label}
                      </Chip>
                    ))}
                    {diagram.requirement_links.length === 0 ? <Chip tone="muted">No traceability links.</Chip> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="prose-srs max-h-[35rem] overflow-auto rounded-lg border border-border bg-surface-2 p-5 text-[13px] leading-6 text-fg-2 [&_code]:font-mono [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:font-display [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-fg [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-fg [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-fg [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-fg [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSrsDocument.content_markdown}</ReactMarkdown>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Extracted requirements">
            {activeSrsDocument.extracted_requirements?.map((requirement) => (
              <div key={requirement.id} className="grid gap-1 rounded-lg border border-border bg-surface p-3">
                <strong className="font-mono text-[13px] text-accent">{requirement.requirement_code}</strong>
                <span className="text-[11px] font-bold uppercase tracking-wide text-fg-3">
                  {requirement.requirement_type.replaceAll('_', ' ')}
                </span>
                {requirement.nfr_subtype ? <small className="text-xs text-fg-3">{requirement.nfr_subtype}</small> : null}
                <p className="text-[13px] leading-6 text-fg-2">{requirement.requirement_text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function UpgradeNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-[13px] text-warning">{children}</p>
  )
}
