import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileClock,
  Gauge,
  LayoutDashboard,
  ListChecks,
  ServerCog,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
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

type Tone = 'violet' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate' | 'cyan'

type Metric = {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down'
  icon: LucideIcon
  tone: Tone
}

const usageSeries = [34, 48, 42, 58, 62, 73, 68, 84, 78, 92, 86, 96]
const healthChecks = [
  { label: 'API Gateway', value: '99.98%', status: 'Operational', tone: 'emerald' as const },
  { label: 'LLM Queue', value: '156 ms', status: 'Nominal', tone: 'blue' as const },
  { label: 'Database', value: '0.73%', status: 'Error rate', tone: 'amber' as const },
]
const platformActivity = [
  { label: 'New organization workspace created', detail: 'BrightPath Solutions joined Growth', time: '4 min ago', tone: 'emerald' as const },
  { label: 'Subscription upgraded', detail: 'NextGen Analytics moved to Enterprise', time: '18 min ago', tone: 'violet' as const },
  { label: 'Large generation job completed', detail: 'Visionary Works processed 2,450,000 tokens', time: '27 min ago', tone: 'blue' as const },
  { label: 'Payment processed', detail: 'Enterprise renewal invoice paid', time: '38 min ago', tone: 'emerald' as const },
  { label: 'API rate limit updated', detail: 'TechFlow Inc granted higher concurrency', time: '1 hr ago', tone: 'amber' as const },
  { label: 'Workspace deactivated', detail: 'OldCo Solutions moved to archived', time: '2 hrs ago', tone: 'rose' as const },
]
const topWorkspaces = [
  { rank: 1, name: 'Innovate Labs', plan: 'Enterprise', members: 634, usage: 75210, progress: 88, tone: 'violet' as const },
  { rank: 2, name: 'NextGen Analytics', plan: 'Growth', members: 275, usage: 67432, progress: 79, tone: 'blue' as const },
  { rank: 3, name: 'BrightPath Solutions', plan: 'Pro', members: 356, usage: 43901, progress: 62, tone: 'emerald' as const },
  { rank: 4, name: 'StartupHub', plan: 'Growth', members: 298, usage: 29011, progress: 48, tone: 'amber' as const },
]
const subscriptionChanges = [
  { workspace: 'NextGen Analytics', change: 'Upgraded', from: 'Growth', to: 'Enterprise', amount: '$1,249', tone: 'emerald' as const },
  { workspace: 'TechFlow Inc', change: 'New', from: 'Trial', to: 'Pro', amount: '$299', tone: 'blue' as const },
  { workspace: 'OldCo Solutions', change: 'Downgraded', from: 'Enterprise', to: 'Pro', amount: '-$950', tone: 'rose' as const },
  { workspace: 'Visionary Works', change: 'Renewed', from: 'Pro', to: 'Pro', amount: '$299', tone: 'violet' as const },
]
const quickActions = [
  { label: 'Manage Plans', icon: WalletCards, tone: 'violet' as const },
  { label: 'Create Workspace', icon: Building2, tone: 'emerald' as const },
  { label: 'View Subscriptions', icon: CreditCard, tone: 'blue' as const },
  { label: 'Usage Report', icon: BarChart3, tone: 'amber' as const },
  { label: 'Platform Settings', icon: ServerCog, tone: 'slate' as const },
  { label: 'Audit Logs', icon: FileClock, tone: 'rose' as const },
]

