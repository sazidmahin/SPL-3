import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Database,
  Eye,
  FileClock,
  Filter,
  Gauge,
  Globe2,
  KeyRound,
  LockKeyhole,
  MoreHorizontal,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCog,
  Users,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../../domains/auth/types'
import type { GenerationJob } from '../../domains/srs/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import './SuperAdminPlatformPages.css'

export type SuperAdminSection =
  | 'users'
  | 'workspaces'
  | 'plans'
  | 'subscriptions'
  | 'ai-jobs'
  | 'llm-calls'
  | 'platform-settings'
  | 'audit-logs'

type SuperAdminPlatformPageProps = {
  section: SuperAdminSection
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  generationJobs: GenerationJob[]
}

type Tone = 'violet' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate' | 'cyan'

const users = [
  { name: 'Sarah Johnson', email: 'sarah.johnson@innovate.io', role: 'Organization Owner', workspace: 'Innovate Labs', status: 'Active', joined: 'May 28, 2025', tone: 'emerald' as const },
  { name: 'Marcus Chen', email: 'marcus@nextgen.ai', role: 'Organization Admin', workspace: 'NextGen Analytics', status: 'Active', joined: 'May 26, 2025', tone: 'blue' as const },
  { name: 'Aven Wong', email: 'aven@brightpath.com', role: 'Member', workspace: 'BrightPath Solutions', status: 'Invited', joined: 'May 25, 2025', tone: 'amber' as const },
  { name: 'Jerin Mason', email: 'jerin@oldco.com', role: 'Viewer', workspace: 'OldCo Solutions', status: 'Suspended', joined: 'May 21, 2025', tone: 'rose' as const },
]

const workspaces = [
  { name: 'Innovate Labs', owner: 'Sarah Johnson', plan: 'Enterprise', members: 634, usage: '75,210', status: 'Active', tone: 'violet' as const },
  { name: 'NextGen Analytics', owner: 'Marcus Chen', plan: 'Enterprise', members: 275, usage: '67,432', status: 'Active', tone: 'blue' as const },
  { name: 'BrightPath Solutions', owner: 'Aven Wong', plan: 'Pro', members: 356, usage: '43,901', status: 'Active', tone: 'emerald' as const },
  { name: 'OldCo Solutions', owner: 'Jerin Mason', plan: 'Pro', members: 82, usage: '12,118', status: 'Suspended', tone: 'rose' as const },
]

const plans = [
  { name: 'Free', price: '$0', seats: '1 seat', credits: '100 credits', status: 'Public', subscribers: '2,184', tone: 'slate' as const },
  { name: 'Pro', price: '$29', seats: '10 seats', credits: '10,000 credits', status: 'Public', subscribers: '3,920', tone: 'blue' as const },
  { name: 'Growth', price: '$299', seats: '100 seats', credits: '250,000 credits', status: 'Public', subscribers: '862', tone: 'emerald' as const },
  { name: 'Enterprise', price: 'Custom', seats: 'Unlimited', credits: 'Custom quota', status: 'Sales-led', subscribers: '248', tone: 'violet' as const },
]

const subscriptions = [
  { org: 'NextGen Analytics', plan: 'Enterprise', status: 'Active', renewal: 'Jun 18, 2025', mrr: '$1,249', event: 'Upgraded', tone: 'emerald' as const },
  { org: 'TechFlow Inc', plan: 'Pro', status: 'Trial converting', renewal: 'Jun 03, 2025', mrr: '$299', event: 'New', tone: 'blue' as const },
  { org: 'OldCo Solutions', plan: 'Pro', status: 'Past due', renewal: 'May 31, 2025', mrr: '$299', event: 'Downgraded', tone: 'rose' as const },
  { org: 'Visionary Works', plan: 'Pro', status: 'Active', renewal: 'Jun 22, 2025', mrr: '$299', event: 'Renewed', tone: 'violet' as const },
]

