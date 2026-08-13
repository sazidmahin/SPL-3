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
    <section className="mx-auto grid max-w-400 gap-5 p-4 sm:p-6" id="overview">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-950">Platform Dashboard</h1><p className="mt-1 text-sm text-slate-500">Overview of platform usage, health and activities</p>
        </div>
        <label className="flex min-w-60 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:max-w-90">
          <Search size={17} />
          <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search users, workspaces, jobs, plans..." /><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘ K</kbd>
        </label>
        <div className="flex items-center gap-2"><button className="relative grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" type="button" aria-label="Notifications"><Bell size={19} /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">8</span></button><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{initials(user.full_name)}</span><div className="hidden sm:grid"><strong className="text-sm text-slate-900">{user.full_name || 'Super Admin'}</strong><small className="text-xs text-slate-500">Platform Admin</small></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Platform metrics">
        {metrics.map((metric) => <MetricCard metric={metric} key={metric.label} />)}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(22rem,.85fr)]">
        <RevenueTrend />
        <PlanDistribution />
      </section>

      <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
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
    <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className={metricIconClass(metric.tone)}><Icon size={22} /></span>
      <div>
        <small className="text-xs font-semibold text-slate-500">{metric.label}</small><strong className="mt-1 block text-2xl text-slate-950">{metric.value}</strong><p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600"><ArrowUp size={12} /> {metric.delta} <span className="font-medium text-slate-400">{metric.compare}</span></p>
      </div>
    </article>
  )
}

