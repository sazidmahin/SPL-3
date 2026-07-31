import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Folder,
  ListChecks,
  MessageSquare,
  Network,
  Search,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Usage } from '../../domains/billing/types'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { SrsDocument } from '../../domains/srs/types'
import type { AuthUser } from '../../domains/auth/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import './OrganizationMemberDashboard.css'

type OrganizationMemberDashboardProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  projects: Project[]
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
  usage: Usage | null
}

type Tone = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'slate'
type TaskPriority = 'High' | 'Medium' | 'Low'

const assignedTasks = [
  { title: 'Review user authentication requirement', project: 'E-Commerce Platform', priority: 'High' as const, due: 'May 16', status: 'Review' },
  { title: 'Validate appointment scheduling flow', project: 'Healthcare Appointment System', priority: 'Medium' as const, due: 'May 18', status: 'To Do' },
  { title: 'Update inventory import requirements', project: 'Inventory Management System', priority: 'High' as const, due: 'May 20', status: 'In Progress' },
  { title: 'Define notification preferences', project: 'Mobile Banking App', priority: 'Low' as const, due: 'May 25', status: 'To Do' },
  { title: 'Review data model diagram', project: 'LMS Enhancement', priority: 'Medium' as const, due: 'May 27', status: 'Review' },
]

const recentActivities = [
  { title: 'Updated SRS Document', meta: 'E-Commerce Platform - SRS', time: '10 min ago', icon: FileText, tone: 'blue' as const },
  { title: 'Commented on Requirement', meta: 'REQ-014 authentication flow', time: '42 min ago', icon: MessageSquare, tone: 'purple' as const },
  { title: 'Uploaded Diagram', meta: 'User Flow Diagram', time: '3 hrs ago', icon: Upload, tone: 'green' as const },
  { title: 'Completed Task', meta: 'Mobile Banking App review', time: 'Yesterday', icon: CheckCircle2, tone: 'orange' as const },
  { title: 'Exported Document', meta: 'Inventory Management SRS', time: '2 days ago', icon: FileText, tone: 'blue' as const },
]

const deadlines = [
  { title: 'Review user authentication requirements', project: 'E-Commerce Platform', due: 'May 16', tone: 'red' as const },
  { title: 'Validate appointment scheduling', project: 'Healthcare Appointment System', due: 'May 18', tone: 'orange' as const },
  { title: 'Update inventory import requirements', project: 'Inventory Management System', due: 'May 20', tone: 'blue' as const },
  { title: 'Define notification preferences', project: 'Mobile Banking App', due: 'May 25', tone: 'slate' as const },
]