const llmLogs = [
  { id: 'REQ-8841', workspace: 'Innovate Labs', model: 'gpt-4.1', tokens: '2.4M', latency: '3.4s', cost: '$8.24', status: 'Success', tone: 'emerald' as const },
  { id: 'REQ-8839', workspace: 'NextGen Analytics', model: 'gpt-4.1-mini', tokens: '841K', latency: '1.1s', cost: '$0.91', status: 'Success', tone: 'emerald' as const },
  { id: 'REQ-8832', workspace: 'BrightPath Solutions', model: 'diagram-v2', tokens: '320K', latency: '6.7s', cost: '$1.42', status: 'Timeout', tone: 'amber' as const },
  { id: 'REQ-8820', workspace: 'OldCo Solutions', model: 'gpt-4.1-mini', tokens: '94K', latency: '0.9s', cost: '$0.08', status: 'Blocked', tone: 'rose' as const },
]

const auditLogs = [
  { actor: 'admin@srsplatform.com', action: 'Updated platform rate limit', target: 'LLM Gateway', scope: 'System Control', time: '9 min ago', risk: 'Medium', tone: 'amber' as const },
  { actor: 'security@srsplatform.com', action: 'Reviewed failed admin sign-in', target: 'Admin Route', scope: 'Security', time: '31 min ago', risk: 'High', tone: 'rose' as const },
  { actor: 'ops@srsplatform.com', action: 'Changed enterprise plan quota', target: 'Enterprise Plan', scope: 'Plans', time: '1 hr ago', risk: 'Medium', tone: 'amber' as const },
  { actor: 'admin@srsplatform.com', action: 'Exported workspace usage report', target: 'Platform Data', scope: 'Compliance', time: '2 hrs ago', risk: 'Low', tone: 'emerald' as const },
]

const settings = [
  { title: 'General Settings', detail: 'Platform name, default locale, public signup and workspace defaults.', icon: Globe2, enabled: true, tone: 'blue' as const },
  { title: 'Security', detail: 'Admin MFA, session duration, invite expiry and IP allowlist policy.', icon: LockKeyhole, enabled: true, tone: 'rose' as const },
  { title: 'AI Model Routing', detail: 'Default model, fallback model, rate limits and retry windows.', icon: Bot, enabled: true, tone: 'violet' as const },
  { title: 'Integrations', detail: 'Billing provider, email delivery, observability and webhook endpoints.', icon: ServerCog, enabled: false, tone: 'slate' as const },
]

export function SuperAdminPlatformPage({ section, user, activeWorkspace, generationJobs }: SuperAdminPlatformPageProps) {
  const config = pageConfig[section]
  const Icon = config.icon

  return (
    <section className="super-section-page" id={section}>
      <PlatformTopbar user={user} workspaceName={activeWorkspace?.workspace.name ?? 'All Workspaces'} />

      <div className="super-section-title-row">
        <div>
          <span>{config.eyebrow}</span>
          <h1>{config.title}</h1>
        </div>
        <div className="super-section-action-group">
          <button type="button"><RefreshCw size={17} /> Refresh</button>
          <button type="button"><Icon size={17} /> {config.action}</button>
        </div>
      </div>

      {renderSection(section, generationJobs)}
    </section>
  )
}

const pageConfig: Record<SuperAdminSection, { title: string; eyebrow: string; action: string; icon: LucideIcon }> = {
  users: { title: 'Users', eyebrow: 'Review users, roles and status', action: 'Invite User', icon: UserCog },
  workspaces: { title: 'Workspaces', eyebrow: 'Review and manage all workspaces', action: 'Create Workspace', icon: Building2 },
  plans: { title: 'Plans', eyebrow: 'Manage platform plans and quotas', action: 'New Plan', icon: WalletCards },
  subscriptions: { title: 'Subscriptions', eyebrow: 'Monitor billing state and changes', action: 'Export Billing', icon: CreditCard },
  'ai-jobs': { title: 'AI Generation Jobs', eyebrow: 'Track AI job status and performance', action: 'View Queue', icon: Bot },
  'llm-calls': { title: 'LLM / API Call Logs', eyebrow: 'Inspect model usage, latency and cost', action: 'Export Logs', icon: Database },
  'platform-settings': { title: 'Platform Settings', eyebrow: 'Super admin only system controls', action: 'Save Policy', icon: ServerCog },
  'audit-logs': { title: 'Admin Audit Logs', eyebrow: 'Review admin actions and access logs', action: 'Export Audit', icon: FileClock },
}

