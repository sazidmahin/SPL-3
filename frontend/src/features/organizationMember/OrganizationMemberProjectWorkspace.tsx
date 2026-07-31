import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  MessageSquare,
  Network,
  Plus,
  Search,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { mockRequirements } from '../../app/designMockData'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { SrsDocument } from '../../domains/srs/types'
import type { AuthUser } from '../../domains/auth/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import './OrganizationMemberProjectWorkspace.css'

type OrganizationMemberProjectWorkspaceProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  projects: Project[]
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
}

type Tone = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'slate'

const workspaceTasks = [
  { title: 'Review REQ-003: Product Search & Filter', due: 'Tomorrow', tone: 'orange' as const },
  { title: 'Review E-Commerce Platform - SRS v1.2', due: 'May 18', tone: 'blue' as const },
  { title: 'Validate Use Case Diagram', due: 'May 21', tone: 'green' as const },
]

const recentExports = [
  { title: 'E-Commerce Platform - SRS v1.2.pdf', meta: 'Yesterday', icon: FileText, tone: 'blue' as const },
  { title: 'Requirements Traceability Matrix.xlsx', meta: '2 days ago', icon: Download, tone: 'green' as const },
]

const comments = [
  {
    author: 'Sarah Johnson',
    title: 'Commented on REQ-003',
    body: 'Should we support fuzzy search and typo correction?',
    time: '12 min ago',
    tone: 'purple' as const,
  },
  {
    author: 'Sarah Johnson',
    title: 'Updated REQ-005',
    body: 'Added clarification for multi-step checkout process.',
    time: '2 hrs ago',
    tone: 'blue' as const,
  },
  {
    author: 'Ahmed Khan',
    title: 'Uploaded E-Commerce Platform SRS v1.2',
    body: 'Major updates in sections 4.2 and 6.',
    time: '4 hrs ago',
    tone: 'green' as const,
  },
  {
    author: 'Priya Patel',
    title: 'Shared sequence diagram notes',
    body: 'Sequence Diagram - Checkout flow.',
    time: 'Yesterday',
    tone: 'orange' as const,
  },
]

