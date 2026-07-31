import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Crown,
  Cuboid,
  FileText,
  Folder,
  GraduationCap,
  Landmark,
  MoreVertical,
  Network,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Subscription, Usage } from '../../domains/billing/types'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { GenerationJob, SrsDocument } from '../../domains/srs/types'
import type { AuthUser } from '../../domains/auth/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import './MemberDashboard.css'

type MemberDashboardProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  projects: Project[]
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
  generationJobs: GenerationJob[]
  subscription: Subscription | null
  usage: Usage | null
}

type Tone = 'purple' | 'blue' | 'green' | 'orange' | 'neutral'

const fallbackProjects = [
  { id: 'project-1', name: 'E-Commerce Platform', updated: 'Updated 2 hours ago', status: 'In Progress', tone: 'green' as const, icon: ShoppingCart },
  { id: 'project-2', name: 'Healthcare Appointment System', updated: 'Updated yesterday', status: 'Planning', tone: 'blue' as const, icon: BriefcaseBusiness },
  { id: 'project-3', name: 'Inventory Management System', updated: 'Updated 2 days ago', status: 'In Progress', tone: 'green' as const, icon: Folder },
  { id: 'project-4', name: 'Learning Management System', updated: 'Updated 3 days ago', status: 'Review', tone: 'purple' as const, icon: GraduationCap },
  { id: 'project-5', name: 'Mobile Banking App', updated: 'Updated 5 days ago', status: 'On Hold', tone: 'neutral' as const, icon: Landmark },
]

const fallbackDocuments = [
  { id: 'doc-1', title: 'E-Commerce Platform - SRS', meta: 'v1.2  â€¢  Updated 2 hours ago', type: 'DOCX', tone: 'blue' as const },
  { id: 'doc-2', title: 'Healthcare Appointment System - SRS', meta: 'v1.0  â€¢  Updated yesterday', type: 'PDF', tone: 'orange' as const },
  { id: 'doc-3', title: 'Inventory Management System - SRS', meta: 'v1.1  â€¢  Updated 2 days ago', type: 'DOCX', tone: 'blue' as const },
  { id: 'doc-4', title: 'Learning Management System - SRS', meta: 'v1.0  â€¢  Updated 3 days ago', type: 'PDF', tone: 'orange' as const },
  { id: 'doc-5', title: 'Mobile Banking App - SRS', meta: 'v1.0  â€¢  Updated 5 days ago', type: 'DOCX', tone: 'blue' as const },
]

const activities = [
  { id: 'activity-1', title: 'AI job completed: Generate Use Case Diagram', meta: 'E-Commerce Platform', time: '10 min ago', tone: 'green' as const, icon: CheckCircle2 },
  { id: 'activity-2', title: 'SRS document updated', meta: 'E-Commerce Platform - SRS', time: '2 hours ago', tone: 'blue' as const, icon: FileText },
  { id: 'activity-3', title: 'New project created', meta: 'Inventory Management System', time: '2 days ago', tone: 'purple' as const, icon: Folder },
  { id: 'activity-4', title: 'Diagram exported', meta: 'Class Diagram - LMS', time: '3 days ago', tone: 'orange' as const, icon: Network },
  { id: 'activity-5', title: 'AI job completed: Generate SRS', meta: 'Healthcare Appointment System', time: '5 days ago', tone: 'green' as const, icon: CheckCircle2 },
]

const trendData = [
  { day: 'May 1', credits: 620 },
  { day: 'May 4', credits: 1300 },
  { day: 'May 7', credits: 1900 },
  { day: 'May 10', credits: 2700 },
  { day: 'May 13', credits: 3600 },
  { day: 'May 16', credits: 4500 },
  { day: 'May 19', credits: 5800 },
  { day: 'May 22', credits: 7000 },
  { day: 'May 25', credits: 7700 },
  { day: 'May 28', credits: 8500 },
  { day: 'May 31', credits: 9200 },
]

