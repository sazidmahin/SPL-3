import type { ReactNode } from 'react'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { GenerationJob, SrsDocument } from '../../domains/srs/types'
import { CompactList, SectionHeader, StatusChip } from '../../shared/ui/primitives'
import { mockActivities, mockRequirements } from '../../app/designMockData'
import './ProjectWorkspaceView.css'

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
  const projectDescription = activeProject?.description ?? 'Requirements, SRS documents, diagrams, and activity appear here.'

  return (
    <section className="project-workspace" id="project-workspace">
      <div className="workspace-hero dashboard-band">
        <SectionHeader label="Project workspace" title={projectTitle} description={projectDescription} />
        <div className="workspace-hero-stats" aria-label="Project summary">
          <SummaryPill label="Requirements" value={mockRequirements.length} />
          <SummaryPill label="SRS docs" value={srsDocuments.length} />
          <SummaryPill label="Diagrams" value={diagrams.length} />
          <SummaryPill label="AI jobs" value={generationJobs.length} />
        </div>
      </div>

      <div className="project-workspace-grid">
        <section className="dashboard-band requirements-panel">
          <SectionHeader label="Requirements" title="Traceable requirements" />
          <div className="requirement-table" role="table" aria-label="Requirements">
            <div className="requirement-table-head" role="row">
              <span>Code</span>
              <span>Requirement</span>
              <span>Priority</span>
              <span>Status</span>
            </div>
            {mockRequirements.map((requirement) => (
              <article className="requirement-table-row" role="row" key={requirement.id}>
                <strong>{requirement.code}</strong>
                <span>{requirement.text}</span>
                <StatusChip tone={requirement.priority === 'high' ? 'danger' : requirement.priority === 'medium' ? 'warning' : 'neutral'}>
                  {requirement.priority}
                </StatusChip>
                <StatusChip tone={requirement.status === 'approved' ? 'success' : 'warning'}>
                  {requirement.status}
                </StatusChip>
              </article>
            ))}
          </div>
        </section>

        <aside className="project-side-stack">
          <section className="dashboard-band">
            <SectionHeader label="SRS documents" title="Recent docs" />
            <CompactList
              items={srsDocuments.slice(0, 4).map((document) => ({
                id: document.id,
                title: document.title,
                meta: new Date(document.created_at).toLocaleDateString(),
                value: document.status,
                tone: 'info' as const,
              }))}
              emptyText="No SRS documents yet."
            />
          </section>

          <section className="dashboard-band">
            <SectionHeader label="Diagrams" title="Diagram library" />
            <CompactList
              items={diagrams.slice(0, 4).map((diagram) => ({
                id: diagram.id,
                title: diagram.title,
                meta: `${diagram.diagram_type} / v${diagram.current_version}`,
                value: diagram.status,
                tone: 'success' as const,
              }))}
              emptyText="No diagrams yet."
            />
          </section>

          <section className="dashboard-band">
            <SectionHeader label="Activity" title="Project feed" />
            <CompactList
              items={mockActivities.slice(0, 3).map((activity) => ({
                id: activity.id,
                title: activity.title,
                meta: activity.meta,
                value: activity.kind,
                tone: activity.kind === 'diagram' ? 'info' : 'neutral',
              }))}
              emptyText="No project activity yet."
            />
          </section>
        </aside>
      </div>

      <div className="project-tools-grid">
        {srsTools}
        {diagramTools}
      </div>
    </section>
  )
}

type SummaryPillProps = {
  label: string
  value: number
}

function SummaryPill({ label, value }: SummaryPillProps) {
  return (
    <div className="summary-pill">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