function renderSection(section: SuperAdminSection, generationJobs: GenerationJob[]) {
  switch (section) {
    case 'users':
      return <UsersPage />
    case 'workspaces':
      return <WorkspacesPage />
    case 'plans':
      return <PlansPage />
    case 'subscriptions':
      return <SubscriptionsPage />
    case 'ai-jobs':
      return <AiJobsPage generationJobs={generationJobs} />
    case 'llm-calls':
      return <LlmCallsPage />
    case 'platform-settings':
      return <PlatformSettingsPage />
    case 'audit-logs':
      return <AuditLogsPage />
  }
}

function UsersPage() {
  return (
    <PageBody
      stats={[
        { label: 'Total Users', value: '12,845', detail: '248 new this month', icon: Users, tone: 'violet' },
        { label: 'Platform Admins', value: '326', detail: 'highest access users', icon: ShieldCheck, tone: 'blue' },
        { label: 'Active Members', value: '12,248', detail: '96.3% active', icon: CheckCircle2, tone: 'emerald' },
        { label: 'Suspended', value: '24', detail: 'security restricted', icon: Ban, tone: 'rose' },
      ]}
      tabs={['All Users', 'Admins', 'Organization Owners', 'Invited', 'Suspended']}
    >
      <SectionPanel title="User Directory" icon={Users} action="Filter">
        <Toolbar placeholder="Search user, email, role or workspace" />
        <div className="super-data-table users-table" role="table" aria-label="Platform users">
          <div className="super-table-head" role="row"><span>User</span><span>Role</span><span>Workspace</span><span>Status</span><span>Joined</span><span /></div>
          {users.map((item) => (
            <article className="super-table-row" role="row" key={item.email}>
              <span><Avatar name={item.name} tone={item.tone} /><b>{item.name}</b><small>{item.email}</small></span>
              <span>{item.role}</span>
              <span>{item.workspace}</span>
              <span><Status tone={item.tone}>{item.status}</Status></span>
              <span>{item.joined}</span>
              <span><IconButton icon={MoreHorizontal} label="User actions" /></span>
            </article>
          ))}
        </div>
      </SectionPanel>
    </PageBody>
  )
}

function WorkspacesPage() {
  return (
    <PageBody
      stats={[
        { label: 'Organizations', value: '1,243', detail: '98 added this month', icon: Building2, tone: 'violet' },
        { label: 'Workspaces', value: '842', detail: 'active platform tenants', icon: Database, tone: 'blue' },
        { label: 'Enterprise', value: '248', detail: 'custom contracts', icon: ShieldCheck, tone: 'emerald' },
        { label: 'Flagged', value: '18', detail: 'needs admin review', icon: AlertTriangle, tone: 'amber' },
      ]}
      tabs={['All Workspaces', 'Enterprise', 'Growth', 'Pro', 'Suspended']}
    >
      <SectionPanel title="Workspace Registry" icon={Building2} action="View all">
        <Toolbar placeholder="Search workspace, owner or plan" />
        <div className="super-data-table workspaces-table" role="table" aria-label="Platform workspaces">
          <div className="super-table-head" role="row"><span>Workspace</span><span>Owner</span><span>Plan</span><span>Members</span><span>LLM Calls</span><span>Status</span><span /></div>
          {workspaces.map((item) => (
            <article className="super-table-row" role="row" key={item.name}>
              <span><Avatar name={item.name} tone={item.tone} /><b>{item.name}</b><small>Organization workspace</small></span>
              <span>{item.owner}</span>
              <span>{item.plan}</span>
              <span>{item.members}</span>
              <span>{item.usage}</span>
              <span><Status tone={item.tone}>{item.status}</Status></span>
              <span><IconButton icon={Eye} label="Inspect workspace" /></span>
            </article>
          ))}
        </div>
      </SectionPanel>
    </PageBody>
  )
}