export function SuperAdminPlatformDashboard({
  user,
  activeWorkspace,
  projects,
  srsDocuments,
  diagrams,
  generationJobs,
  subscription,
  usage,
}: SuperAdminPlatformDashboardProps) {
  const workspaceName = activeWorkspace?.workspace.name ?? 'All Workspaces'
  const platformWorkspaceCount = Math.max(projects.length + topWorkspaces.length, 842)
  const artifactCount = Math.max(srsDocuments.length + diagrams.length, 9682)
  const totalJobs = Math.max(generationJobs.length, 156)
  const llmCalls = usage ? usage.srs_generations + usage.ai_diagram_generations + usage.manual_diagram_saves : 1240000
  const planName = subscription?.plan.name ?? 'Enterprise Plan'
  const metrics: Metric[] = [
    { label: 'Organizations', value: '1,243', delta: '9.3%', trend: 'up', icon: Building2, tone: 'violet' },
    { label: 'Users', value: '12,842', delta: '12.8%', trend: 'up', icon: Users, tone: 'emerald' },
    { label: 'Active Subscriptions', value: '6,214', delta: '15.4%', trend: 'up', icon: CreditCard, tone: 'blue' },
    { label: 'Workspaces', value: formatNumber(platformWorkspaceCount), delta: '7.1%', trend: 'up', icon: LayoutDashboard, tone: 'amber' },
    { label: 'Monthly Revenue', value: '$324,560', delta: '18.6%', trend: 'up', icon: WalletCards, tone: 'emerald' },
    { label: 'Generation Jobs', value: formatNumber(totalJobs), delta: '22.4%', trend: 'up', icon: Bot, tone: 'cyan' },
    { label: 'LLM Calls', value: compactNumber(llmCalls), delta: '16.2%', trend: 'up', icon: Sparkles, tone: 'violet' },
  ]

  return (
    <section className="super-admin-dashboard" id="overview">
      <header className="super-admin-topbar">
        <button className="super-workspace-button" type="button">
          {workspaceName}
          <ChevronDown size={16} />
        </button>
        <label className="super-admin-search">
          <span>Search workspaces, users, subscriptions...</span>
        </label>
        <div className="super-admin-tools">
          <button type="button" aria-label="Notifications"><Bell size={19} /><span>8</span></button>
          <button type="button" aria-label="Platform settings"><Settings size={19} /></button>
          <div className="super-admin-user">
            <span>{initials(user.full_name)}</span>
            <div><strong>{user.full_name}</strong><small>Super Admin</small></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </header>

      <div className="super-admin-title-row">
        <div>
          <span>Super Admin Platform Dashboard</span>
          <h1>Dashboard</h1>
        </div>
        <div className="date-range-pill">
          <FileClock size={17} />
          May 1 - May 31, 2025
        </div>
      </div>

      <div className="super-metrics-grid">
        {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>

      <div className="super-dashboard-grid">
        <PlatformPanel title="Platform Usage Overview" icon={BarChart3} className="usage-overview-panel">
          <div className="usage-kpi-row">
            <UsageKpi label="LLM Calls" value={compactNumber(llmCalls)} detail="8.67M tokens processed" tone="violet" />
            <UsageKpi label="Success" value="8.61M" detail="99.27% completed" tone="emerald" />
            <UsageKpi label="Artifacts" value={formatNumber(artifactCount)} detail="SRS and diagrams generated" tone="blue" />
            <UsageKpi label="Failed" value="63.2K" detail="0.73% requests" tone="rose" />
            <UsageKpi label="Timeout" value="2.8K" detail="0.08% requests" tone="amber" />
          </div>
          <div className="usage-chart" aria-label="Monthly platform usage trend">
            {usageSeries.map((height, index) => <span style={{ height: `${height}%` }} key={index} />)}
          </div>
          <div className="token-capacity-row">
            <div>
              <span>Platform Overview</span>
              <strong>{formatNumber(2450000)}</strong>
              <small>tokens used this month</small>
            </div>
            <div className="capacity-meter">
              <div style={{ background: `conic-gradient(#2563eb 176deg, #e5e7eb 0deg)` }}><strong>49%</strong><span>Used</span></div>
            </div>
          </div>
        </PlatformPanel>

        <PlatformPanel title="Platform Health" icon={Gauge} action="All Systems Operational" className="health-panel">
          <div className="health-summary">
            <CheckCircle2 size={34} />
            <div><strong>99.98%</strong><span>Uptime</span></div>
          </div>
          <div className="health-check-list">
            {healthChecks.map((check) => (
              <article className="health-check-row" key={check.label}>
                <span className={`super-tone-${check.tone}`}><Activity size={17} /></span>
                <div><strong>{check.label}</strong><small>{check.status}</small></div>
                <b>{check.value}</b>
              </article>
            ))}
          </div>
        </PlatformPanel>

        <PlatformPanel title="Recent Platform Activity" icon={Activity} action="View all" className="activity-panel">
          <div className="platform-activity-list">
            {platformActivity.map((item) => (
              <article className="platform-activity-row" key={item.label}>
                <span className={`activity-dot super-tone-${item.tone}`} />
                <div><strong>{item.label}</strong><small>{item.detail}</small></div>
                <time>{item.time}</time>
              </article>
            ))}
          </div>
        </PlatformPanel>

        <PlatformPanel title="Top Workspaces by Usage" icon={Building2} action="View all" className="workspaces-panel">
          <div className="workspace-usage-list">
            {topWorkspaces.map((workspace) => (
              <article className="workspace-usage-row" key={workspace.name}>
                <b>{workspace.rank}</b>
                <div>
                  <strong>{workspace.name}</strong>
                  <small>{workspace.plan} / {workspace.members} members / {formatNumber(workspace.usage)} calls</small>
                  <div className="super-progress"><span className={`fill-${workspace.tone}`} style={{ width: `${workspace.progress}%` }} /></div>
                </div>
              </article>
            ))}
          </div>
        </PlatformPanel>

        <PlatformPanel title="Recent Subscription Changes" icon={ListChecks} action="View all" className="subscription-changes-panel">
          <div className="subscription-change-list">
            {subscriptionChanges.map((change) => (
              <article className="subscription-change-row" key={`${change.workspace}-${change.change}`}>
                <span className={`super-tone-${change.tone}`}>{change.change === 'Downgraded' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}</span>
                <div><strong>{change.workspace}</strong><small>{change.change} / {change.from} to {change.to}</small></div>
                <b>{change.amount}</b>
              </article>
            ))}
          </div>
        </PlatformPanel>

        <PlatformPanel title="Quick Actions" icon={ShieldCheck} className="quick-actions-panel">
          <div className="super-action-grid">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button type="button" className={`super-action super-tone-${action.tone}`} key={action.label}>
                  <Icon size={20} />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
          <div className="plan-strip">
            <span>Default enterprise template</span>
            <strong>{planName}</strong>
          </div>
        </PlatformPanel>
      </div>
    </section>
  )
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon
  const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight
  return (
    <article className="super-metric-card">
      <span className={`super-metric-icon super-tone-${metric.tone}`}><Icon size={22} /></span>
      <div>
        <small>{metric.label}</small>
        <strong>{metric.value}</strong>
        <p className={metric.trend === 'up' ? 'positive' : 'negative'}><TrendIcon size={14} /> {metric.delta}</p>
      </div>
    </article>
  )
}

function PlatformPanel({ title, icon: Icon, action, className, children }: {
  title: string
  icon: LucideIcon
  action?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`super-panel ${className ?? ''}`}>
      <header>
        <div><Icon size={18} /><h2>{title}</h2></div>
        {action ? <button type="button">{action}</button> : null}
      </header>
      {children}
    </section>
  )
}

function UsageKpi({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: Tone }) {
  return (
    <article className="usage-kpi">
      <span className={`super-tone-${tone}`}>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SA'
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
}


