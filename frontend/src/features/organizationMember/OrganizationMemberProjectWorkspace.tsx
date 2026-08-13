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
    <section className="mx-auto grid max-w-400 gap-5 p-4 sm:p-6" id="projects">
      <WorkspaceTopbar workspaceName={workspaceName} user={user} />

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div><span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">Project Workspace</span><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{projectName}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{projectDescription}</p>
        </div>
        <StatusPill tone="green">In Progress</StatusPill>
      </section>

      <nav className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1" aria-label="Project workspace tabs">
        <a className="shrink-0 rounded-md bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700" href="#requirements">Requirements</a>
        <a className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50" href="#srs-documents">SRS Documents</a>
        <a className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50" href="#workspace-diagrams">Diagrams</a>
        <a className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50" href="#workspace-activity">Activity</a>
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStat icon={FileText} label="Requirements" value={48} tone="purple" />
        <WorkspaceStat icon={FileText} label="SRS Documents" value={srsRows.length || 3} tone="blue" />
        <WorkspaceStat icon={Network} label="Diagrams" value={diagrams.length || 12} tone="green" />
        <WorkspaceStat icon={MessageSquare} label="Activity Comments" value={24} tone="orange" />
      </div>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="grid gap-5">
          <div className="grid gap-4 xl:grid-cols-3">
            <WorkspacePanel title="Requirements" icon={FileText} action="New Requirement" id="requirements">
              <div className="grid px-4 pb-4">
                {requirementRows.map((requirement) => (
                  <article className="flex items-start justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0" key={requirement.code}>
                    <div className="min-w-0"><span className="text-xs font-bold text-brand-600">{requirement.code}</span><strong className="mt-1 block text-sm text-slate-900">{requirement.title}</strong><p className="mt-1 text-xs leading-5 text-slate-500">{requirement.summary}</p></div>
                    <StatusPill tone={requirement.tone}>{requirement.status}</StatusPill>
                  </article>
                ))}
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="SRS Documents" icon={FileText} action="New Document" id="srs-documents">
              <ArtifactList rows={srsRows} icon={FileText} />
              <a className="mx-4 mb-4 text-sm font-bold text-brand-600" href="#srs">View all documents</a>
            </WorkspacePanel>

            <WorkspacePanel title="Diagrams" icon={Network} action="New Diagram" id="workspace-diagrams">
              <ArtifactList rows={diagramRows} icon={Network} />
              <a className="mx-4 mb-4 text-sm font-bold text-brand-600" href="#diagram-editor">Open latest</a>
            </WorkspacePanel>
          </div>

          <section className={cardClass}>
            <header className={cardHeader}><div className="flex items-center gap-2 text-brand-600"><FileText size={18} /><h2 className="text-base font-bold text-slate-950">{projectName} - SRS (v1.2)</h2></div><button className={textButton} type="button">Open</button></header>
            <article className="grid gap-2 p-4 text-sm leading-6 text-slate-600"><h3 className="font-bold text-slate-900">1. Introduction</h3><p>This SRS describes the functional and non-functional behavior for the e-commerce platform, including search, cart management, checkout, and payment processing.</p><h3 className="mt-2 font-bold text-slate-900">2. Scope</h3><p>The platform shall support product discovery, customer authentication, order placement, inventory visibility, and integration with payment gateways.</p>
            </article>
          </section>

          <div className="grid gap-4 xl:grid-cols-3">
            <WorkspacePanel title="My Tasks" icon={CheckCircle2}>
              <div className="grid px-4 pb-4">
                {workspaceTasks.map((task) => (
                  <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={task.title}><span className={dotClass(task.tone)} /><div><strong className="block text-sm text-slate-900">{task.title}</strong><small className="text-xs text-slate-500">{task.due}</small></div>
                  </article>
                ))}
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="Recent Exports" icon={Download}>
              <ArtifactList rows={recentExports} icon={Download} compact />
            </WorkspacePanel>

            <section className={cardClass}>
              <header className={cardHeader}><div className="flex items-center gap-2 text-brand-600"><Activity size={18} /><h2 className="text-base font-bold text-slate-950">Project Progress</h2></div></header>
              <div className="grid gap-3 p-4"><strong className="text-3xl text-slate-950">72%</strong><div className="h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-brand-600" style={{ width: '72%' }} /></div><p className="text-sm leading-5 text-slate-500">Requirements reviewed and artifacts updated this sprint.</p>
              </div>
            </section>
          </div>
        </main>

        <aside className={cardClass} id="workspace-activity">
          <header className={cardHeader}><div className="flex items-center gap-2 text-brand-600"><MessageSquare size={18} /><h2 className="text-base font-bold text-slate-950">Activity Comments</h2></div><button className={`${textButton} flex items-center gap-1`} type="button">All Activity <ChevronDown size={14} /></button>
          </header>
          <div className="grid px-4 pb-4">
            {comments.map((comment) => (
              <article className="flex gap-3 border-t border-slate-100 py-3 first:border-t-0" key={`${comment.author}-${comment.title}`}>
                <span className={avatarClass(comment.tone)}>{initials(comment.author)}</span>
                <div className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{comment.author}</strong><small className="text-xs text-slate-500">{comment.title}</small><p className="mt-1 text-sm leading-5 text-slate-600">{comment.body}</p><button className="mt-2 text-xs font-bold text-brand-600" type="button">Reply</button></div>
                <time className="whitespace-nowrap text-xs text-slate-500">{comment.time}</time>
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
    <header className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[16rem_minmax(0,1fr)_auto] lg:items-center">
      <button className="flex min-h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700" type="button">
        {workspaceName}
        <ChevronDown size={16} />
      </button>
      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400">
        <Search size={18} />
        <input className="min-w-0 flex-1 text-sm text-slate-800 outline-none" placeholder="Search project artifacts..." /><kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">Ctrl K</kbd>
      </label>
      <div className="flex items-center gap-2 lg:justify-end"><button className="relative grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100" type="button" aria-label="Notifications"><Bell size={19} /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border-2 border-white bg-brand-600 text-[10px] font-bold text-white">3</span></button><button className="grid size-9 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white" type="button" aria-label={user.full_name}>{initials(user.full_name)}</button>
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
    <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className={iconClass(tone)}><Icon size={21} /></span><div><strong className="block text-2xl text-slate-950">{value}</strong><small className="text-xs font-semibold text-slate-500">{label}</small></div>
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
    <section className={cardClass} id={id}>
      <header className={cardHeader}><div className="flex items-center gap-2 text-brand-600"><Icon size={18} /><h2 className="text-base font-bold text-slate-950">{title}</h2></div>{action ? <button className="flex items-center gap-1 text-xs font-bold text-brand-600" type="button"><Plus size={15} />{action}</button> : null}</header>
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
    <div className={`grid px-4 pb-4 ${compact ? '' : ''}`}>
      {rows.map((row) => {
        const RowIcon = row.icon ?? Icon
        return (
          <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={row.title}><span className={iconClass(row.tone)}><RowIcon size={17} /></span><div className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{row.title}</strong><small className="mt-1 block text-xs text-slate-500">{row.meta}</small></div>
            {row.status ? <StatusPill tone={row.tone}>{row.status}</StatusPill> : null}
          </article>
        )
      })}
    </div>
  )
}

function StatusPill({ tone, children }: { tone: Tone; children: string }) {
  return <span className={tagClass(tone)}>{children}</span>
}

const cardClass = 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
const cardHeader = 'flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-4'
const textButton = 'rounded-md px-2 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50'
function toneClass(tone: Tone) { return tone === 'purple' ? 'bg-brand-100 text-brand-700' : tone === 'blue' ? 'bg-sky-100 text-sky-700' : tone === 'green' ? 'bg-emerald-100 text-emerald-700' : tone === 'orange' ? 'bg-orange-100 text-orange-700' : tone === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600' }
function iconClass(tone: Tone) { return `grid size-10 shrink-0 place-items-center rounded-lg ${toneClass(tone)}` }
function tagClass(tone: Tone) { return `inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-bold ${toneClass(tone)}` }
function dotClass(tone: Tone) { return `size-2 shrink-0 rounded-full ${toneClass(tone).split(' ')[0]}` }
function avatarClass(tone: Tone) { return `grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${toneClass(tone)}` }

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
