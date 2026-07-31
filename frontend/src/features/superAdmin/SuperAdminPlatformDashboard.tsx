import {
  Activity,
  AlertTriangle,
  ArrowUp,
  Bell,
  CheckCircle2,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  Flag,
  MoreHorizontal,
  RefreshCcw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Area,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AuthUser } from '../../domains/auth/types'
import type { Subscription, Usage } from '../../domains/billing/types'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { GenerationJob, SrsDocument } from '../../domains/srs/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import './SuperAdminPlatformDashboard.css'

type SuperAdminPlatformDashboardProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  projects: Project[]
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
  generationJobs: GenerationJob[]
  subscription: Subscription | null
  usage: Usage | null
}

type Metric = {
  label: string
  value: string
  delta: string
  compare: string
  icon: LucideIcon
  tone: 'purple' | 'blue' | 'cyan' | 'green'
}

const metrics: Metric[] = [
  { label: 'Total Users', value: '12,842', delta: '8.4%', compare: 'vs last 30 days', icon: Users, tone: 'purple' },
  { label: 'Active Workspaces', value: '512', delta: '6.7%', compare: 'vs last 30 days', icon: Building2, tone: 'blue' },
  { label: 'Active Subscriptions', value: '438', delta: '3.1%', compare: 'vs last 30 days', icon: CreditCard, tone: 'cyan' },
  { label: 'Monthly Revenue', value: '$128,740', delta: '15.3%', compare: 'vs last 30 days', icon: DollarSign, tone: 'green' },
  { label: 'AI Jobs Today', value: '24,560', delta: '12.6%', compare: 'vs yesterday', icon: Activity, tone: 'purple' },
]

const revenueTrend = [
  { date: 'Apr 25', revenue: 108, jobs: 13 },
  { date: 'Apr 26', revenue: 104, jobs: 13 },
  { date: 'Apr 27', revenue: 86, jobs: 11 },
  { date: 'Apr 28', revenue: 118, jobs: 14 },
  { date: 'Apr 29', revenue: 116, jobs: 14 },
  { date: 'Apr 30', revenue: 94, jobs: 12 },
  { date: 'May 1', revenue: 103, jobs: 13 },
  { date: 'May 2', revenue: 101, jobs: 12 },
  { date: 'May 3', revenue: 124, jobs: 15 },
  { date: 'May 4', revenue: 111, jobs: 14 },
  { date: 'May 5', revenue: 108, jobs: 12 },
  { date: 'May 6', revenue: 119, jobs: 14 },
  { date: 'May 7', revenue: 118, jobs: 15 },
  { date: 'May 8', revenue: 96, jobs: 13 },
  { date: 'May 9', revenue: 94, jobs: 13 },
  { date: 'May 10', revenue: 119, jobs: 15 },
  { date: 'May 11', revenue: 124, jobs: 15 },
  { date: 'May 12', revenue: 99, jobs: 13 },
  { date: 'May 13', revenue: 109, jobs: 14 },
  { date: 'May 14', revenue: 141, jobs: 16 },
  { date: 'May 15', revenue: 122, jobs: 15 },
  { date: 'May 16', revenue: 110, jobs: 17 },
  { date: 'May 17', revenue: 134, jobs: 15 },
  { date: 'May 18', revenue: 98, jobs: 13 },
  { date: 'May 19', revenue: 116, jobs: 15 },
  { date: 'May 20', revenue: 139, jobs: 17 },
  { date: 'May 21', revenue: 113, jobs: 15 },
  { date: 'May 22', revenue: 120, jobs: 16 },
]

const planDistribution = [
  { name: 'Enterprise', value: 156, share: '35.6%', color: '#6335f5' },
  { name: 'Pro', value: 138, share: '31.5%', color: '#4a9cff' },
  { name: 'Team', value: 92, share: '21.0%', color: '#34c38f' },
  { name: 'Starter', value: 34, share: '7.8%', color: '#ffb22d' },
  { name: 'Trial', value: 18, share: '4.1%', color: '#c8d1df' },
]