export function OrganizationMemberProjectWorkspace({
  user,
  activeWorkspace,
  activeProject,
  projects,
  srsDocuments,
  diagrams,
}: OrganizationMemberProjectWorkspaceProps) {
  const workspaceName = activeWorkspace?.workspace.name ?? 'E-Commerce Platform'
  const project = activeProject ?? projects[0]
  const projectName = project?.name ?? 'E-Commerce Platform'
  const projectDescription =
    project?.description ?? 'Online store with checkout, inventory, and customer management.'
  const srsRows = srsDocuments.length > 0 ? srsDocuments.slice(0, 3).map(documentToRow) : fallbackSrsRows
  const diagramRows = diagrams.length > 0 ? diagrams.slice(0, 3).map(diagramToRow) : fallbackDiagramRows

  return (
    <section className="org-member-workspace-page" id="projects">
      <WorkspaceTopbar workspaceName={workspaceName} user={user} />

      <section className="member-workspace-hero">
        <div>
          <span>Project Workspace</span>
          <h1>{projectName}</h1>
          <p>{projectDescription}</p>
        </div>
        <StatusPill tone="green">In Progress</StatusPill>
      </section>

      <nav className="workspace-tabs" aria-label="Project workspace tabs">
        <a className="active" href="#requirements">Requirements</a>
        <a href="#srs-documents">SRS Documents</a>
        <a href="#workspace-diagrams">Diagrams</a>
        <a href="#workspace-activity">Activity</a>
      </nav>

      <div className="workspace-stat-grid">
        <WorkspaceStat icon={FileText} label="Requirements" value={48} tone="purple" />
        <WorkspaceStat icon={FileText} label="SRS Documents" value={srsRows.length || 3} tone="blue" />
        <WorkspaceStat icon={Network} label="Diagrams" value={diagrams.length || 12} tone="green" />
        <WorkspaceStat icon={MessageSquare} label="Activity Comments" value={24} tone="orange" />
      </div>

      <div className="member-workspace-layout">
        <main className="member-workspace-main">
          <div className="workspace-columns">
            <WorkspacePanel title="Requirements" icon={FileText} action="New Requirement" id="requirements">
              <div className="workspace-requirement-list">
                {requirementRows.map((requirement) => (
                  <article className="workspace-requirement-row" key={requirement.code}>
                    <div>
                      <span>{requirement.code}</span>
                      <strong>{requirement.title}</strong>
                      <p>{requirement.summary}</p>
                    </div>
                    <StatusPill tone={requirement.tone}>{requirement.status}</StatusPill>
                  </article>
                ))}
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="SRS Documents" icon={FileText} action="New Document" id="srs-documents">
              <ArtifactList rows={srsRows} icon={FileText} />
              <a className="workspace-panel-link" href="#srs">View all documents</a>
            </WorkspacePanel>

            <WorkspacePanel title="Diagrams" icon={Network} action="New Diagram" id="workspace-diagrams">
              <ArtifactList rows={diagramRows} icon={Network} />
              <a className="workspace-panel-link" href="#diagram-editor">Open latest</a>
            </WorkspacePanel>
          </div>

          <section className="document-preview-card">
            <header>
              <div><FileText size={18} /><h2>{projectName} - SRS (v1.2)</h2></div>
              <button type="button">Open</button>
            </header>
            <article>
              <h3>1. Introduction</h3>
              <p>This SRS describes the functional and non-functional behavior for the e-commerce platform, including search, cart management, checkout, and payment processing.</p>
              <h3>2. Scope</h3>
              <p>The platform shall support product discovery, customer authentication, order placement, inventory visibility, and integration with payment gateways.</p>
            </article>
          </section>

          <div className="workspace-bottom-grid">
            <WorkspacePanel title="My Tasks" icon={CheckCircle2}>
              <div className="workspace-task-list">
                {workspaceTasks.map((task) => (
                  <article className="workspace-task-row" key={task.title}>
                    <span className={`task-dot tone-${task.tone}`} />
                    <div><strong>{task.title}</strong><small>{task.due}</small></div>
                  </article>
                ))}
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="Recent Exports" icon={Download}>
              <ArtifactList rows={recentExports} icon={Download} compact />
            </WorkspacePanel>

            <section className="project-progress-card">
              <header><div><Activity size={18} /><h2>Project Progress</h2></div></header>
              <div>
                <strong>72%</strong>
                <div className="project-progress"><span style={{ width: '72%' }} /></div>
                <p>Requirements reviewed and artifacts updated this sprint.</p>
              </div>
            </section>
          </div>
        </main>

        <aside className="workspace-activity-card" id="workspace-activity">
          <header>
            <div><MessageSquare size={18} /><h2>Activity Comments</h2></div>
            <button type="button">All Activity <ChevronDown size={14} /></button>
          </header>
          <div className="workspace-comment-list">
            {comments.map((comment) => (
              <article className="workspace-comment" key={`${comment.author}-${comment.title}`}>
                <span className={`comment-avatar tone-${comment.tone}`}>{initials(comment.author)}</span>
                <div>
                  <strong>{comment.author}</strong>
                  <small>{comment.title}</small>
                  <p>{comment.body}</p>
                  <button type="button">Reply</button>
                </div>
                <time>{comment.time}</time>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}

function WorkspaceTopbar({ workspaceName, user }: { workspaceName: string; user: AuthUser }) {
  return (
    <header className="member-workspace-topbar">
      <button className="member-workspace-select" type="button">
        {workspaceName}
        <ChevronDown size={16} />
      </button>
      <label className="member-workspace-search">
        <Search size={18} />
        <input placeholder="Search project artifacts..." />
        <kbd>Ctrl K</kbd>
      </label>
      <div className="member-workspace-toolbar">
        <button type="button" aria-label="Notifications"><Bell size={19} /><span>3</span></button>
        <button className="workspace-user-avatar" type="button" aria-label={user.full_name}>{initials(user.full_name)}</button>
      </div>
    </header>
  )
}

function WorkspaceStat({ icon: Icon, label, value, tone }: {
  icon: LucideIcon
  label: string
  value: number
  tone: Tone
}) {
  return (
    <article className="workspace-stat-card">
      <span className={`workspace-stat-icon tone-${tone}`}><Icon size={23} /></span>
      <div><strong>{value}</strong><small>{label}</small></div>
    </article>
  )
}

function WorkspacePanel({ title, icon: Icon, action, id, children }: {
  title: string
  icon: LucideIcon
  action?: string
  id?: string
  children: ReactNode
}) {
  return (
    <section className="member-workspace-panel" id={id}>
      <header>
        <div><Icon size={18} /><h2>{title}</h2></div>
        {action ? <button type="button"><Plus size={15} />{action}</button> : null}
      </header>
      {children}
    </section>
  )
}

function ArtifactList({ rows, icon: Icon, compact = false }: {
  rows: Array<{ title: string; meta: string; status?: string; tone: Tone; icon?: LucideIcon }>
  icon: LucideIcon
  compact?: boolean
}) {
  return (
    <div className={compact ? 'workspace-artifact-list compact' : 'workspace-artifact-list'}>
      {rows.map((row) => {
        const RowIcon = row.icon ?? Icon
        return (
          <article className="workspace-artifact-row" key={row.title}>
            <span className={`artifact-workspace-icon tone-${row.tone}`}><RowIcon size={17} /></span>
            <div><strong>{row.title}</strong><small>{row.meta}</small></div>
            {row.status ? <StatusPill tone={row.tone}>{row.status}</StatusPill> : null}
          </article>
        )
      })}
    </div>
  )
}

function StatusPill({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`workspace-status-pill tone-${tone}`}>{children}</span>
}

const requirementRows = mockRequirements.slice(0, 5).map((requirement, index) => ({
  code: requirement.code,
  title: ['User Login', 'Product Search & Filter', 'Shopping Cart Management', 'Checkout Process', 'Order Confirmation'][index] ?? requirement.text,
  summary: requirement.text,
  status: index === 1 ? 'In Review' : index === 3 ? 'In Progress' : 'Approved',
  tone: index === 1 ? 'orange' as const : index === 3 ? 'blue' as const : 'green' as const,
}))

const fallbackSrsRows = [
  { title: 'E-Commerce Platform - SRS', meta: 'v1.2 - Approved', status: 'Approved', tone: 'blue' as const },
  { title: 'E-Commerce Platform SRS Draft', meta: 'v1.1 - In Review', status: 'Review', tone: 'orange' as const },
  { title: 'Checkout Requirements Addendum', meta: 'Updated yesterday', status: 'Draft', tone: 'slate' as const },
]

const fallbackDiagramRows = [
  { title: 'Use Case Diagram', meta: 'Updated 2 hours ago', status: 'Current', tone: 'green' as const },
  { title: 'ER Diagram', meta: 'Updated yesterday', status: 'Current', tone: 'green' as const },
  { title: 'Sequence Diagram', meta: 'Checkout flow', status: 'Review', tone: 'orange' as const },
]

function documentToRow(document: SrsDocument) {
  return {
    title: document.title,
    meta: `${document.status} - Updated ${new Date(document.updated_at).toLocaleDateString()}`,
    status: document.status,
    tone: document.status === 'approved' ? 'blue' as const : 'orange' as const,
  }
}

function diagramToRow(diagram: Diagram) {
  return {
    title: diagram.title,
    meta: `${diagram.diagram_type} - v${diagram.current_version}`,
    status: diagram.status,
    tone: diagram.status === 'active' ? 'green' as const : 'orange' as const,
  }
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}
