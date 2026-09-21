import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { GenerationJob, SrsDocument } from '../../domains/srs/types'
import { Card, CompactList, EmptyState, PageHeader } from '../../shared/ui'
import type { Tone } from '../../shared/ui'

type ProjectWorkspaceViewProps = {
  activeProject: Project | undefined
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
  generationJobs: GenerationJob[]
  srsTools: ReactNode
  diagramTools: ReactNode
}

export function ProjectWorkspaceView({
  activeProject,
  srsDocuments,
  diagrams,
  generationJobs,
  srsTools,
  diagramTools,
}: ProjectWorkspaceViewProps) {
  const projectTitle = activeProject?.name ?? 'Select a project'
  const projectDescription =
    activeProject?.description ?? 'Requirements, SRS documents, diagrams, and activity appear here.'

  return (
    <section className="grid gap-4" id="project-workspace">
      <Card className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <PageHeader eyebrow="Project workspace" title={projectTitle} description={projectDescription} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Project summary">
          <SummaryPill label="SRS docs" value={srsDocuments.length} />
          <SummaryPill label="Diagrams" value={diagrams.length} />
          <SummaryPill label="AI jobs" value={generationJobs.length} />
        </div>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20.5rem]">
        <Card className="grid gap-4 p-5">
          <PageHeader size="section" eyebrow="Requirements" title="Traceable requirements" />
          <EmptyState
            icon={FileText}
            title="No requirements captured yet"
            description="Run the SRS generation pipeline to extract and review requirements for this project."
          />
        </Card>
        <aside className="grid gap-4">
          <RecentCard
            label="SRS documents"
            title="Recent docs"
            items={srsDocuments.slice(0, 4).map((document) => ({
              id: document.id,
              title: document.title,
              meta: new Date(document.created_at).toLocaleDateString(),
              value: document.status,
              tone: 'sky' as const,
            }))}
            emptyText="No SRS documents yet."
          />
          <RecentCard
            label="Diagrams"
            title="Diagram library"
            items={diagrams.slice(0, 4).map((diagram) => ({
              id: diagram.id,
              title: diagram.title,
              meta: `${diagram.diagram_type} / v${diagram.current_version}`,
              value: diagram.status,
              tone: 'active' as const,
            }))}
            emptyText="No diagrams yet."
          />
        </aside>
      </div>

      <div className="grid gap-4">
        {srsTools}
        {diagramTools}
      </div>
    </section>
  )
}

function RecentCard({
  label,
  title,
  items,
  emptyText,
}: {
  label: string
  title: string
  items: Array<{ id: string; title: string; meta: string; value: string; tone: Tone }>
  emptyText: string
}) {
  return (
    <Card className="grid gap-4 p-5">
      <PageHeader size="section" eyebrow={label} title={title} />
      <CompactList items={items} emptyText={emptyText} />
    </Card>
  )
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid min-w-20 justify-items-center gap-1 rounded-md border border-border bg-surface-2 px-3 py-2.5">
      <strong className="font-display text-xl font-extrabold leading-none text-fg">{value}</strong>
      <span className="text-center text-xs font-semibold text-fg-3">{label}</span>
    </div>
  )
}