export function MemberDashboard({
  user,
  activeWorkspace,
  projects,
  srsDocuments,
  diagrams,
  generationJobs,
  subscription,
  usage,
}: MemberDashboardProps) {
  const workspaceName = activeWorkspace?.workspace.name ?? 'Personal Workspace'
  const creditLimit = 10000
  const creditsUsed = Math.max(usage?.srs_generations ?? 6200, usage ? usage.srs_generations : 6200)
  const creditPercent = Math.min(100, Math.round((creditsUsed / creditLimit) * 100))
  const projectRows = projects.length > 0 ? projects.slice(0, 5).map(projectToRow) : fallbackProjects
  const srsRows = srsDocuments.length > 0 ? srsDocuments.slice(0, 5).map(documentToRow) : fallbackDocuments

  return (
    <section className="user-dashboard" id="overview">
      <DashboardTopbar workspaceName={workspaceName} user={user} />

      <div className="dashboard-title-row">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening in your workspace.</p>
        </div>
        <button className="new-project-button" type="button">
          <Plus size={18} />
          New Project
          <span className="new-project-divider" />
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="user-metric-grid">
        <MetricCard icon={Folder} label="Projects" value={projects.length || 12} delta="2 from last month" tone="purple" />
        <MetricCard icon={FileText} label="SRS Documents" value={srsDocuments.length || 28} delta="6 from last month" tone="purple" />
        <MetricCard icon={Network} label="Diagrams" value={diagrams.length || 17} delta="3 from last month" tone="purple" />
        <MetricCard icon={Sparkles} label="AI Jobs This Month" value={generationJobs.length || 46} delta="18% from last month" tone="purple" />
        <CreditMetric value={creditPercent} used={creditsUsed} limit={creditLimit} />
      </div>

      <div className="dashboard-content-grid">
        <DashboardPanel icon={Folder} title="Recent Projects" className="recent-projects-panel">
          <EntityList rows={projectRows} />
        </DashboardPanel>

        <DashboardPanel icon={FileText} title="Recent SRS Documents" className="recent-docs-panel">
          <DocumentList rows={srsRows} />
        </DashboardPanel>

        <DashboardPanel icon={Zap} title="Recent Activity" className="recent-activity-panel">
          <ActivityList />
        </DashboardPanel>

        <SubscriptionCard planName={subscription?.plan.name ?? 'Pro Plan'} />
        <UsageDonut used={creditsUsed} limit={creditLimit} percent={creditPercent} />
        <UsageTrend />
      </div>
    </section>
  )
}

type DashboardTopbarProps = {
  workspaceName: string
  user: AuthUser
}

function DashboardTopbar({ workspaceName, user }: DashboardTopbarProps) {
  return (
    <header className="dashboard-topbar-local">
      <button className="workspace-select-button" type="button">
        <span className="workspace-select-icon"><Cuboid size={21} /></span>
        {workspaceName}
        <ChevronDown size={16} />
      </button>
      <label className="dashboard-search">
        <Search size={20} />
        <input placeholder="Search projects, documents, diagrams..." />
        <kbd>âŒ˜ K</kbd>
      </label>
      <div className="dashboard-toolbar">
        <button className="round-icon-button notification-button" type="button" aria-label="Notifications">
          <Bell size={20} />
          <span>3</span>
        </button>
        <button className="round-icon-button" type="button" aria-label="Help"><CircleHelp size={20} /></button>
        <button className="avatar-button" type="button" aria-label={user.full_name}>
          <span>{initials(user.full_name)}</span>
          <i />
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  )
}

type MetricCardProps = {
  icon: typeof Folder
  label: string
  value: number
  delta: string
  tone: Tone
}

function MetricCard({ icon: Icon, label, value, delta }: MetricCardProps) {
  return (
    <article className="user-metric-card">
      <div className="metric-icon-box"><Icon size={31} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <small>â†‘ {delta}</small>
    </article>
  )
}

type CreditMetricProps = {
  value: number
  used: number
  limit: number
}

function CreditMetric({ value, used, limit }: CreditMetricProps) {
  return (
    <article className="user-metric-card credit-metric-card">
      <div className="metric-icon-box"><BarChart3 size={31} /></div>
      <div>
        <span>Credit Usage</span>
        <strong>{value}%</strong>
      </div>
      <p>{formatNumber(used)} / {formatNumber(limit)} credits used</p>
      <div className="credit-progress"><span style={{ width: `${value}%` }} /></div>
    </article>
  )
}

type DashboardPanelProps = {
  icon: typeof Folder
  title: string
  className?: string
  children: React.ReactNode
}

function DashboardPanel({ icon: Icon, title, className, children }: DashboardPanelProps) {
  return (
    <section className={`target-dashboard-panel ${className ?? ''}`}>
      <header>
        <div>
          <Icon size={19} />
          <h2>{title}</h2>
        </div>
        <button type="button">View all</button>
      </header>
      {children}
    </section>
  )
}

type EntityRow = {
  id: string
  name: string
  updated: string
  status: string
  tone: Tone
  icon: typeof Folder
}

function EntityList({ rows }: { rows: EntityRow[] }) {
  return (
    <div className="dashboard-list">
      {rows.map((row) => (
        <article className="dashboard-list-row" key={row.id}>
          <span className={`list-icon tone-${row.tone}`}><row.icon size={22} /></span>
          <div>
            <strong>{row.name}</strong>
            <small>{row.updated}</small>
          </div>
          <StatusTag tone={row.tone}>{row.status}</StatusTag>
          <MoreVertical className="row-menu-icon" size={18} />
        </article>
      ))}
    </div>
  )
}

