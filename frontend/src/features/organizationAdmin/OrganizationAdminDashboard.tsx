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
    <section className="mx-auto grid max-w-400 gap-5 p-4 sm:p-6" id="overview">
      <AdminTopbar workspaceName={workspaceName} user={user} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">Organization Admin Dashboard</span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700" type="button">
          <UserPlus size={18} />
          Invite Member
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <AdminMetric icon={Users} label="Total Members" value={seatsUsed} delta="8 from last month" tone="purple" />
        <AdminMetric icon={Folder} label="Active Projects" value={projects.length || 12} delta="4 from last month" tone="green" />
        <AdminMetric icon={FileText} label="SRS Documents" value={srsDocuments.length || 28} delta="16 from last month" tone="blue" />
        <AdminMetric icon={Network} label="Diagrams" value={diagrams.length || 17} delta="9 from last month" tone="orange" />
        <AdminMetric icon={Bot} label="AI Jobs This Month" value={generationJobs.length || 46} delta="18% from last month" tone="purple" />
        <UsageMetric icon={Users} label="Seat Usage" value={`${seatsUsed}/${seatLimit}`} percent={Math.round((seatsUsed / seatLimit) * 100)} tone="green" />
        <UsageMetric icon={BarChart3} label="Credit Usage" value={`${creditPercent}%`} percent={creditPercent} tone="blue" />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <AdminPanel title="Recent Member Activity" icon={Activity} action="View all" className="member-activity-card">
          <div className="grid px-4 pb-4">
            {memberActivities.map((item) => (
              <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={item.email}>
                <span className={avatarClass(item.tone)}>{initials(item.name)}</span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-900">{item.name}</strong>
                  <small className="mt-0.5 block text-xs text-slate-500">{item.email}</small>
                  <p className="mt-1 text-xs font-medium text-slate-700">{item.action}</p>
                </div>
                <time className="whitespace-nowrap text-xs text-slate-500">{item.time}</time>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Pending Invitations" icon={Mail} action="View all" className="pending-invites-card">
          <div className="grid px-4 pb-4">
            {pendingInvitations.map((invite) => (
              <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={invite.email}>
                <span className="grid size-9 place-items-center rounded-lg bg-brand-100 text-brand-700"><Mail size={17} /></span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-900">{invite.email}</strong>
                  <small className="mt-0.5 block text-xs text-slate-500">{invite.role} / Invited {invite.invited}</small>
                </div>
                <button className="rounded-md px-2 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50" type="button">Resend</button>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Recent Projects" icon={Folder} action="View all" className="org-projects-card">
          <div className="grid px-4 pb-4">
            {projectRows.map((project) => (
              <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={project.id}>
                <span className={iconClass(project.tone)}><project.icon size={19} /></span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-900">{project.name}</strong>
                  <small className="mt-0.5 block text-xs text-slate-500">{project.meta}</small>
                </div>
                <StatusTag tone={project.tone}>{project.status}</StatusTag>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Recent Artifacts" icon={FileText} action="View all" className="recent-artifacts-card">
          <div className="grid px-4 pb-4">
            {artifactRows.map((artifact) => (
              <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={artifact.title}>
                <span className={iconClass(artifact.tone)}>{artifact.type === 'Diagram' ? <Network size={18} /> : <FileText size={18} />}</span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-900">{artifact.title}</strong>
                  <small className="mt-0.5 block text-xs text-slate-500">{artifact.type} / {artifact.owner}</small>
                </div>
                <button className="rounded-md px-2 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50" type="button">Open</button>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Quick Actions" icon={Sparkles} className="quick-actions-card">
          <div className="grid grid-cols-2 gap-3 p-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button type="button" className={`${quickActionClass(action.tone)}`} key={action.label}>
                  <Icon size={20} />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </AdminPanel>

        <AdminPanel title="Subscription Overview" icon={CreditCard} className="subscription-overview-card">
          <div className="grid gap-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-500">Subscription</span>
                <strong className="mt-1 block text-xl text-slate-950">{subscription?.plan.name ?? 'Pro Plan'}</strong>
              </div>
              <StatusTag tone="green">Active</StatusTag>
            </div>
            <UsageLine label="Seats" value={`${seatsUsed} / ${seatLimit}`} percent={Math.round((seatsUsed / seatLimit) * 100)} />
            <UsageLine label="Credits" value={`${formatNumber(creditsUsed)} / ${formatNumber(creditLimit)} credits`} percent={creditPercent} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500">Billing Cycle</span>
              <strong className="text-sm text-slate-900">Monthly</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500">Next Billing Date</span>
              <strong className="text-sm text-slate-900">Jun 18, 2025</strong>
            </div>
            <button className="rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-bold text-white" type="button">Manage Subscription</button>
          </div>
        </AdminPanel>
      </div>
    </section>
  )
}

function AdminTopbar({ workspaceName, user }: { workspaceName: string; user: AuthUser }) {
  return (
    <header className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[16rem_minmax(0,1fr)_auto] lg:items-center">
      <button className="flex min-h-10 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700" type="button">
        {workspaceName}
        <ChevronDown size={16} />
      </button>
      <label className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">
        <span>Search members, projects, documents...</span>
      </label>
      <div className="flex items-center gap-2 lg:justify-end">
        <button className="relative grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100" type="button" aria-label="Notifications"><Bell size={19} /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border-2 border-white bg-brand-600 text-[10px] font-bold text-white">3</span></button>
        <button className="grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100" type="button" aria-label="Settings"><Settings size={19} /></button>
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-sky-400 text-xs font-bold text-white">{initials(user.full_name)}</span>
          <div className="grid"><strong className="text-sm text-slate-900">{user.full_name}</strong><small className="text-xs font-semibold text-slate-500">Organization Admin</small></div>
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
    <article className="grid min-h-26 grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={iconClass(tone)}><Icon size={21} /></span>
      <div>
        <small className="text-xs font-semibold text-slate-500">{label}</small>
        <strong className="mt-1 block text-2xl font-bold leading-none text-slate-950">{value}</strong>
        <p className="mt-2 text-xs font-semibold text-emerald-600">{delta}</p>
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
    <article className="grid min-h-26 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={iconClass(tone)}><Icon size={21} /></span>
      <div>
        <small className="text-xs font-semibold text-slate-500">{label}</small>
        <strong className="mt-1 block text-2xl font-bold leading-none text-slate-950">{value}</strong>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} /></div>
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
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className ?? ''}`}>
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-4">
        <div className="flex items-center gap-2 text-brand-600"><Icon size={18} /><h2 className="text-base font-bold text-slate-950">{title}</h2></div>
        {action ? <button className="rounded-md px-2 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50" type="button">{action}</button> : null}
      </header>
      {children}
    </section>
  )
}

function UsageLine({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-500">{label}</span><strong className="text-sm text-slate-900">{value}</strong></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} /></div>
    </div>
  )
}

function StatusTag({ tone, children }: { tone: Tone; children: string }) {
  return <span className={statusClass(tone)}>{children}</span>
}

function toneClass(tone: Tone) {
  return tone === 'purple' ? 'bg-brand-100 text-brand-700' : tone === 'green' ? 'bg-emerald-100 text-emerald-700' : tone === 'blue' ? 'bg-sky-100 text-sky-700' : tone === 'orange' ? 'bg-orange-100 text-orange-700' : tone === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
}

function iconClass(tone: Tone) { return `grid size-10 shrink-0 place-items-center rounded-lg ${toneClass(tone)}` }
function avatarClass(tone: Tone) { return `grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${toneClass(tone)}` }
function statusClass(tone: Tone) { return `inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-bold ${toneClass(tone)}` }
function quickActionClass(tone: Tone) { return `grid min-h-22 place-items-center gap-2 rounded-lg border p-3 text-sm font-bold transition hover:brightness-95 ${toneClass(tone)}` }

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