export function OrganizationMemberDashboard({
  user,
  activeWorkspace,
  projects,
  srsDocuments,
  diagrams,
  usage,
}: OrganizationMemberDashboardProps) {
  const workspaceName = activeWorkspace?.workspace.name ?? 'Acme Healthcare'
  const assignedProjects = projects.length > 0 ? projects.slice(0, 5).map(projectToAssignedRow) : fallbackAssignedProjects
  const documentRows = srsDocuments.length > 0 ? srsDocuments.slice(0, 4).map(documentToRow) : fallbackDocuments
  const diagramRows = diagrams.length > 0 ? diagrams.slice(0, 4).map(diagramToRow) : fallbackDiagrams
  const creditsUsed = usage?.srs_generations ?? 6200
  const creditLimit = 10000
  const creditPercent = Math.min(100, Math.round((creditsUsed / creditLimit) * 100))

  return (
    <section className="org-member-dashboard" id="overview">
      <MemberTopbar workspaceName={workspaceName} user={user} />

      <header className="org-member-hero">
        <div>
          <h1>Welcome back, {firstName(user.full_name)}!</h1>
          <p>Here's an overview of your work and contributions.</p>
        </div>
      </header>

      <div className="org-member-metrics">
        <MemberMetric icon={Folder} label="Projects Assigned" value={projects.length || 5} detail="Active projects you're working on" tone="purple" />
        <MemberMetric icon={ListChecks} label="Tasks To Do" value={assignedTasks.length || 8} detail="Tasks assigned to you" tone="blue" />
        <MemberMetric icon={FileText} label="Documents Updated" value={srsDocuments.length || 12} detail="SRS documents updated by or to you" tone="green" />
        <ReadOnlyUsage value={creditPercent} used={creditsUsed} limit={creditLimit} />
      </div>

      <div className="org-member-grid">
        <MemberPanel title="My Assigned Projects" icon={Folder} action="View all projects" className="assigned-projects-panel">
          <div className="assigned-project-list">
            {assignedProjects.map((project) => (
              <article className="assigned-project-row" key={project.id}>
                <div>
                  <strong>{project.name}</strong>
                  <small>{project.meta}</small>
                </div>
                <StatusTag tone={project.tone}>{project.status}</StatusTag>
              </article>
            ))}
          </div>
        </MemberPanel>

        <MemberPanel title="My Tasks" icon={ListChecks} action="View all" className="tasks-panel">
          <div className="task-list">
            {assignedTasks.map((task) => (
              <article className="task-row" key={`${task.project}-${task.title}`}>
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.project}</small>
                </div>
                <PriorityTag priority={task.priority} />
                <time>{task.due}</time>
              </article>
            ))}
          </div>
        </MemberPanel>

        <MemberPanel title="My Recent Activity" icon={Clock3} action="View all" className="member-activity-panel">
          <div className="org-member-activity-list">
            {recentActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <article className="org-member-activity-row" key={`${activity.title}-${activity.meta}`}>
                  <span className={`activity-icon tone-${activity.tone}`}><Icon size={17} /></span>
                  <div>
                    <strong>{activity.title}</strong>
                    <small>{activity.meta}</small>
                  </div>
                  <time>{activity.time}</time>
                </article>
              )
            })}
          </div>
        </MemberPanel>

        <MemberPanel title="Recent SRS Documents" icon={FileText} action="View all" className="recent-documents-panel">
          <CompactList rows={documentRows} icon={FileText} />
        </MemberPanel>

        <MemberPanel title="Recent Diagrams" icon={Network} action="View all" className="recent-diagrams-panel">
          <CompactList rows={diagramRows} icon={Network} />
        </MemberPanel>

        <MemberPanel title="Upcoming Deadlines" icon={Bell} action="View all" className="deadlines-panel">
          <div className="deadline-list">
            {deadlines.map((deadline) => (
              <article className="deadline-row" key={deadline.title}>
                <span className={`deadline-dot tone-${deadline.tone}`} />
                <div>
                  <strong>{deadline.title}</strong>
                  <small>{deadline.project}</small>
                </div>
                <time>{deadline.due}</time>
              </article>
            ))}
          </div>
        </MemberPanel>

        <section className="contribution-card">
          <header>
            <div><BarChart3 size={18} /><h2>My Contributions This Month</h2></div>
          </header>
          <div className="contribution-body">
            <strong>Great work!</strong>
            <ContributionLine label="Documents updated" value={12} />
            <ContributionLine label="Requirements contributed" value={28} />
            <ContributionLine label="Tasks completed" value={9} />
            <a href="#profile">View detailed activity</a>
          </div>
        </section>
      </div>
    </section>
  )
}

function MemberTopbar({ workspaceName, user }: { workspaceName: string; user: AuthUser }) {
  return (
    <header className="org-member-topbar">
      <button className="org-member-workspace" type="button">
        {workspaceName}
        <ChevronDown size={16} />
      </button>
      <label className="org-member-search">
        <Search size={18} />
        <input placeholder="Search projects, documents, diagrams..." />
        <kbd>Ctrl K</kbd>
      </label>
      <div className="org-member-toolbar">
        <button type="button" aria-label="Notifications"><Bell size={19} /><span>3</span></button>
        <button type="button" aria-label="Help"><CircleHelp size={19} /></button>
        <button className="member-avatar-button" type="button" aria-label={user.full_name}>{initials(user.full_name)}</button>
      </div>
    </header>
  )
}

function MemberMetric({ icon: Icon, label, value, detail, tone }: {
  icon: LucideIcon
  label: string
  value: number | string
  detail: string
  tone: Tone
}) {
  return (
    <article className="org-member-metric-card">
      <span className={`member-metric-icon tone-${tone}`}><Icon size={24} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  )
}