type DocumentRow = {
  id: string
  title: string
  meta: string
  type: string
  tone: Tone
}

function DocumentList({ rows }: { rows: DocumentRow[] }) {
  return (
    <div className="dashboard-list">
      {rows.map((row) => (
        <article className="dashboard-list-row document-row" key={row.id}>
          <span className={`doc-file-icon tone-${row.tone}`}>{row.type}</span>
          <div>
            <strong>{row.title}</strong>
            <small>{row.meta}</small>
          </div>
          <MoreVertical className="row-menu-icon" size={18} />
        </article>
      ))}
    </div>
  )
}

function ActivityList() {
  return (
    <div className="activity-timeline">
      {activities.map((activity) => (
        <article className="activity-item" key={activity.id}>
          <span className={`activity-icon tone-${activity.tone}`}><activity.icon size={18} /></span>
          <div>
            <strong>{activity.title}</strong>
            <small>{activity.meta}</small>
          </div>
          <time>{activity.time}</time>
        </article>
      ))}
    </div>
  )
}

function SubscriptionCard({ planName }: { planName: string }) {
  return (
    <section className="target-dashboard-panel subscription-dashboard-card">
      <header>
        <div>
          <Crown size={20} />
          <h2>Subscription</h2>
        </div>
      </header>
      <div className="subscription-inner-card">
        <div>
          <h3>{planName}</h3>
          <p>Renews on Jun 18, 2025</p>
          <ul>
            <li>10,000 credits / month</li>
            <li>Unlimited projects</li>
            <li>Advanced AI generation</li>
            <li>Priority support</li>
          </ul>
          <div className="subscription-actions">
            <button type="button">Manage Subscription</button>
            <button type="button">View Plans</button>
          </div>
        </div>
        <div className="crown-visual" aria-hidden="true"><Crown size={92} /></div>
      </div>
    </section>
  )
}

function UsageDonut({ used, limit, percent }: { used: number; limit: number; percent: number }) {
  const chartData = [
    { name: 'Credits used', value: used, color: '#6d28d9' },
    { name: 'Credits remaining', value: Math.max(0, limit - used), color: '#e9ddff' },
  ]

  return (
    <section className="target-dashboard-panel chart-card usage-overview-card">
      <header>
        <div><h2>Usage Overview</h2></div>
        <button type="button">This Month <ChevronDown size={14} /></button>
      </header>
      <div className="usage-overview-body">
        <div className="usage-copy">
          <span>Credits Used</span>
          <strong>{formatNumber(used)} / {formatNumber(limit)}</strong>
          <b>{percent}%</b>
          <div className="legend-list">
            <span><i className="legend-used" />Credits used</span>
            <span><i className="legend-remaining" />Credits remaining</span>
          </div>
        </div>
        <div className="donut-wrap">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={chartData} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={1} stroke="none">
                {chartData.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(Number(value ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center"><strong>{formatNumber(used)}</strong><span>Used</span></div>
        </div>
      </div>
    </section>
  )
}

function UsageTrend() {
  return (
    <section className="target-dashboard-panel chart-card usage-trend-card">
      <header>
        <div><h2>Usage Trend</h2></div>
        <button type="button">This Month <ChevronDown size={14} /></button>
      </header>
      <ResponsiveContainer width="100%" height={236}>
        <LineChart data={trendData} margin={{ top: 12, right: 18, left: -14, bottom: 0 }}>
          <XAxis dataKey="day" axisLine={false} tickLine={false} interval={1} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000}K`} />
          <Tooltip formatter={(value) => `${formatNumber(Number(value ?? 0))} credits`} />
          <Line type="monotone" dataKey="credits" stroke="#6d28d9" strokeWidth={4} dot={{ r: 4, fill: '#6d28d9' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="trend-legend"><span /> Credits Used</div>
    </section>
  )
}

function StatusTag({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`dashboard-status-tag tone-${tone}`}>{children}</span>
}

function projectToRow(project: Project): EntityRow {
  return {
    id: project.id,
    name: project.name,
    updated: `Updated ${new Date(project.updated_at).toLocaleDateString()}`,
    status: project.status || 'Active',
    tone: project.status === 'archived' ? 'neutral' : 'green',
    icon: Folder,
  }
}

function documentToRow(document: SrsDocument): DocumentRow {
  return {
    id: document.id,
    title: document.title,
    meta: `${document.status}  â€¢  Updated ${new Date(document.updated_at).toLocaleDateString()}`,
    type: 'DOCX',
    tone: 'blue',
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

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