function PlansPage() {
  return (
    <PageBody
      stats={[
        { label: 'Plans', value: '4', detail: 'public and sales-led', icon: WalletCards, tone: 'violet' },
        { label: 'MRR', value: '$324,560', detail: '18.6% month over month', icon: CreditCard, tone: 'emerald' },
        { label: 'Plan Changes', value: '86', detail: 'this month', icon: ArrowUpRight, tone: 'blue' },
        { label: 'Draft Plans', value: '2', detail: 'not published', icon: SlidersHorizontal, tone: 'amber' },
      ]}
      tabs={['Plans', 'Pricing', 'Quotas', 'Feature Gates', 'Coupons']}
    >
      <SectionPanel title="Plan Configuration" icon={WalletCards} action="Manage">
        <div className="plan-management-grid">
          {plans.map((plan) => (
            <article className="plan-management-card" key={plan.name}>
              <div><span className={`super-status super-status-${plan.tone}`}>{plan.status}</span><h2>{plan.name}</h2><strong>{plan.price}<small>/month</small></strong></div>
              <p>{plan.seats} / {plan.credits}</p>
              <div className="plan-row"><span>Subscribers</span><b>{plan.subscribers}</b></div>
              <button type="button">Edit Plan</button>
            </article>
          ))}
        </div>
      </SectionPanel>
    </PageBody>
  )
}

function SubscriptionsPage() {
  return (
    <PageBody
      stats={[
        { label: 'Active Subscriptions', value: '6,214', detail: '15.4% up', icon: CreditCard, tone: 'blue' },
        { label: 'Monthly Revenue', value: '$324,560', detail: 'paid and pending', icon: WalletCards, tone: 'emerald' },
        { label: 'Past Due', value: '62', detail: 'needs billing follow-up', icon: AlertTriangle, tone: 'amber' },
        { label: 'Canceled', value: '18', detail: 'this month', icon: ArrowDownRight, tone: 'rose' },
      ]}
      tabs={['All Subscriptions', 'Active', 'Trial', 'Past Due', 'Canceled']}
    >
      <SectionPanel title="Subscription Ledger" icon={CreditCard} action="View all">
        <Toolbar placeholder="Search organization, plan or invoice" />
        <div className="super-data-table subscriptions-table" role="table" aria-label="Platform subscriptions">
          <div className="super-table-head" role="row"><span>Organization</span><span>Plan</span><span>Status</span><span>Renewal</span><span>MRR</span><span>Event</span><span /></div>
          {subscriptions.map((item) => (
            <article className="super-table-row" role="row" key={item.org}>
              <span><Avatar name={item.org} tone={item.tone} /><b>{item.org}</b><small>Billing account</small></span>
              <span>{item.plan}</span>
              <span><Status tone={item.tone}>{item.status}</Status></span>
              <span>{item.renewal}</span>
              <span>{item.mrr}</span>
              <span>{item.event}</span>
              <span><IconButton icon={MoreHorizontal} label="Subscription actions" /></span>
            </article>
          ))}
        </div>
      </SectionPanel>
    </PageBody>
  )
}

function AiJobsPage({ generationJobs }: { generationJobs: GenerationJob[] }) {
  const jobs = generationJobs.length > 0 ? generationJobs.map((job, index) => ({
    id: job.id,
    workspace: ['Innovate Labs', 'NextGen Analytics', 'BrightPath Solutions'][index % 3],
    type: job.job_type,
    progress: job.progress_percent,
    status: job.status,
    cost: index === 0 ? '$4.28' : '$0.92',
    tone: job.status === 'completed' ? 'emerald' as const : job.status === 'running' ? 'blue' as const : 'amber' as const,
  })) : [
    { id: 'JOB-9128', workspace: 'Innovate Labs', type: 'full', progress: 100, status: 'completed', cost: '$4.28', tone: 'emerald' as const },
    { id: 'JOB-9127', workspace: 'NextGen Analytics', type: 'class_diagram', progress: 72, status: 'running', cost: '$1.86', tone: 'blue' as const },
    { id: 'JOB-9122', workspace: 'BrightPath Solutions', type: 'srs', progress: 0, status: 'queued', cost: '$0.00', tone: 'amber' as const },
    { id: 'JOB-9119', workspace: 'OldCo Solutions', type: 'use_case', progress: 18, status: 'failed', cost: '$0.12', tone: 'rose' as const },
  ]

  return (
    <PageBody
      stats={[
        { label: 'Generation Jobs', value: '156', detail: '22.4% up', icon: Bot, tone: 'cyan' },
        { label: 'Completed', value: '124', detail: '79.5% success', icon: CheckCircle2, tone: 'emerald' },
        { label: 'Running', value: '18', detail: 'active workers', icon: RefreshCw, tone: 'blue' },
        { label: 'Failed', value: '14', detail: 'requires review', icon: AlertTriangle, tone: 'rose' },
      ]}
      tabs={['All Jobs', 'Running', 'Queued', 'Failed', 'Completed']}
    >
      <SectionPanel title="AI Job Monitor" icon={Bot} action="View all jobs">
        <Toolbar placeholder="Search job id, workspace or job type" />
        <div className="super-data-table jobs-table" role="table" aria-label="AI generation jobs">
          <div className="super-table-head" role="row"><span>Job</span><span>Workspace</span><span>Type</span><span>Status</span><span>Progress</span><span>Cost</span><span /></div>
          {jobs.map((job) => (
            <article className="super-table-row" role="row" key={job.id}>
              <span><Avatar name={job.id} tone={job.tone} /><b>{job.id}</b><small>Generation request</small></span>
              <span>{job.workspace}</span>
              <span>{job.type}</span>
              <span><Status tone={job.tone}>{job.status}</Status></span>
              <span><Progress value={job.progress} tone={job.tone} /></span>
              <span>{job.cost}</span>
              <span><IconButton icon={Eye} label="Inspect job" /></span>
            </article>
          ))}
        </div>
      </SectionPanel>
    </PageBody>
  )
}