const activities = [
  { avatar: 'SA', tone: 'purple', title: 'Super Admin', detail: 'Created new plan "Enterprise+"', time: '2m ago' },
  { avatar: 'JS', tone: 'green', title: 'john.smith@acmecorp.com', detail: 'Subscribed to Pro plan', time: '15m ago' },
  { avatar: 'AC', tone: 'blue', title: 'Acme Corp Workspace', detail: 'Workspace settings updated', time: '28m ago' },
  { avatar: 'ER', tone: 'orange', title: 'emma.roberts@globex.com', detail: 'User role changed to Editor', time: '1h ago' },
  { avatar: '!', tone: 'red', title: 'System', detail: 'High error rate detected in LLM Calls', time: '2h ago' },
]

const statuses = [
  { service: 'API Gateway', status: 'Operational' },
  { service: 'Authentication Service', status: 'Operational' },
  { service: 'Workspace Service', status: 'Operational' },
  { service: 'LLM Service', status: 'Operational' },
  { service: 'Job Processing', status: 'Operational' },
  { service: 'Payments Service', status: 'Operational' },
  { service: 'Email Service', status: 'Degraded' },
  { service: 'File Storage', status: 'Operational' },
]

const failedJobs = [
  { id: 'job_8f3a1c2d', workspace: 'Acme Corp', error: 'Timeout', time: '2m ago' },
  { id: 'job_7b2d9e1f', workspace: 'Globex Inc.', error: 'Rate limit', time: '18m ago' },
  { id: 'job_6c1a4e8b', workspace: 'Initech', error: 'Validation error', time: '32m ago' },
  { id: 'job_3d7e2a9c', workspace: 'Soylent Corp', error: 'Timeout', time: '45m ago' },
  { id: 'job_1f9b3c7e', workspace: 'Umbrella Corp', error: 'Server error', time: '1h ago' },
]

const quickActions = [
  { label: 'Create Plan', detail: 'Add a new subscription plan', icon: FileText },
  { label: 'Review Failed Jobs', detail: 'Investigate and retry failed jobs', icon: AlertTriangle },
  { label: 'View Audit Logs', detail: 'Browse admin and system logs', icon: ShieldCheck },
  { label: 'Manage Feature Flags', detail: 'Enable or disable platform features', icon: Flag },
]

export function SuperAdminPlatformDashboard({ user }: SuperAdminPlatformDashboardProps) {
  return (
    <section className="platform-dashboard" id="overview">
      <header className="platform-dashboard-topbar">
        <div>
          <h1>Platform Dashboard</h1>
          <p>Overview of platform usage, health and activities</p>
        </div>
        <label className="platform-search">
          <Search size={17} />
          <input placeholder="Search users, workspaces, jobs, plans..." />
          <kbd>? K</kbd>
        </label>
        <div className="platform-top-actions">
          <button type="button" aria-label="Notifications"><Bell size={19} /><span>8</span></button>
          <div className="platform-top-user">
            <span>{initials(user.full_name)}</span>
            <div><strong>{user.full_name || 'Super Admin'}</strong><small>Platform Admin</small></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </header>

      <section className="platform-metrics" aria-label="Platform metrics">
        {metrics.map((metric) => <MetricCard metric={metric} key={metric.label} />)}
      </section>

      <section className="platform-dashboard-main-grid">
        <RevenueTrend />
        <PlanDistribution />
      </section>

      <section className="platform-dashboard-lists">
        <RecentActivity />
        <SystemStatus />
        <RecentFailedJobs />
      </section>

      <QuickActions />
    </section>
  )
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon
  return (
    <article className="platform-metric-card">
      <span className={`metric-icon tone-${metric.tone}`}><Icon size={26} /></span>
      <div>
        <small>{metric.label}</small>
        <strong>{metric.value}</strong>
        <p><ArrowUp size={12} /> {metric.delta} <span>{metric.compare}</span></p>
      </div>
    </article>
  )
}

