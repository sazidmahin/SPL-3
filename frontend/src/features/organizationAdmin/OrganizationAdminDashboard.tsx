import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  CreditCard,
  FileText,
  Folder,
  Mail,
  Network,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Subscription, Usage } from '../../domains/billing/types'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { GenerationJob, SrsDocument } from '../../domains/srs/types'
import type { AuthUser } from '../../domains/auth/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import './OrganizationAdminDashboard.css'

type OrganizationAdminDashboardProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  projects: Project[]
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
  generationJobs: GenerationJob[]
  subscription: Subscription | null
  usage: Usage | null
}

type Tone = 'purple' | 'green' | 'blue' | 'orange' | 'red' | 'slate'

const memberActivities = [
  { name: 'Sarah Johnson', email: 'sarah.johnson@acme.com', action: 'Created new SRS document', time: '12 min ago', tone: 'green' as const },
  { name: 'Mike Chen', email: 'mike.chen@acme.com', action: 'Updated class diagram', time: '34 min ago', tone: 'blue' as const },
  { name: 'John Doe', email: 'john.doe@acme.com', action: 'Joined project workspace', time: '1 hr ago', tone: 'purple' as const },
  { name: 'Priya Rahman', email: 'priya.rahman@acme.com', action: 'Reviewed billing usage', time: '2 hrs ago', tone: 'orange' as const },
]

const pendingInvitations = [
  { email: 'jessica.lee@acme.com', role: 'Project Manager', invited: '2 days ago' },
  { email: 'noman.ahmed@acme.com', role: 'Analyst', invited: '3 days ago' },
  { email: 'fatima.khan@acme.com', role: 'Reviewer', invited: '5 days ago' },
]

const quickActions = [
  { label: 'Invite Member', icon: UserPlus, tone: 'purple' as const },
  { label: 'Create Project', icon: Plus, tone: 'green' as const },
  { label: 'AI Generate', icon: Sparkles, tone: 'blue' as const },
  { label: 'Manage Roles', icon: ShieldCheck, tone: 'orange' as const },
  { label: 'View Analytics', icon: BarChart3, tone: 'red' as const },
  { label: 'Billing', icon: CreditCard, tone: 'slate' as const },
]

const fallbackArtifacts = [
  { title: 'E-Commerce Platform - SRS v1.2', type: 'SRS Document', owner: 'Sarah Johnson', tone: 'blue' as const },
  { title: 'Architecture Diagram v2', type: 'Diagram', owner: 'Mike Chen', tone: 'green' as const },
  { title: 'Inventory Management Plan', type: 'SRS Document', owner: 'Priya Rahman', tone: 'blue' as const },
]