function LlmCallsPage() {
  return (
    <PageBody
      stats={[
        { label: 'LLM Calls', value: '1.24M', detail: '8.67M tokens', icon: Sparkles, tone: 'violet' },
        { label: 'Success Rate', value: '99.27%', detail: '8.61M successful', icon: CheckCircle2, tone: 'emerald' },
        { label: 'Avg Latency', value: '1.56s', detail: 'p95 6.7s', icon: Gauge, tone: 'blue' },
        { label: 'Cost Today', value: '$9,784', detail: '62% budget used', icon: WalletCards, tone: 'amber' },
      ]}
      tabs={['All Logs', 'LLM Calls', 'API Calls', 'Timeouts', 'Cost Review']}
    >
      <SectionPanel title="LLM / API Call Logs" icon={Database} action="View all logs">
        <Toolbar placeholder="Search request id, model or workspace" />
        <div className="super-data-table llm-table" role="table" aria-label="LLM and API call logs">
          <div className="super-table-head" role="row"><span>Request</span><span>Workspace</span><span>Model</span><span>Tokens</span><span>Latency</span><span>Cost</span><span>Status</span></div>
          {llmLogs.map((item) => (
            <article className="super-table-row" role="row" key={item.id}>
              <span><Avatar name={item.id} tone={item.tone} /><b>{item.id}</b><small>API request</small></span>
              <span>{item.workspace}</span>
              <span>{item.model}</span>
              <span>{item.tokens}</span>
              <span>{item.latency}</span>
              <span>{item.cost}</span>
              <span><Status tone={item.tone}>{item.status}</Status></span>
            </article>
          ))}
        </div>
      </SectionPanel>
    </PageBody>
  )
}

function PlatformSettingsPage() {
  return (
    <PageBody
      stats={[
        { label: 'System Control', value: '8', detail: 'policy groups', icon: ServerCog, tone: 'slate' },
        { label: 'Security', value: 'On', detail: 'admin MFA enforced', icon: LockKeyhole, tone: 'rose' },
        { label: 'Models', value: '4', detail: 'active routing rules', icon: Bot, tone: 'violet' },
        { label: 'Integrations', value: '6', detail: 'connected services', icon: KeyRound, tone: 'blue' },
      ]}
      tabs={['General', 'Security', 'AI Models', 'Billing', 'Integrations']}
    >
      <div className="settings-grid">
        {settings.map((item) => {
          const Icon = item.icon
          return (
            <SectionPanel title={item.title} icon={Icon} action={item.enabled ? 'Enabled' : 'Configure'} key={item.title}>
              <div className="setting-card-body">
                <span className={`setting-icon super-status-${item.tone}`}><Icon size={22} /></span>
                <p>{item.detail}</p>
                <label className="super-toggle"><input type="checkbox" defaultChecked={item.enabled} /><span /></label>
              </div>
            </SectionPanel>
          )
        })}
      </div>
    </PageBody>
  )
}