function ReadOnlyUsage({ value, used, limit }: { value: number; used: number; limit: number }) {
  return (
    <article className="org-member-metric-card read-only-usage-card">
      <span className="member-metric-icon tone-blue"><BarChart3 size={24} /></span>
      <div>
        <small>Workspace Usage (Read-only)</small>
        <strong>{value}%</strong>
        <p>{formatNumber(used)} credits used</p>
      </div>
      <div className="member-usage-progress"><span style={{ width: `${value}%` }} /></div>
      <footer>
        <span>{formatNumber(Math.max(0, limit - used))} credits remaining</span>
        <small>Resets on Jun 1, 2025</small>
      </footer>
    </article>
  )
}

function MemberPanel({ title, icon: Icon, action, className, children }: {
  title: string
  icon: LucideIcon
  action?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`org-member-panel ${className ?? ''}`}>
      <header>
        <div><Icon size={18} /><h2>{title}</h2></div>
        {action ? <a href="#overview">{action}</a> : null}
      </header>
      {children}
    </section>
  )
}

function CompactList({ rows, icon: Icon }: { rows: Array<{ title: string; meta: string; tone: Tone }>; icon: LucideIcon }) {
  return (
    <div className="compact-member-list">
      {rows.map((row) => (
        <article className="compact-member-row" key={row.title}>
          <span className={`compact-icon tone-${row.tone}`}><Icon size={17} /></span>
          <div>
            <strong>{row.title}</strong>
            <small>{row.meta}</small>
          </div>
        </article>
      ))}
    </div>
  )
}

function ContributionLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="contribution-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatusTag({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`org-member-status tone-${tone}`}>{children}</span>
}

function PriorityTag({ priority }: { priority: TaskPriority }) {
  const tone = priority === 'High' ? 'red' : priority === 'Medium' ? 'orange' : 'blue'
  return <span className={`priority-tag tone-${tone}`}>{priority}</span>
}

const fallbackAssignedProjects = [
  { id: 'assigned-1', name: 'E-Commerce Platform', meta: 'In Progress - Updated 2 hours ago', status: 'In Progress', tone: 'green' as const },
  { id: 'assigned-2', name: 'Healthcare Appointment System', meta: 'Planning - Updated yesterday', status: 'Planning', tone: 'blue' as const },
  { id: 'assigned-3', name: 'Inventory Management System', meta: 'In Progress - Updated 1 day ago', status: 'In Progress', tone: 'green' as const },
  { id: 'assigned-4', name: 'Mobile Banking App', meta: 'Review - Updated 3 days ago', status: 'Review', tone: 'orange' as const },
  { id: 'assigned-5', name: 'LMS Enhancement', meta: 'On Hold - Updated 5 days ago', status: 'On Hold', tone: 'slate' as const },
]

const fallbackDocuments = [
  { title: 'E-Commerce Platform - SRS', meta: 'Updated 2 hours ago', tone: 'blue' as const },
  { title: 'Healthcare Appointment System - SRS', meta: 'Updated yesterday', tone: 'blue' as const },
  { title: 'Inventory Management System - SRS', meta: 'Updated 2 days ago', tone: 'blue' as const },
  { title: 'Mobile Banking App - SRS', meta: 'Updated 3 days ago', tone: 'blue' as const },
]

const fallbackDiagrams = [
  { title: 'User Flow Diagram', meta: 'E-Commerce Platform - Updated today', tone: 'green' as const },
  { title: 'System Context Diagram', meta: 'Healthcare Appointment - Updated yesterday', tone: 'green' as const },
  { title: 'Component Diagram', meta: 'Inventory Management - Updated 2 days ago', tone: 'green' as const },
  { title: 'Database ERD', meta: 'Mobile Banking App - Updated 3 days ago', tone: 'green' as const },
]

function projectToAssignedRow(project: Project) {
  const tone: Tone = project.status === 'planning' ? 'blue' : project.status === 'review' ? 'orange' : project.status === 'on_hold' ? 'slate' : 'green'
  return {
    id: project.id,
    name: project.name,
    meta: `${project.status || 'Active'} - Updated ${new Date(project.updated_at).toLocaleDateString()}`,
    status: project.status || 'Active',
    tone,
  }
}

function documentToRow(document: SrsDocument) {
  return {
    title: document.title,
    meta: `Updated ${new Date(document.updated_at).toLocaleDateString()}`,
    tone: 'blue' as const,
  }
}

function diagramToRow(diagram: Diagram) {
  return {
    title: diagram.title,
    meta: `Updated ${new Date(diagram.updated_at).toLocaleDateString()}`,
    tone: 'green' as const,
  }
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'there'
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M'
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
