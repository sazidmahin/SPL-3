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
    <section className="mx-auto grid max-w-400 gap-5 p-4 sm:p-6" id="overview">
      <MemberTopbar workspaceName={workspaceName} user={user} />

      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome back, {firstName(user.full_name)}!</h1>
          <p className="mt-1 text-sm text-slate-500">Here's an overview of your work and contributions.</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MemberMetric icon={Folder} label="Projects Assigned" value={projects.length || 5} detail="Active projects you're working on" tone="purple" />
        <MemberMetric icon={ListChecks} label="Tasks To Do" value={assignedTasks.length || 8} detail="Tasks assigned to you" tone="blue" />
        <MemberMetric icon={FileText} label="Documents Updated" value={srsDocuments.length || 12} detail="SRS documents updated by or to you" tone="green" />
        <ReadOnlyUsage value={creditPercent} used={creditsUsed} limit={creditLimit} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <MemberPanel title="My Assigned Projects" icon={Folder} action="View all projects" className="assigned-projects-panel">
          <div className="grid px-4 pb-4">
            {assignedProjects.map((project) => (
              <article className="flex items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0" key={project.id}>
                <div className="min-w-0"><strong className="block truncate text-sm text-slate-900">{project.name}</strong><small className="mt-1 block text-xs text-slate-500">{project.meta}</small></div>
                <StatusTag tone={project.tone}>{project.status}</StatusTag>
              </article>
            ))}
          </div>
        </MemberPanel>

        <MemberPanel title="My Tasks" icon={ListChecks} action="View all" className="tasks-panel">
          <div className="grid px-4 pb-4">
            {assignedTasks.map((task) => (
              <article className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={`${task.project}-${task.title}`}>
                <div className="min-w-0"><strong className="block truncate text-sm text-slate-900">{task.title}</strong><small className="mt-1 block text-xs text-slate-500">{task.project}</small></div>
                <PriorityTag priority={task.priority} />
                <time className="text-xs text-slate-500">{task.due}</time>
              </article>
            ))}
          </div>
        </MemberPanel>

        <MemberPanel title="My Recent Activity" icon={Clock3} action="View all" className="member-activity-panel">
          <div className="grid px-4 pb-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={`${activity.title}-${activity.meta}`}>
                  <span className={iconClass(activity.tone)}><Icon size={17} /></span>
                  <div className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{activity.title}</strong><small className="mt-1 block text-xs text-slate-500">{activity.meta}</small></div>
                  <time className="whitespace-nowrap text-xs text-slate-500">{activity.time}</time>
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
          <div className="grid px-4 pb-4">
            {deadlines.map((deadline) => (
              <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={deadline.title}>
                <span className={dotClass(deadline.tone)} />
                <div className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{deadline.title}</strong><small className="mt-1 block text-xs text-slate-500">{deadline.project}</small></div>
                <time className="text-xs text-slate-500">{deadline.due}</time>
              </article>
            ))}
          </div>
        </MemberPanel>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-4 text-brand-600"><BarChart3 size={18} /><h2 className="text-base font-bold text-slate-950">My Contributions This Month</h2></header>
          <div className="grid gap-3 p-4">
            <strong className="text-slate-950">Great work!</strong>
            <ContributionLine label="Documents updated" value={12} />
            <ContributionLine label="Requirements contributed" value={28} />
            <ContributionLine label="Tasks completed" value={9} />
            <a className="text-sm font-bold text-brand-600" href="#profile">View detailed activity</a>
          </div>
        </section>
      </div>
    </section>
  )
}

function MemberTopbar({ workspaceName, user }: { workspaceName: string; user: AuthUser }) {
  return (
    <header className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[16rem_minmax(0,1fr)_auto] lg:items-center">
      <button className="flex min-h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700" type="button">
        {workspaceName}
        <ChevronDown size={16} />
      </button>
      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400">
        <Search size={18} />
        <input className="min-w-0 flex-1 text-sm text-slate-800 outline-none" placeholder="Search projects, documents, diagrams..." />
        <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">Ctrl K</kbd>
      </label>
      <div className="flex items-center gap-2 lg:justify-end">
        <button className="relative grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100" type="button" aria-label="Notifications"><Bell size={19} /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border-2 border-white bg-brand-600 text-[10px] font-bold text-white">3</span></button>
        <button className="grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100" type="button" aria-label="Help"><CircleHelp size={19} /></button>
        <button className="grid size-9 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white" type="button" aria-label={user.full_name}>{initials(user.full_name)}</button>
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
    <article className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={iconClass(tone)}><Icon size={22} /></span>
      <div>
        <small className="text-xs font-semibold text-slate-500">{label}</small><strong className="mt-1 block text-2xl font-bold text-slate-950">{value}</strong><p className="mt-1 text-xs text-slate-500">{detail}</p>
      </div>
    </article>
  )
}

function ReadOnlyUsage({ value, used, limit }: { value: number; used: number; limit: number }) {
  return (
    <article className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3"><span className={iconClass('blue')}><BarChart3 size={22} /></span>
      <div>
        <small className="text-xs font-semibold text-slate-500">Workspace Usage (Read-only)</small><strong className="mt-1 block text-2xl font-bold text-slate-950">{value}%</strong><p className="mt-1 text-xs text-slate-500">{formatNumber(used)} credits used</p>
      </div></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${value}%` }} /></div>
      <footer className="flex justify-between gap-2 text-xs text-slate-500"><span>{formatNumber(Math.max(0, limit - used))} credits remaining</span><small>Resets on Jun 1, 2025</small></footer>
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
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className ?? ''}`}>
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-4"><div className="flex items-center gap-2 text-brand-600"><Icon size={18} /><h2 className="text-base font-bold text-slate-950">{title}</h2></div>{action ? <a className="text-xs font-bold text-brand-600" href="#overview">{action}</a> : null}</header>
      {children}
    </section>
  )
}

function CompactList({ rows, icon: Icon }: { rows: Array<{ title: string; meta: string; tone: Tone }>; icon: LucideIcon }) {
  return (
    <div className="grid px-4 pb-4">
      {rows.map((row) => (
        <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={row.title}>
          <span className={iconClass(row.tone)}><Icon size={17} /></span>
          <div className="min-w-0"><strong className="block truncate text-sm text-slate-900">{row.title}</strong><small className="mt-1 block text-xs text-slate-500">{row.meta}</small></div>
        </article>
      ))}
    </div>
  )
}

function ContributionLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-600">{label}</span><strong className="text-slate-950">{value}</strong></div>
  )
}

function StatusTag({ tone, children }: { tone: Tone; children: string }) {
  return <span className={tagClass(tone)}>{children}</span>
}

function PriorityTag({ priority }: { priority: TaskPriority }) {
  const tone = priority === 'High' ? 'red' : priority === 'Medium' ? 'orange' : 'blue'
  return <span className={tagClass(tone)}>{priority}</span>
}

function toneClass(tone: Tone) { return tone === 'purple' ? 'bg-brand-100 text-brand-700' : tone === 'blue' ? 'bg-sky-100 text-sky-700' : tone === 'green' ? 'bg-emerald-100 text-emerald-700' : tone === 'orange' ? 'bg-orange-100 text-orange-700' : tone === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600' }
function iconClass(tone: Tone) { return `grid size-10 shrink-0 place-items-center rounded-lg ${toneClass(tone)}` }
function dotClass(tone: Tone) { return `size-2 shrink-0 rounded-full ${toneClass(tone).split(' ')[0]}` }
function tagClass(tone: Tone) { return `inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-bold ${toneClass(tone)}` }

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
