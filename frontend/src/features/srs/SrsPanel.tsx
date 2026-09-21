import { useState } from 'react'
import { FilePlus2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ClassDiagramMethod, DiagramDetail } from '../../domains/diagram/types'
import type { SrsDocument } from '../../domains/srs/types'
import type { PipelineRun, PipelineStage } from '../../domains/generationPipeline/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Button, Card, Chip, EmptyState, LinkButton, PageHeader, cn } from '../../shared/ui'
import { DrawioEmbed } from '../diagram/DrawioEmbed'

type SrsPanelProps = {
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  srsDocuments: SrsDocument[]
  activeSrsDocument: SrsDocument | null
  generatedDiagrams: DiagramDetail[]
  pipelineRuns: PipelineRun[]
  isLoadingSrsDocuments: boolean
  isGeneratingClassDiagram: boolean
  canGenerateAiDiagrams: boolean
  canExportSrs: boolean
  onReload: () => void
  onSelectSrsDocument: (documentId: string) => void
  onGenerateClassDiagram: (methods: ClassDiagramMethod[]) => void
  onExportSrs: () => void
  onOpenGeneratedDiagram: (diagram: DiagramDetail) => void
}

function readablePipelineMode(mode: PipelineRun['generation_mode']) {
  return mode === 'rule_based' ? 'Rule-Based Engine' : mode === 'ollama' ? 'Local AI (Ollama)' : mode === 'srsgen' ? 'SrsGen' : 'AI-Gen'
}

function stageRevision(run: PipelineRun, stage: PipelineStage) {
  return run.stages.find((item) => item.stage_name === stage)
}

function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null) : []
}

function pipelineRequirements(run: PipelineRun) {
  const list = stageRevision(run, 'requirements')?.payload.requirements
  return asRecords(list)
    .filter((item) => item.enabled !== false)
    .map((item, index) => ({
      id: String(item.requirementId ?? item.id ?? `#${index + 1}`),
      type: String(item.requirementType ?? 'functional').replaceAll('_', ' '),
      statement: String(item.statement ?? ''),
    }))
}

function pipelineStorySections(run: PipelineRun) {
  const list = stageRevision(run, 'final-story')?.payload.atomicStorySections
  return asRecords(list).map((section, index) => ({
    id: String(section.id ?? index),
    text: String(section.normalizedSentence ?? '').trim() || [section.actor, section.action, section.object].filter(Boolean).map(String).join(' · '),
  }))
}

type GeneratedItem =
  | { kind: 'legacy'; id: string; title: string; subtitle: string; createdAt: string }
  | { kind: 'pipeline'; id: string; title: string; subtitle: string; createdAt: string }

export function SrsPanel({
  activeWorkspace,
  activeProject,
  srsDocuments,
  activeSrsDocument,
  generatedDiagrams,
  pipelineRuns,
  isLoadingSrsDocuments,
  isGeneratingClassDiagram,
  canGenerateAiDiagrams,
  canExportSrs,
  onReload,
  onSelectSrsDocument,
  onGenerateClassDiagram,
  onExportSrs,
  onOpenGeneratedDiagram,
}: SrsPanelProps) {
  const [selectedPipelineRunId, setSelectedPipelineRunId] = useState<string | null>(null)

  const items: GeneratedItem[] = [
    ...srsDocuments.map((document): GeneratedItem => ({
      kind: 'legacy',
      id: document.id,
      title: document.title,
      subtitle: document.status.replaceAll('_', ' '),
      createdAt: document.created_at,
    })),
    ...pipelineRuns.map((run): GeneratedItem => ({
      kind: 'pipeline',
      id: run.id,
      title: run.title,
      subtitle: `${readablePipelineMode(run.generation_mode)} · ${run.status.replaceAll('_', ' ')}`,
      createdAt: run.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  function selectItem(item: GeneratedItem) {
    if (item.kind === 'legacy') {
      setSelectedPipelineRunId(null)
      onSelectSrsDocument(item.id)
    } else {
      setSelectedPipelineRunId(item.id)
    }
  }

  const selectedPipelineRun = pipelineRuns.find((run) => run.id === selectedPipelineRunId) ?? null
  const selectedId = selectedPipelineRun ? selectedPipelineRun.id : activeSrsDocument?.id

  return (
    <Card className="grid gap-5 p-5">
      <PageHeader
        size="section"
        eyebrow="SRS documents"
        title="Generated SRS documents"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onReload} disabled={!activeWorkspace || !activeProject || isLoadingSrsDocuments}>
              {isLoadingSrsDocuments ? 'Loading…' : 'Reload'}
            </Button>
            <LinkButton href="#generate-srs" size="sm">
              <FilePlus2 /> Generate new SRS
            </LinkButton>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FilePlus2}
          title="No SRS documents yet"
          description="Generate your first SRS on the Generate SRS pipeline tab."
          action={
            <LinkButton href="#generate-srs" size="sm">
              <FilePlus2 /> Generate new SRS
            </LinkButton>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2" aria-label="Generated SRS documents">
            {items.map((item) => (
              <button
                key={`${item.kind}-${item.id}`}
                type="button"
                onClick={() => selectItem(item)}
                className={cn(
                  'grid gap-0.5 rounded-md border px-3 py-2 text-left text-sm font-semibold transition',
                  item.id === selectedId ? 'border-accent bg-accent/10 text-accent' : 'border-border text-fg-2 hover:border-border-strong',
                )}
              >
                <span>{item.title}</span>
                <small className="text-xs font-medium capitalize opacity-75">{item.subtitle}</small>
              </button>
            ))}
          </div>

          {selectedPipelineRun ? (
            <PipelineRunDocument run={selectedPipelineRun} />
          ) : activeSrsDocument ? (
            <div className="grid gap-4 border-t border-border pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Generated SRS</span>
                <span className="text-[13px] text-fg-3">{new Date(activeSrsDocument.created_at).toLocaleString()}</span>
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
                    <div key={diagram.id} className="grid gap-3 rounded-lg border border-border bg-surface-2 p-4 sm:grid-cols-[1fr_auto]">
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
        </>
      )}
    </Card>
  )
}

function PipelineRunDocument({ run }: { run: PipelineRun }) {
  const storySections = pipelineStorySections(run)
  const requirements = pipelineRequirements(run)
  const xml = stageRevision(run, 'xml')?.payload.xml
  const xmlText = typeof xml === 'string' ? xml : ''

  return (
    <div className="grid gap-4 border-t border-border pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Generated via pipeline</span>
        <span className="text-[13px] text-fg-3">{new Date(run.created_at).toLocaleString()}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="ai">{readablePipelineMode(run.generation_mode)}</Chip>
        <Chip tone="muted" className="capitalize">
          {run.status.replaceAll('_', ' ')}
        </Chip>
        <LinkButton href="#generate-srs" variant="ghost" size="sm">
          Open in pipeline editor
        </LinkButton>
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
                <span className="text-[11px] font-bold uppercase tracking-wide text-fg-3">{requirement.type}</span>
                <p className="text-[13px] leading-6 text-fg-2">{requirement.statement}</p>
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
          This run hasn't generated any content yet. Open it in the pipeline editor to continue.
        </p>
      ) : null}
    </div>
  )
}

function UpgradeNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-[13px] text-warning">{children}</p>
  )
}
