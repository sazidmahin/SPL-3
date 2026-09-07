import { FileText, Folder, Network } from 'lucide-react'
import type { Usage } from '../../domains/billing/types'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { SrsDocument } from '../../domains/srs/types'
import type { AuthUser } from '../../domains/auth/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Card, CompactList, EmptyState, PageHeader, StatTile } from '../../shared/ui'

type OrganizationMemberDashboardProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  projects: Project[]
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
  usage: Usage | null
}

export function OrganizationMemberDashboard({
  user,
  activeWorkspace,
  projects,
  srsDocuments,
  diagrams,
  usage,
}: OrganizationMemberDashboardProps) {
  const firstName = user.full_name.trim().split(/\s+/)[0] || 'there'

  return (
    <section className="grid gap-6" id="overview">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName} — your view of ${activeWorkspace?.workspace.name ?? 'this workspace'}.`}
      />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Projects" value={projects.length} icon={Folder} />
        <StatTile label="SRS Documents" value={srsDocuments.length} icon={FileText} />
        <StatTile label="Diagrams" value={diagrams.length} icon={Network} />
        <StatTile label="SRS this period" value={usage?.srs_generations ?? 0} icon={FileText} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="grid gap-4 p-5">
          <PageHeader size="section" title="Assigned Projects" />
          {projects.length === 0 ? (
            <EmptyState icon={Folder} title="No projects assigned" />
          ) : (
            <CompactList
              items={projects.slice(0, 5).map((project) => ({
                id: project.id,
                title: project.name,
                meta: project.description || 'No description',
                value: project.status,
                tone: 'muted' as const,
              }))}
              emptyText="No projects assigned."
            />
          )}
        </Card>
        <Card className="grid gap-4 p-5">
          <PageHeader size="section" title="Recent SRS Documents" />
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
          <PageHeader size="section" title="Recent Diagrams" />
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
      </div>
    </section>
  )
}