function RevenueTrend() {
  return (
    <article className={cardClass}><header className={headerClass}>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Revenue &amp; Usage Trend</h2><div className="mt-3 flex flex-wrap gap-4">
            <SummaryStat label="Revenue" value="$128,740" delta="15.3%" />
            <SummaryStat label="AI Jobs" value="24,560" delta="12.6%" />
            <SummaryStat label="LLM Calls" value="1.58M" delta="9.8%" />
          </div>
        </div>
        <div className="flex gap-2"><button className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600" type="button">Last 30 days <CalendarDays size={14} /></button><button className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500" type="button" aria-label="More options"><MoreHorizontal size={16} /></button>
        </div>
      </header>
      <div className="p-4">
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
  return <span className="grid gap-1"><small className="text-xs text-slate-500">{label}</small><strong className="text-lg text-slate-950">{value}</strong><em className="flex items-center gap-1 text-xs font-bold not-italic text-emerald-600"><ArrowUp size={12} /> {delta}</em></span>
}

function PlanDistribution() {
  return (
    <article className={cardClass}><header className={headerClass}><h2 className="text-lg font-bold text-slate-950">Plan Distribution</h2><div className="flex gap-2"><button className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600" type="button">By Active Subscriptions <ChevronDown size={14} /></button><button className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500" type="button" aria-label="More options"><MoreHorizontal size={16} /></button></div>
      </header>
      <div className="grid items-center gap-3 p-4 sm:grid-cols-2"><div className="relative h-58">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={planDistribution} innerRadius={62} outerRadius={94} paddingAngle={0} dataKey="value" stroke="none">
                {planDistribution.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-content-center text-center"><strong className="text-2xl text-slate-950">438</strong><span className="text-xs text-slate-500">Total</span></div>
        </div>
        <div className="grid gap-2">
          {planDistribution.map((plan) => (
            <div className="flex items-center gap-2 text-sm" key={plan.name}><span className="size-2 rounded-full" style={{ background: plan.color }} /><strong className="flex-1 text-slate-700">{plan.name}</strong><em className="text-xs not-italic text-slate-500">{plan.value} ({plan.share})</em></div>
          ))}
        </div>
      </div>
      <a className="flex items-center gap-1 border-t border-slate-100 px-4 py-3 text-sm font-bold text-brand-600" href="#plans">View all plans <ChevronRight size={16} /></a>
    </article>
  )
}

function RecentActivity() {
  return (
    <article className={cardClass}><header className={headerClass}><h2 className="font-bold text-slate-950">Recent Activity</h2><a className="text-xs font-bold text-brand-600" href="#audit-logs">View all</a></header><div className="grid px-4 pb-4">
        {activities.map((activity) => (
          <div className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0" key={`${activity.title}-${activity.time}`}><span className={avatarClass(activity.tone)}>{activity.avatar}</span><div className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{activity.title}</strong><small className="mt-1 block truncate text-xs text-slate-500">{activity.detail}</small></div><time className="whitespace-nowrap text-xs text-slate-500">{activity.time}</time>
          </div>
        ))}
      </div>
    </article>
  )
}

function SystemStatus() {
  return (
    <article className={cardClass}><header className={headerClass}><h2 className="font-bold text-slate-950">System Status</h2><a className="text-xs font-bold text-brand-600" href="#system-health">View all</a></header><div className="grid px-4 pb-4">
        {statuses.map((status) => (
          <div className="flex items-center gap-2 border-t border-slate-100 py-2.5 first:border-t-0" key={status.service}>{status.status === 'Operational' ? <span className="text-emerald-600"><CheckCircle2 size={14} /></span> : <span className="text-amber-600"><AlertTriangle size={14} /></span>}<strong className="flex-1 text-sm text-slate-700">{status.service}</strong><em className={status.status === 'Operational' ? 'rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold not-italic text-emerald-700' : 'rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold not-italic text-amber-700'}>{status.status}</em>
          </div>
        ))}
      </div>
      <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span className="flex items-center gap-1 font-semibold text-emerald-600"><i className="size-2 rounded-full bg-emerald-500" /> All systems operational</span><small className="flex items-center gap-1">Updated 2m ago <RefreshCcw size={13} /></small></footer>
    </article>
  )
}

function RecentFailedJobs() {
  return (
    <article className={cardClass}><header className={headerClass}><h2 className="font-bold text-slate-950">Recent Failed Jobs</h2><a className="text-xs font-bold text-brand-600" href="#ai-jobs">View all</a></header><div className="overflow-x-auto"><div className="min-w-135" role="table" aria-label="Recent failed jobs"><div className="grid grid-cols-4 gap-2 bg-slate-50 px-4 py-2 text-xs font-bold uppercase text-slate-500" role="row"><span>Job ID</span><span>Workspace</span><span>Error</span><span>Time</span></div>
        {failedJobs.map((job) => (
          <div className="grid grid-cols-4 gap-2 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-600" role="row" key={job.id}><span className="flex items-center gap-1 font-mono text-rose-600"><i className="size-1.5 rounded-full bg-rose-500" />{job.id}</span><span>{job.workspace}</span><span>{job.error}</span><span>{job.time}</span></div>
        ))}
      </div>
      </div><a className="flex items-center gap-1 border-t border-slate-100 px-4 py-3 text-sm font-bold text-brand-600" href="#ai-jobs">View all failed jobs <ChevronRight size={16} /></a>
    </article>
  )
}

function QuickActions() {
  return (
    <article className={cardClass}><h2 className="border-b border-slate-100 px-4 py-4 font-bold text-slate-950">Quick Actions</h2><div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50" type="button" key={action.label}><span className="grid size-9 place-items-center rounded-lg bg-brand-100 text-brand-700"><Icon size={20} /></span><div className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{action.label}</strong><small className="mt-1 block text-xs text-slate-500">{action.detail}</small></div><ChevronRight className="text-slate-400" size={18} />
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

const cardClass = 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
const headerClass = 'flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4'
function metricIconClass(tone: Metric['tone']) { return tone === 'purple' ? 'grid size-11 place-items-center rounded-xl bg-brand-100 text-brand-700' : tone === 'blue' ? 'grid size-11 place-items-center rounded-xl bg-sky-100 text-sky-700' : tone === 'cyan' ? 'grid size-11 place-items-center rounded-xl bg-cyan-100 text-cyan-700' : 'grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700' }
function avatarClass(tone: string) { return tone === 'purple' ? 'grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700' : tone === 'green' ? 'grid size-9 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700' : tone === 'blue' ? 'grid size-9 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700' : tone === 'orange' ? 'grid size-9 place-items-center rounded-full bg-orange-100 text-xs font-bold text-orange-700' : 'grid size-9 place-items-center rounded-full bg-rose-100 text-xs font-bold text-rose-700' }


