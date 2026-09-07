import { FileText } from 'lucide-react'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { SrsDocument } from '../../domains/srs/types'
import type { AuthUser } from '../../domains/auth/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Card, CompactList, EmptyState, PageHeader, StatTile } from '../../shared/ui'

type OrganizationMemberProjectWorkspaceProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  projects: Project[]
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
}

export function OrganizationMemberProjectWorkspace({
  activeProject,
  projects,
  srsDocuments,
  diagrams,
}: OrganizationMemberProjectWorkspaceProps) {
  return (
    <section className="grid gap-6" id="projects">
      <PageHeader
        title={activeProject?.name ?? 'My Projects'}
        description={activeProject?.description ?? 'Projects assigned to you in this workspace.'}
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <StatTile label="Projects" value={projects.length} />
        <StatTile label="SRS Documents" value={srsDocuments.length} />
        <StatTile label="Diagrams" value={diagrams.length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20.5rem]">
        <Card className="grid gap-4 p-5">
          <PageHeader size="section" title="Requirements" />
          <EmptyState
            icon={FileText}
            title="No requirements captured yet"
            description="Requirements appear here once the SRS pipeline runs for a project."
          />
        </Card>
        <aside className="grid gap-4">
          <Card className="grid gap-4 p-5">
            <PageHeader size="section" title="SRS documents" />
            <CompactList
              items={srsDocuments.slice(0, 5).map((document) => ({
                id: document.id,
                title: document.title,
                meta: new Date(document.created_at).toLocaleDateString(),
                value: document.status,
                tone: 'sky' as const,
              }))}
              emptyText="No SRS documents yet."
            />
          </Card>
          <Card className="grid gap-4 p-5">
            <PageHeader size="section" title="Diagrams" />
            <CompactList
              items={diagrams.slice(0, 5).map((diagram) => ({
                id: diagram.id,
                title: diagram.title,
                meta: `${diagram.diagram_type} · v${diagram.current_version}`,
                value: diagram.status,
                tone: 'active' as const,
              }))}
              emptyText="No diagrams yet."
            />
          </Card>
        </aside>
      </div>
    </section>
  )
}