function RevenueTrend() {
  return (
    <article className="platform-card revenue-trend-card">
      <header>
        <div>
          <h2>Revenue &amp; Usage Trend</h2>
          <div className="revenue-summary-row">
            <SummaryStat label="Revenue" value="$128,740" delta="15.3%" />
            <SummaryStat label="AI Jobs" value="24,560" delta="12.6%" />
            <SummaryStat label="LLM Calls" value="1.58M" delta="9.8%" />
          </div>
        </div>
        <div className="card-toolbar">
          <button type="button">Last 30 days <CalendarDays size={14} /></button>
          <button type="button" aria-label="More options"><MoreHorizontal size={16} /></button>
        </div>
      </header>
      <div className="trend-chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueTrend} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6335f5" stopOpacity={0.14} />
                <stop offset="95%" stopColor="#6335f5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#edf2f7" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#73819a', fontSize: 12 }} interval={2} />
            <YAxis yAxisId="revenue" tickLine={false} axisLine={false} tick={{ fill: '#6335f5', fontSize: 12 }} tickFormatter={(value) => `$${value}K`} />
            <YAxis yAxisId="jobs" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#4a9cff', fontSize: 12 }} tickFormatter={(value) => `${value}K`} />
            <Tooltip cursor={{ stroke: '#d9e2ef' }} />
            <Legend iconType="plainline" align="right" verticalAlign="top" height={28} />
            <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="none" fill="url(#revenueFill)" />
            <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue (USD)" stroke="#6335f5" strokeWidth={3} dot={false} />
            <Line yAxisId="jobs" type="monotone" dataKey="jobs" name="AI Jobs" stroke="#4a9cff" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}

function SummaryStat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return <span><small>{label}</small><strong>{value}</strong><em><ArrowUp size={12} /> {delta}</em></span>
}

function PlanDistribution() {
  return (
    <article className="platform-card plan-distribution-card">
      <header>
        <h2>Plan Distribution</h2>
        <div className="card-toolbar"><button type="button">By Active Subscriptions <ChevronDown size={14} /></button><button type="button" aria-label="More options"><MoreHorizontal size={16} /></button></div>
      </header>
      <div className="plan-distribution-body">
        <div className="donut-wrap">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={planDistribution} innerRadius={62} outerRadius={94} paddingAngle={0} dataKey="value" stroke="none">
                {planDistribution.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center"><strong>438</strong><span>Total</span></div>
        </div>
        <div className="plan-legend-list">
          {planDistribution.map((plan) => (
            <div key={plan.name}><span style={{ background: plan.color }} /><strong>{plan.name}</strong><em>{plan.value} ({plan.share})</em></div>
          ))}
        </div>
      </div>
      <a href="#plans">View all plans <ChevronRight size={16} /></a>
    </article>
  )
}

function RecentActivity() {
  return (
    <article className="platform-card compact-card">
      <header><h2>Recent Activity</h2><a href="#audit-logs">View all</a></header>
      <div className="recent-activity-list">
        {activities.map((activity) => (
          <div className="activity-item" key={`${activity.title}-${activity.time}`}>
            <span className={`activity-avatar avatar-${activity.tone}`}>{activity.avatar}</span>
            <div><strong>{activity.title}</strong><small>{activity.detail}</small></div>
            <time>{activity.time}</time>
          </div>
        ))}
      </div>
    </article>
  )
}

function SystemStatus() {
  return (
    <article className="platform-card compact-card">
      <header><h2>System Status</h2><a href="#system-health">View all</a></header>
      <div className="status-list">
        {statuses.map((status) => (
          <div className="status-row" key={status.service}>
            {status.status === 'Operational' ? <span className="status-ok"><CheckCircle2 size={14} /></span> : <span className="status-warn"><AlertTriangle size={14} /></span>}
            <strong>{status.service}</strong>
            <em className={status.status === 'Operational' ? 'operational' : 'degraded'}>{status.status}</em>
          </div>
        ))}
      </div>
      <footer><span><i /> All systems operational</span><small>Updated 2m ago <RefreshCcw size={13} /></small></footer>
    </article>
  )
}

function RecentFailedJobs() {
  return (
    <article className="platform-card compact-card failed-jobs-card">
      <header><h2>Recent Failed Jobs</h2><a href="#ai-jobs">View all</a></header>
      <div className="failed-table" role="table" aria-label="Recent failed jobs">
        <div role="row"><span>Job ID</span><span>Workspace</span><span>Error</span><span>Time</span></div>
        {failedJobs.map((job) => (
          <div role="row" key={job.id}><span><i />{job.id}</span><span>{job.workspace}</span><span>{job.error}</span><span>{job.time}</span></div>
        ))}
      </div>
      <a href="#ai-jobs">View all failed jobs <ChevronRight size={16} /></a>
    </article>
  )
}

function QuickActions() {
  return (
    <article className="platform-card quick-actions-card">
      <h2>Quick Actions</h2>
      <div>
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button type="button" key={action.label}>
              <span><Icon size={21} /></span>
              <div><strong>{action.label}</strong><small>{action.detail}</small></div>
              <ChevronRight size={18} />
            </button>
          )
        })}
      </div>
    </article>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SA'
}