function AuditLogsPage() {
  return (
    <PageBody
      stats={[
        { label: 'Audit Entries', value: '9,682', detail: 'retained for compliance', icon: FileClock, tone: 'violet' },
        { label: 'Security Events', value: '706', detail: 'last 30 days', icon: ShieldCheck, tone: 'rose' },
        { label: 'Policy Changes', value: '84', detail: 'admin controlled', icon: SlidersHorizontal, tone: 'blue' },
        { label: 'Exports', value: '19', detail: 'compliance reports', icon: Database, tone: 'emerald' },
      ]}
      tabs={['All Audit Logs', 'Security', 'Billing', 'Settings', 'Exports']}
    >
      <SectionPanel title="Admin Audit Trail" icon={FileClock} action="View all">
        <Toolbar placeholder="Search actor, target or action" />
        <div className="super-data-table audit-table" role="table" aria-label="Admin audit logs">
          <div className="super-table-head" role="row"><span>Actor</span><span>Action</span><span>Target</span><span>Scope</span><span>Time</span><span>Risk</span><span /></div>
          {auditLogs.map((item) => (
            <article className="super-table-row" role="row" key={`${item.actor}-${item.action}`}>
              <span><Avatar name={item.actor} tone={item.tone} /><b>{item.actor}</b><small>Super admin route</small></span>
              <span>{item.action}</span>
              <span>{item.target}</span>
              <span>{item.scope}</span>
              <span>{item.time}</span>
              <span><Status tone={item.tone}>{item.risk}</Status></span>
              <span><IconButton icon={Eye} label="Review audit event" /></span>
            </article>
          ))}
        </div>
      </SectionPanel>
    </PageBody>
  )
}

function PlatformTopbar({ user, workspaceName }: { user: AuthUser; workspaceName: string }) {
  return (
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
        <button type="button" aria-label="Platform settings"><ServerCog size={19} /></button>
        <div className="super-admin-user">
          <span>{initials(user.full_name)}</span>
          <div><strong>{user.full_name}</strong><small>Super Admin</small></div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  )
}

function PageBody({ stats, tabs, children }: {
  stats: Array<{ label: string; value: string; detail: string; icon: LucideIcon; tone: Tone }>
  tabs: string[]
  children: ReactNode
}) {
  return (
    <>
      <div className="super-section-stats">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <article className="super-section-stat" key={stat.label}>
              <span className={`super-status-${stat.tone}`}><Icon size={21} /></span>
              <div><small>{stat.label}</small><strong>{stat.value}</strong><p>{stat.detail}</p></div>
            </article>
          )
        })}
      </div>
      <div className="super-page-tabs" role="tablist" aria-label="Platform section filters">
        {tabs.map((tab, index) => <button className={index === 0 ? 'active' : undefined} type="button" key={tab}>{tab}</button>)}
      </div>
      {children}
    </>
  )
}

function SectionPanel({ title, icon: Icon, action, children }: {
  title: string
  icon: LucideIcon
  action?: string
  children: ReactNode
}) {
  return (
    <section className="super-section-panel">
      <header>
        <div><Icon size={18} /><h2>{title}</h2></div>
        {action ? <button type="button">{action}</button> : null}
      </header>
      {children}
    </section>
  )
}

function Toolbar({ placeholder }: { placeholder: string }) {
  return (
    <div className="super-table-toolbar">
      <label><Search size={17} /><span>{placeholder}</span></label>
      <button type="button"><Filter size={17} /> Filters</button>
    </div>
  )
}

function Avatar({ name, tone }: { name: string; tone: Tone }) {
  return <i className={`super-avatar super-status-${tone}`}>{initials(name)}</i>
}

function Status({ tone, children }: { tone: Tone; children: string }) {
  return <b className={`super-status super-status-${tone}`}>{children}</b>
}

function Progress({ value, tone }: { value: number; tone: Tone }) {
  return <div className="super-inline-progress"><span className={`super-fill-${tone}`} style={{ width: `${Math.min(100, value)}%` }} /><b>{value}%</b></div>
}

function IconButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return <button className="super-icon-button" type="button" aria-label={label}><Icon size={18} /></button>
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SA'
}