export function OrganizationAdminDashboard({
  user,
  activeWorkspace,
  projects,
  srsDocuments,
  diagrams,
  generationJobs,
  subscription,
  usage,
}: OrganizationAdminDashboardProps) {
  const workspaceName = activeWorkspace?.workspace.name ?? 'Acme Corporation'
  const seatsUsed = Math.max(18, activeWorkspace ? 18 : 0)
  const seatLimit = Math.max(subscription?.plan.max_members ?? 25, 25)
  const creditsUsed = usage ? usage.srs_generations : 6200
  const creditLimit = Math.max(subscription?.plan.monthly_srs_generations ?? 10000, 10000)
  const creditPercent = Math.min(100, Math.round((creditsUsed / creditLimit) * 100))
  const projectRows = projects.length > 0 ? projects.slice(0, 4).map(projectToRow) : fallbackProjects
  const artifactRows = buildArtifactRows(srsDocuments, diagrams)

  return (
    <section className="org-admin-dashboard" id="overview">
      <AdminTopbar workspaceName={workspaceName} user={user} />

      <div className="org-admin-title-row">
        <div>
          <span>Organization Admin Dashboard</span>
          <h1>Dashboard</h1>
        </div>
        <button type="button">
          <UserPlus size={18} />
          Invite Member
        </button>
      </div>

      <div className="org-admin-metrics">
        <AdminMetric icon={Users} label="Total Members" value={seatsUsed} delta="8 from last month" tone="purple" />
        <AdminMetric icon={Folder} label="Active Projects" value={projects.length || 12} delta="4 from last month" tone="green" />
        <AdminMetric icon={FileText} label="SRS Documents" value={srsDocuments.length || 28} delta="16 from last month" tone="blue" />
        <AdminMetric icon={Network} label="Diagrams" value={diagrams.length || 17} delta="9 from last month" tone="orange" />
        <AdminMetric icon={Bot} label="AI Jobs This Month" value={generationJobs.length || 46} delta="18% from last month" tone="purple" />
        <UsageMetric icon={Users} label="Seat Usage" value={`${seatsUsed}/${seatLimit}`} percent={Math.round((seatsUsed / seatLimit) * 100)} tone="green" />
        <UsageMetric icon={BarChart3} label="Credit Usage" value={`${creditPercent}%`} percent={creditPercent} tone="blue" />
      </div>

      <div className="org-admin-grid">
        <AdminPanel title="Recent Member Activity" icon={Activity} action="View all" className="member-activity-card">
          <div className="member-activity-list">
            {memberActivities.map((item) => (
              <article className="member-activity-row" key={item.email}>
                <span className={`avatar-dot tone-${item.tone}`}>{initials(item.name)}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.email}</small>
                  <p>{item.action}</p>
                </div>
                <time>{item.time}</time>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Pending Invitations" icon={Mail} action="View all" className="pending-invites-card">
          <div className="pending-invite-list">
            {pendingInvitations.map((invite) => (
              <article className="pending-invite-row" key={invite.email}>
                <span><Mail size={17} /></span>
                <div>
                  <strong>{invite.email}</strong>
                  <small>{invite.role} / Invited {invite.invited}</small>
                </div>
                <button type="button">Resend</button>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Recent Projects" icon={Folder} action="View all" className="org-projects-card">
          <div className="org-project-list">
            {projectRows.map((project) => (
              <article className="org-project-row" key={project.id}>
                <span className={`project-icon tone-${project.tone}`}><project.icon size={19} /></span>
                <div>
                  <strong>{project.name}</strong>
                  <small>{project.meta}</small>
                </div>
                <StatusTag tone={project.tone}>{project.status}</StatusTag>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Recent Artifacts" icon={FileText} action="View all" className="recent-artifacts-card">
          <div className="artifact-list">
            {artifactRows.map((artifact) => (
              <article className="artifact-row" key={artifact.title}>
                <span className={`artifact-icon tone-${artifact.tone}`}>{artifact.type === 'Diagram' ? <Network size={18} /> : <FileText size={18} />}</span>
                <div>
                  <strong>{artifact.title}</strong>
                  <small>{artifact.type} / {artifact.owner}</small>
                </div>
                <button type="button">Open</button>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Quick Actions" icon={Sparkles} className="quick-actions-card">
          <div className="quick-action-grid">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button type="button" className={`quick-action tone-${action.tone}`} key={action.label}>
                  <Icon size={20} />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </AdminPanel>

        <AdminPanel title="Subscription Overview" icon={CreditCard} className="subscription-overview-card">
          <div className="subscription-summary">
            <div className="subscription-plan-row">
              <div>
                <span>Subscription</span>
                <strong>{subscription?.plan.name ?? 'Pro Plan'}</strong>
              </div>
              <StatusTag tone="green">Active</StatusTag>
            </div>
            <UsageLine label="Seats" value={`${seatsUsed} / ${seatLimit}`} percent={Math.round((seatsUsed / seatLimit) * 100)} />
            <UsageLine label="Credits" value={`${formatNumber(creditsUsed)} / ${formatNumber(creditLimit)} credits`} percent={creditPercent} />
            <div className="billing-row">
              <span>Billing Cycle</span>
              <strong>Monthly</strong>
            </div>
            <div className="billing-row">
              <span>Next Billing Date</span>
              <strong>Jun 18, 2025</strong>
            </div>
            <button type="button">Manage Subscription</button>
          </div>
        </AdminPanel>
      </div>
    </section>
  )
}

function AdminTopbar({ workspaceName, user }: { workspaceName: string; user: AuthUser }) {
  return (
    <header className="org-admin-topbar">
      <button className="org-workspace-button" type="button">
        {workspaceName}
        <ChevronDown size={16} />
      </button>
      <label className="org-admin-search">
        <span>Search members, projects, documents...</span>
      </label>
      <div className="org-admin-toolbar">
        <button type="button" aria-label="Notifications"><Bell size={19} /><span>3</span></button>
        <button type="button" aria-label="Settings"><Settings size={19} /></button>
        <div className="org-admin-user">
          <span>{initials(user.full_name)}</span>
          <div><strong>{user.full_name}</strong><small>Organization Admin</small></div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  )
}

function AdminMetric({ icon: Icon, label, value, delta, tone }: {
  icon: LucideIcon
  label: string
  value: number | string
  delta: string
  tone: Tone
}) {
  return (
    <article className="org-admin-metric-card">
      <span className={`metric-badge tone-${tone}`}><Icon size={23} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{delta}</p>
      </div>
    </article>
  )
}

function UsageMetric({ icon: Icon, label, value, percent, tone }: {
  icon: LucideIcon
  label: string
  value: string
  percent: number
  tone: Tone
}) {
  return (
    <article className="org-admin-metric-card usage-admin-card">
      <span className={`metric-badge tone-${tone}`}><Icon size={23} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <div className="admin-progress"><span style={{ width: `${percent}%` }} /></div>
      </div>
    </article>
  )
}

function AdminPanel({ title, icon: Icon, action, className, children }: {
  title: string
  icon: LucideIcon
  action?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`org-admin-panel ${className ?? ''}`}>
      <header>
        <div><Icon size={18} /><h2>{title}</h2></div>
        {action ? <button type="button">{action}</button> : null}
      </header>
      {children}
    </section>
  )
}

function UsageLine({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="usage-line">
      <div><span>{label}</span><strong>{value}</strong></div>
      <div className="admin-progress"><span style={{ width: `${percent}%` }} /></div>
    </div>
  )
}

function StatusTag({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`org-status-tag tone-${tone}`}>{children}</span>
}

const fallbackProjects = [
  { id: 'org-project-1', name: 'E-Commerce Platform', meta: '6 members / 12 artifacts', status: 'Active', tone: 'green' as const, icon: Folder },
  { id: 'org-project-2', name: 'Inventory Management System', meta: '4 members / 8 artifacts', status: 'Active', tone: 'green' as const, icon: Folder },
  { id: 'org-project-3', name: 'Learning Management System', meta: '3 members / 6 artifacts', status: 'Review', tone: 'orange' as const, icon: Folder },
  { id: 'org-project-4', name: 'Mobile Banking App', meta: '5 members / 9 artifacts', status: 'Planning', tone: 'blue' as const, icon: Folder },
]

function projectToRow(project: Project) {
  const tone: Tone = project.status === 'review' ? 'orange' : project.status === 'planning' ? 'blue' : 'green'
  return {
    id: project.id,
    name: project.name,
    meta: `Updated ${new Date(project.updated_at).toLocaleDateString()}`,
    status: project.status || 'Active',
    tone,
    icon: Folder,
  }
}

function buildArtifactRows(srsDocuments: SrsDocument[], diagrams: Diagram[]) {
  const rows = [
    ...srsDocuments.slice(0, 2).map((document) => ({
      title: document.title,
      type: 'SRS Document',
      owner: 'Sarah Johnson',
      tone: 'blue' as const,
    })),
    ...diagrams.slice(0, 2).map((diagram) => ({
      title: diagram.title,
      type: 'Diagram',
      owner: 'Mike Chen',
      tone: 'green' as const,
    })),
  ]

  return rows.length > 0 ? rows.slice(0, 4) : fallbackArtifacts
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A'
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
