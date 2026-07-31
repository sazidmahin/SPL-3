import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileClock,
  FileText,
  Gift,
  Filter,
  Gauge,
  Globe2,
  KeyRound,
  LockKeyhole,
  MoreHorizontal,
  PauseCircle,
  Send,
  Plus,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
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
  { name: 'Super Admin', email: 'superadmin@srs.com', role: 'Super Admin', workspace: 'Platform', status: 'Active', lastActive: '2m ago', joined: 'Jan 1, 2024', avatar: 'SA', tone: 'violet' as const },
  { name: 'Jane Smith', email: 'jane.smith@acmecorp.com', role: 'Org Admin', workspace: 'Acme Corp', status: 'Active', lastActive: '15m ago', joined: 'Mar 12, 2024', avatar: 'JS', tone: 'blue' as const },
  { name: 'Robert Johnson', email: 'robert.j@globex.com', role: 'Org Admin', workspace: 'Globex Inc.', status: 'Active', lastActive: '1h ago', joined: 'Jan 18, 2024', avatar: 'RJ', tone: 'blue' as const },
  { name: 'Emily Chen', email: 'emily.chen@initech.com', role: 'Org Member', workspace: 'Initech', status: 'Active', lastActive: '2h ago', joined: 'Apr 2, 2024', avatar: 'EC', tone: 'cyan' as const },
  { name: 'Michael Brown', email: 'michael.b@soylent.com', role: 'Org Member', workspace: 'Soylent Corp', status: 'Pending', lastActive: '-', joined: 'May 20, 2024', avatar: 'MB', tone: 'amber' as const },
  { name: 'Sarah Davis', email: 'sarah.d@umbrella.com', role: 'Org Admin', workspace: 'Umbrella Corp', status: 'Active', lastActive: '3h ago', joined: 'Feb 28, 2024', avatar: 'SD', tone: 'blue' as const },
  { name: 'David Wilson', email: 'david.w@starkindustries.com', role: 'Org Member', workspace: 'Stark Industries', status: 'Suspended', lastActive: '2d ago', joined: 'Nov 11, 2023', avatar: 'DW', tone: 'rose' as const },
  { name: 'Lisa Martinez', email: 'lisa.m@wayneenterprises.com', role: 'Org Member', workspace: 'Wayne Enterprises', status: 'Active', lastActive: '5m ago', joined: 'Apr 5, 2024', avatar: 'LM', tone: 'cyan' as const },
  { name: 'James Taylor', email: 'james.t@hooli.com', role: 'Org Admin', workspace: 'Hooli', status: 'Active', lastActive: '30m ago', joined: 'Jan 29, 2024', avatar: 'JT', tone: 'blue' as const },
  { name: 'Jennifer Lee', email: 'jennifer.lee@cyberdyne.com', role: 'Org Member', workspace: 'Cyberdyne Systems', status: 'Pending', lastActive: '-', joined: 'May 22, 2024', avatar: 'JL', tone: 'amber' as const },
]

const roleDistribution = [
  { name: 'Super Admin', value: 12, share: '0.1%', color: '#6335f5' },
  { name: 'Org Admin', value: 1245, share: '9.7%', color: '#4a9cff' },
  { name: 'Org Member', value: 10890, share: '84.9%', color: '#45c4b8' },
  { name: 'Pending', value: 412, share: '3.2%', color: '#ffb22d' },
  { name: 'Suspended', value: 246, share: '1.9%', color: '#ef476f' },
]

const recentInvitations = [
  { name: 'Michael Brown', email: 'michael.b@soylent.com', role: 'Org Member', status: 'Pending', invited: 'Invited 3h ago', avatar: 'MB', tone: 'cyan' as const },
  { name: 'Jennifer Lee', email: 'jennifer.lee@cyberdyne.com', role: 'Org Member', status: 'Pending', invited: 'Invited 6h ago', avatar: 'JL', tone: 'blue' as const },
  { name: 'Alex Parker', email: 'alex.p@starkindustries.com', role: 'Org Member', status: 'Pending', invited: 'Invited 1d ago', avatar: 'AP', tone: 'violet' as const },
]

const accountOverview = [
  { label: 'Email Verified', value: '11,982 (93.3%)', icon: CheckCircle2, tone: 'emerald' as const },
  { label: 'MFA Enabled', value: '9,104 (70.9%)', icon: ShieldCheck, tone: 'emerald' as const },
  { label: 'Pending Invitations', value: '412 (3.2%)', icon: RefreshCw, tone: 'slate' as const },
  { label: 'Suspended Accounts', value: '246 (1.9%)', icon: AlertTriangle, tone: 'rose' as const },
]

const recentUserEvents = [
  { label: 'David Wilson was suspended', time: '2 hours ago', icon: AlertTriangle, tone: 'rose' as const },
  { label: 'Michael Brown invited', time: '3 hours ago', icon: UserPlus, tone: 'emerald' as const },
  { label: 'Lisa Martinez role updated', time: '5 hours ago', icon: ShieldCheck, tone: 'cyan' as const },
  { label: 'Jennifer Lee invited', time: '6 hours ago', icon: UserCog, tone: 'blue' as const },
  { label: 'Robert Johnson updated profile', time: '7 hours ago', icon: UserCheck, tone: 'blue' as const },
]

const userQuickActions = [
  { label: 'Invite User', detail: 'Send invitation to new user', icon: UserPlus },
  { label: 'Review Suspended Accounts', detail: 'Manage suspended user accounts', icon: PauseCircle },
  { label: 'Manage Roles', detail: 'Create and edit user roles', icon: ShieldCheck },
  { label: 'Export Users', detail: 'Download users list', icon: Download },
]
const workspaces = [
  { name: 'Acme Corp Workspace', slug: 'acme-corp', type: 'Organization', owner: 'Jane Smith', ownerAvatar: 'JS', ownerTone: 'blue' as const, members: 24, plan: 'Enterprise', usagePercent: 78, usage: '7.8M / 10M credits', status: 'Active', created: 'Jan 1, 2024', lastActivity: '2 minutes ago', id: 'ws_acme_1234567890', tone: 'violet' as const },
  { name: 'Globex Operations', slug: 'globex-ops', type: 'Organization', owner: 'Robert Johnson', ownerAvatar: 'RJ', ownerTone: 'blue' as const, members: 18, plan: 'Pro', usagePercent: 56, usage: '5.6M / 10M credits', status: 'Active', created: 'Jan 18, 2024', lastActivity: '15 minutes ago', id: 'ws_globex_2234567890', tone: 'blue' as const },
  { name: 'Stark Industries AI', slug: 'stark-ai', type: 'Organization', owner: 'Tony Stark', ownerAvatar: 'TS', ownerTone: 'slate' as const, members: 31, plan: 'Enterprise', usagePercent: 92, usage: '9.2M / 10M credits', status: 'Active', created: 'Feb 5, 2024', lastActivity: '28 minutes ago', id: 'ws_stark_3234567890', tone: 'blue' as const },
  { name: 'Wayne Enterprises', slug: 'wayne-ent', type: 'Organization', owner: 'Bruce Wayne', ownerAvatar: 'BW', ownerTone: 'cyan' as const, members: 12, plan: 'Pro', usagePercent: 42, usage: '4.2M / 10M credits', status: 'Trial', created: 'Mar 12, 2024', lastActivity: '1 hour ago', id: 'ws_wayne_4234567890', tone: 'blue' as const },
  { name: 'Cyberdyne Systems', slug: 'cyberdyne', type: 'Organization', owner: 'Jennifer Lee', ownerAvatar: 'JL', ownerTone: 'rose' as const, members: 9, plan: 'Starter', usagePercent: 18, usage: '1.8M / 10M credits', status: 'Active', created: 'Apr 2, 2024', lastActivity: '1 hour ago', id: 'ws_cyberdyne_5234567890', tone: 'violet' as const },
  { name: 'Umbrella Research', slug: 'umbrella-research', type: 'Organization', owner: 'Alice Johnson', ownerAvatar: 'AJ', ownerTone: 'rose' as const, members: 15, plan: 'Pro', usagePercent: 71, usage: '7.1M / 10M credits', status: 'Past Due', created: 'Apr 20, 2024', lastActivity: '2 hours ago', id: 'ws_umbrella_6234567890', tone: 'violet' as const },
  { name: 'Personal Workspace', slug: 'personal-jones', type: 'Personal', owner: 'Michael Brown', ownerAvatar: 'MB', ownerTone: 'emerald' as const, members: 1, plan: 'Free', usagePercent: 33, usage: '330 / 1K credits', status: 'Active', created: 'Feb 10, 2024', lastActivity: '3 hours ago', id: 'ws_personal_7234567890', tone: 'violet' as const },
  { name: 'Sam Wilson Workspace', slug: 'sam-wilson', type: 'Personal', owner: 'Sam Wilson', ownerAvatar: 'SW', ownerTone: 'blue' as const, members: 1, plan: 'Free', usagePercent: 12, usage: '120 / 1K credits', status: 'Active', created: 'Mar 1, 2024', lastActivity: '4 hours ago', id: 'ws_sam_8234567890', tone: 'violet' as const },
  { name: 'Data Science Projects', slug: 'ds-projects', type: 'Personal', owner: 'Emily Zhang', ownerAvatar: 'EZ', ownerTone: 'cyan' as const, members: 1, plan: 'Starter', usagePercent: 64, usage: '640 / 1K credits', status: 'Trial', created: 'May 5, 2024', lastActivity: '5 hours ago', id: 'ws_ds_9234567890', tone: 'violet' as const },
  { name: 'AI Experiment Lab', slug: 'ai-experiment-lab', type: 'Personal', owner: 'David Wilson', ownerAvatar: 'DW', ownerTone: 'rose' as const, members: 1, plan: 'Free', usagePercent: 8, usage: '80 / 1K credits', status: 'Suspended', created: 'May 12, 2024', lastActivity: '2 days ago', id: 'ws_lab_1034567890', tone: 'violet' as const },
]

const workspacePlanDistribution = [
  { name: 'Enterprise', value: 342, share: '26.6%', color: '#6335f5' },
  { name: 'Pro', value: 418, share: '32.5%', color: '#4a9cff' },
  { name: 'Starter', value: 276, share: '21.5%', color: '#45c4b8' },
  { name: 'Free', value: 205, share: '15.9%', color: '#ffb22d' },
  { name: 'Trial', value: 44, share: '3.5%', color: '#cbd5e1' },
]

const workspaceHealth = [
  { label: 'Active Workspaces', value: '1,239 (96.4%)', tone: 'emerald' as const },
  { label: 'Trial Workspaces', value: '44 (3.4%)', tone: 'blue' as const },
  { label: 'Past Due', value: '21 (1.6%)', tone: 'amber' as const },
  { label: 'Suspended', value: '46 (3.6%)', tone: 'rose' as const },
]

const workspaceActivity = [
  { label: 'New workspace "Data Analytics Hub" created by Sarah Davis', time: '2m ago', icon: CheckCircle2, tone: 'emerald' as const },
  { label: 'Workspace "Umbrella Research" plan changed from Starter to Pro', time: '15m ago', icon: Users, tone: 'blue' as const },
  { label: 'Workspace "AI Experiment Lab" suspended by Super Admin', time: '28m ago', icon: AlertTriangle, tone: 'rose' as const },
  { label: 'Jane Smith added 3 members to "Acme Corp Workspace"', time: '1h ago', icon: UserPlus, tone: 'blue' as const },
  { label: 'Payment failed for "Globex Operations"', time: '2h ago', icon: AlertTriangle, tone: 'rose' as const },
]

const workspaceQuickActions = [
  { label: 'Review Suspended Workspaces', detail: 'Check and manage suspended workspaces', icon: PauseCircle },
  { label: 'Manage Plans', detail: 'Create and manage workspace plans', icon: WalletCards },
  { label: 'View Billing Issues', detail: 'Review past due and billing problems', icon: CreditCard },
  { label: 'Export Workspace List', detail: 'Download workspace data', icon: Download },
]
const plans = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    price: '$0',
    cadence: 'Forever',
    badge: 'Default',
    icon: Gift,
    tone: 'emerald' as const,
    features: ['AI Generation (5/mo)', '1 Workspace', 'Basic Export'],
    limits: ['AI Generations: 5 / month', 'Projects: 3', 'Storage: 100 MB'],
    subscriptions: '356',
    share: '28.6% of total',
    status: 'Active',
  },
  {
    name: 'Basic',
    description: 'For individuals and hobbyists',
    price: '$9.99',
    cadence: 'Per month',
    icon: Send,
    tone: 'blue' as const,
    features: ['AI Generation (50/mo)', '5 Workspaces', 'Export to PDF'],
    limits: ['AI Generations: 50 / month', 'Projects: 25', 'Storage: 1 GB'],
    subscriptions: '542',
    share: '43.6% of total',
    status: 'Active',
  },
  {
    name: 'Pro',
    description: 'For professionals and teams',
    price: '$29.99',
    cadence: 'Per month',
    badge: 'Popular',
    icon: Star,
    tone: 'violet' as const,
    features: ['AI Generation (200/mo)', 'Unlimited Workspaces', 'All Export Options'],
    limits: ['AI Generations: 200 / month', 'Projects: Unlimited', 'Storage: 10 GB'],
    subscriptions: '298',
    share: '23.9% of total',
    status: 'Active',
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    price: 'Custom',
    cadence: 'Contact Sales',
    icon: Building2,
    tone: 'amber' as const,
    features: ['Unlimited AI', 'SSO & SAML', 'Priority Support'],
    limits: ['AI Generations: Unlimited', 'Projects: Unlimited', 'Storage: Custom'],
    subscriptions: '52',
    share: '4.2% of total',
    status: 'Active',
  },
]

const planComparisonRows = [
  { feature: 'AI Generations / Month', free: '5', basic: '50', pro: '200', enterprise: 'Unlimited' },
  { feature: 'Workspaces', free: '1', basic: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Storage', free: '100 MB', basic: '1 GB', pro: '10 GB', enterprise: 'Custom' },
  { feature: 'Exports', free: 'Basic', basic: 'PDF', pro: 'PDF, DOCX, Markdown', enterprise: 'All formats' },
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
          {section === 'plans' ? <button type="button"><Users size={17} /> View Subscriptions</button> : <button type="button"><RefreshCw size={17} /> Refresh</button>}
          <button type="button"><Icon size={17} /> {config.action}</button>
        </div>
      </div>

      {renderSection(section, generationJobs)}
    </section>
  )
}

const pageConfig: Record<SuperAdminSection, { title: string; eyebrow: string; action: string; icon: LucideIcon }> = {
  users: { title: 'Users', eyebrow: 'Review users, roles and status', action: 'Invite User', icon: UserCog },
  workspaces: { title: 'Workspaces Management', eyebrow: 'Manage personal and organization workspaces, ownership, plans, and access.', action: 'Create Workspace', icon: Building2 },
  plans: { title: 'Plans & Subscriptions', eyebrow: 'Create and manage pricing plans, features, and limits for your platform.', action: 'Create New Plan', icon: FileText },
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
  const selectedUser = users[0]

  return (
    <section className="platform-users-page">
      <div className="users-filter-row">
        <label><Search size={18} /><span>Search by name or email...</span></label>
        <button type="button">All Roles <ChevronDown size={16} /></button>
        <button type="button">All Statuses <ChevronDown size={16} /></button>
        <button type="button"><Filter size={16} /> Filters</button>
        <button className="users-add-button" type="button"><Plus size={18} /> Add User</button>
      </div>

      <div className="users-kpi-row">
        <UserMetric icon={Users} label="Total Users" value="12,842" delta="8.4%" compare="vs last 30 days" tone="violet" />
        <UserMetric icon={UserCheck} label="Active Users" value="11,032" delta="7.1%" compare="vs last 30 days" tone="blue" />
        <UserMetric icon={UserX} label="Suspended Users" value="246" delta="3.2%" compare="vs last 30 days" tone="rose" negative />
        <UserMetric icon={UserPlus} label="New This Month" value="412" delta="12.6%" compare="vs last month" tone="emerald" />
      </div>

      <div className="users-management-grid">
        <section className="users-table-card">
          <header><h2>Users <span>(12,842)</span></h2></header>
          <div className="users-table" role="table" aria-label="Users management table">
            <div className="users-table-head" role="row">
              <span>Name</span><span>Email</span><span>Role</span><span>Workspace Type</span><span>Status</span><span>Last Active</span><span>Joined Date</span><span>Actions</span>
            </div>
            {users.map((item) => (
              <article className="users-table-row" role="row" key={item.email}>
                <span><UserAvatar label={item.avatar} tone={item.tone} /><strong>{item.name}</strong></span>
                <span>{item.email}</span>
                <span><UserPill tone={item.role === 'Super Admin' ? 'violet' : item.role === 'Org Admin' ? 'blue' : 'cyan'}>{item.role}</UserPill></span>
                <span>{item.workspace}</span>
                <span><UserPill tone={item.status === 'Active' ? 'emerald' : item.status === 'Pending' ? 'amber' : 'rose'}>{item.status}</UserPill></span>
                <span>{item.lastActive !== '-' ? <i /> : null}{item.lastActive}</span>
                <span>{item.joined}</span>
                <span className="users-action-cell">
                  <IconButton icon={Eye} label="View user" />
                  <IconButton icon={item.status === 'Suspended' ? RefreshCw : Edit3} label="Edit user" />
                  <IconButton icon={MoreHorizontal} label="More user actions" />
                </span>
              </article>
            ))}
          </div>
          <footer className="users-table-footer">
            <span>Showing 1 to 10 of 12,842 users</span>
            <nav aria-label="Users pagination"><button type="button">&lt;</button><button type="button">&lt;</button><button className="active" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">4</button><button type="button">5</button><span>...</span><button type="button">1,285</button><button type="button">&gt;</button></nav>
            <button type="button">10 / page <ChevronDown size={15} /></button>
          </footer>
        </section>

        <aside className="users-side-stack">
          <section className="selected-user-card">
            <header><h2>Selected User Details</h2><button type="button" aria-label="Close details">x</button></header>
            <div className="selected-user-head">
              <UserAvatar label={selectedUser.avatar} tone="violet" large />
              <div><strong>{selectedUser.name}</strong><small>{selectedUser.email}</small></div>
              <UserPill tone="emerald">Active</UserPill>
            </div>
            <dl>
              <div><dt>Role</dt><dd><b>Super Admin</b></dd></div>
              <div><dt>Workspace</dt><dd>Platform</dd></div>
              <div><dt>Joined Date</dt><dd>Jan 1, 2024</dd></div>
              <div><dt>Last Active</dt><dd><i />2m ago</dd></div>
              <div><dt>MFA Status</dt><dd><CheckCircle2 size={15} /> Enabled</dd></div>
            </dl>
            <button className="view-profile-button" type="button">View Full Profile <ExternalLink size={15} /></button>
          </section>

          <section className="role-distribution-card">
            <h2>Role Distribution</h2>
            <div className="role-distribution-body">
              <div className="role-donut">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={roleDistribution} dataKey="value" innerRadius={58} outerRadius={86} stroke="none">
                      {roleDistribution.map((role) => <Cell fill={role.color} key={role.name} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div><strong>12,842</strong><span>Total</span></div>
              </div>
              <div className="role-legend">
                {roleDistribution.map((role) => <p key={role.name}><i style={{ background: role.color }} /><span>{role.name}</span><strong>{role.value.toLocaleString()} ({role.share})</strong></p>)}
              </div>
            </div>
            <a href="#roles-permissions">View all roles <ChevronDown size={15} /></a>
          </section>
        </aside>
      </div>

      <div className="users-lower-grid">
        <UsersInfoCard title="Recent Invitations" action="View all">
          {recentInvitations.map((invite) => (
            <article className="invitation-row" key={invite.email}>
              <UserAvatar label={invite.avatar} tone={invite.tone} />
              <div><strong>{invite.name}</strong><small>{invite.email}</small></div>
              <UserPill tone="blue">{invite.role}</UserPill>
              <UserPill tone="amber">{invite.status}</UserPill>
              <time>{invite.invited}</time>
              <MoreHorizontal size={16} />
            </article>
          ))}
        </UsersInfoCard>

        <UsersInfoCard title="Account Overview">
          {accountOverview.map((item) => {
            const Icon = item.icon
            return <article className="account-row" key={item.label}><span className={`user-soft-${item.tone}`}><Icon size={16} /></span><strong>{item.label}</strong><em>{item.value}</em></article>
          })}
        </UsersInfoCard>

        <UsersInfoCard title="Recent User Events" action="View all">
          {recentUserEvents.map((event) => {
            const Icon = event.icon
            return <article className="user-event-row" key={event.label}><span className={`user-soft-${event.tone}`}><Icon size={15} /></span><strong>{event.label}</strong><time>{event.time}</time></article>
          })}
        </UsersInfoCard>
      </div>

      <section className="users-quick-actions">
        <h2>Quick Actions</h2>
        <div>
          {userQuickActions.map((action) => {
            const Icon = action.icon
            return <button type="button" key={action.label}><span><Icon size={21} /></span><div><strong>{action.label}</strong><small>{action.detail}</small></div><ChevronDown size={17} /></button>
          })}
        </div>
      </section>
    </section>
  )
}

function UserMetric({ icon: Icon, label, value, delta, compare, tone, negative = false }: { icon: LucideIcon; label: string; value: string; delta: string; compare: string; tone: Tone; negative?: boolean }) {
  return <article className="users-kpi-card"><span className={`user-soft-${tone}`}><Icon size={28} /></span><div><small>{label}</small><strong>{value}</strong><p className={negative ? 'negative' : undefined}>{negative ? '?' : '?'} {delta} <em>{compare}</em></p></div></article>
}

function UserAvatar({ label, tone, large = false }: { label: string; tone: Tone; large?: boolean }) {
  return <i className={`user-avatar user-avatar-${tone} ${large ? 'large' : ''}`}>{label}</i>
}

function UserPill({ tone, children }: { tone: Tone; children: string }) {
  return <b className={`user-pill user-pill-${tone}`}>{children}</b>
}

function UsersInfoCard({ title, action, children }: { title: string; action?: string; children: ReactNode }) {
  return <section className="users-info-card"><header><h2>{title}</h2>{action ? <a href="#users">{action}</a> : null}</header><div>{children}</div></section>
}
function WorkspacesPage() {
  const selectedWorkspace = workspaces[0]

  return (
    <section className="platform-workspaces-page">
      <div className="users-filter-row workspace-filter-row">
        <label><Search size={18} /><span>Search by workspace name or owner...</span></label>
        <button type="button">All Types <ChevronDown size={16} /></button>
        <button type="button">All Statuses <ChevronDown size={16} /></button>
        <button type="button">All Plans <ChevronDown size={16} /></button>
        <button type="button"><Filter size={16} /> Filters</button>
        <button className="users-add-button" type="button"><Plus size={18} /> Create Workspace</button>
      </div>

      <div className="users-kpi-row workspace-kpi-row">
        <UserMetric icon={Building2} label="Total Workspaces" value="1,285" delta="8.4%" compare="vs last 30 days" tone="violet" />
        <UserMetric icon={Database} label="Organization Workspaces" value="842" delta="6.7%" compare="vs last 30 days" tone="blue" />
        <UserMetric icon={UserCheck} label="Personal Workspaces" value="443" delta="9.1%" compare="vs last 30 days" tone="emerald" />
        <UserMetric icon={UserX} label="Suspended Workspaces" value="46" delta="12.3%" compare="vs last 30 days" tone="rose" negative />
      </div>

      <div className="workspace-management-grid">
        <section className="users-table-card workspace-table-card">
          <header>
            <h2>Workspaces</h2>
            <div className="workspace-table-actions"><button type="button"><Download size={16} /> Export</button><IconButton icon={MoreHorizontal} label="More workspace table actions" /></div>
          </header>
          <div className="users-table workspace-table" role="table" aria-label="Workspace management table">
            <div className="users-table-head workspace-table-head" role="row">
              <span>Workspace Name</span><span>Type</span><span>Owner</span><span>Members</span><span>Plan</span><span>Usage</span><span>Status</span><span>Created Date</span><span>Actions</span>
            </div>
            {workspaces.map((item) => (
              <article className="users-table-row workspace-table-row" role="row" key={item.id}>
                <span><span className={`workspace-icon-badge user-soft-${item.tone}`}><Building2 size={16} /></span><span><strong>{item.name}</strong><small>{item.slug}</small></span></span>
                <span><UserPill tone={item.type === 'Personal' ? 'violet' : 'blue'}>{item.type}</UserPill></span>
                <span><UserAvatar label={item.ownerAvatar} tone={item.ownerTone} /> {item.owner}</span>
                <span><Users size={14} /> {item.members}</span>
                <span>{item.plan}</span>
                <span><WorkspaceUsageBar value={item.usagePercent} /></span>
                <span><UserPill tone={workspaceStatusTone(item.status)}>{item.status}</UserPill></span>
                <span>{item.created}</span>
                <span className="users-action-cell"><IconButton icon={MoreHorizontal} label="Workspace actions" /></span>
              </article>
            ))}
          </div>
          <footer className="users-table-footer">
            <span>Showing 1 to 10 of 1,285 workspaces</span>
            <nav aria-label="Workspaces pagination"><button type="button">&lt;</button><button className="active" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">4</button><button type="button">5</button><span>...</span><button type="button">129</button><button type="button">&gt;</button></nav>
            <button type="button">10 / page <ChevronDown size={15} /></button>
          </footer>
        </section>

        <aside className="selected-workspace-card">
          <header><h2>Selected Workspace Details</h2><button type="button" aria-label="Close workspace details">x</button></header>
          <div className="selected-user-head selected-workspace-head">
            <span className="workspace-selected-icon"><Building2 size={28} /></span>
            <div><strong>{selectedWorkspace.name}</strong><small>{selectedWorkspace.slug}</small></div>
            <UserPill tone="emerald">Active</UserPill>
          </div>
          <dl>
            <div><dt><Database size={15} /> Type</dt><dd>{selectedWorkspace.type}</dd></div>
            <div><dt><UserCheck size={15} /> Owner</dt><dd><UserAvatar label={selectedWorkspace.ownerAvatar} tone={selectedWorkspace.ownerTone} /> {selectedWorkspace.owner}</dd></div>
            <div><dt><Users size={15} /> Members</dt><dd>{selectedWorkspace.members} members</dd></div>
            <div><dt><WalletCards size={15} /> Plan</dt><dd>{selectedWorkspace.plan}</dd></div>
            <div><dt><CheckCircle2 size={15} /> Billing Status</dt><dd>Active</dd></div>
            <div><dt><Gauge size={15} /> Usage</dt><dd><span>{selectedWorkspace.usagePercent}% ({selectedWorkspace.usage})</span><WorkspaceUsageBar value={selectedWorkspace.usagePercent} /></dd></div>
            <div><dt><RefreshCw size={15} /> Last Activity</dt><dd>{selectedWorkspace.lastActivity}</dd></div>
            <div><dt><FileClock size={15} /> Created Date</dt><dd>{selectedWorkspace.created}</dd></div>
            <div><dt><Globe2 size={15} /> Workspace ID</dt><dd>{selectedWorkspace.id}</dd></div>
          </dl>
          <button className="view-profile-button" type="button">View Full Workspace <ExternalLink size={15} /></button>
          <div className="workspace-detail-actions"><button type="button"><PauseCircle size={16} /> Suspend Workspace</button><button type="button"><CreditCard size={16} /> Open Billing</button></div>
        </aside>
      </div>

      <div className="workspace-lower-grid">
        <UsersInfoCard title="Recent Workspace Activity" action="View all">
          {workspaceActivity.map((event) => {
            const Icon = event.icon
            return <article className="user-event-row workspace-event-row" key={event.label}><span className={`user-soft-${event.tone}`}><Icon size={15} /></span><strong>{event.label}</strong><time>{event.time}</time></article>
          })}
        </UsersInfoCard>

        <section className="role-distribution-card workspace-plan-card">
          <h2>Plan Distribution</h2>
          <div className="role-distribution-body workspace-plan-body">
            <div className="role-donut">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={workspacePlanDistribution} dataKey="value" innerRadius={58} outerRadius={86} stroke="none">
                    {workspacePlanDistribution.map((plan) => <Cell fill={plan.color} key={plan.name} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div><strong>1,285</strong><span>Total</span></div>
            </div>
            <div className="role-legend">
              {workspacePlanDistribution.map((plan) => <p key={plan.name}><i style={{ background: plan.color }} /><span>{plan.name}</span><strong>{plan.value.toLocaleString()} ({plan.share})</strong></p>)}
            </div>
          </div>
          <a href="#plans">View all plans <ChevronDown size={15} /></a>
        </section>

        <UsersInfoCard title="Workspace Health">
          {workspaceHealth.map((item) => <article className="account-row workspace-health-row" key={item.label}><span className={`workspace-dot user-soft-${item.tone}`} /><strong>{item.label}</strong><em>{item.value}</em></article>)}
          <a className="workspace-card-link" href="#workspaces">View all workspace health <ChevronDown size={15} /></a>
        </UsersInfoCard>
      </div>

      <section className="users-quick-actions workspace-quick-actions">
        <h2>Quick Actions</h2>
        <div>
          {workspaceQuickActions.map((action) => {
            const Icon = action.icon
            return <button type="button" key={action.label}><span><Icon size={21} /></span><div><strong>{action.label}</strong><small>{action.detail}</small></div><ChevronDown size={17} /></button>
          })}
        </div>
      </section>
    </section>
  )
}

function WorkspaceUsageBar({ value }: { value: number }) {
  return <span className="workspace-usage"><em>{value}%</em><i><b style={{ width: `${value}%` }} /></i></span>
}

function workspaceStatusTone(status: string): Tone {
  if (status === 'Active') return 'emerald'
  if (status === 'Trial') return 'blue'
  if (status === 'Past Due') return 'amber'
  if (status === 'Suspended') return 'rose'
  return 'slate'
}
function PlansPage() {
  return (
    <section className="platform-plans-page">
      <div className="plans-kpi-row">
        <PlanMetric icon={FileText} label="Total Plans" value="4" detail="Active plans" tone="violet" />
        <PlanMetric icon={Users} label="Active Subscriptions" value="1,248" delta="12.5%" detail="this month" tone="emerald" />
        <PlanMetric icon={CreditCard} label="Monthly Revenue" value="BDT 31,42,700" delta="18.3%" detail="this month" tone="blue" />
        <PlanMetric icon={ArrowUpRight} label="Trial Conversions" value="24.8%" delta="5.6%" detail="this month" tone="amber" />
      </div>

      <section className="plans-table-card">
        <nav className="plans-tabs" aria-label="Plan configuration sections">
          {['All Plans', 'Features', 'Usage Limits', 'Plan Settings'].map((tab, index) => <button className={index === 0 ? 'active' : undefined} type="button" key={tab}>{tab}</button>)}
        </nav>
        <div className="plans-table-scroll">
          <div className="plans-table" role="table" aria-label="Platform pricing plans">
            <div className="plans-table-head" role="row"><span>Plan</span><span>Pricing</span><span>Key Features</span><span>Usage Limits</span><span>Subscriptions</span><span>Status</span><span>Actions</span></div>
            {plans.map((plan) => <PlanTableRow plan={plan} key={plan.name} />)}
          </div>
        </div>
      </section>

      <section className="plan-comparison-card">
        <header>
          <div><h2>Plan Features Comparison</h2><p>Compare plan features and limits side by side.</p></div>
          <button type="button"><Edit3 size={16} /> Edit Comparison</button>
        </header>
        <div className="plans-table-scroll">
          <div className="plan-comparison-table" role="table" aria-label="Plan features comparison">
            <div className="plan-comparison-head" role="row"><span>Features</span><span>Free</span><span>Basic</span><span>Pro <b>Popular</b></span><span>Enterprise</span></div>
            {planComparisonRows.map((row) => (
              <div className="plan-comparison-row" role="row" key={row.feature}><span>{row.feature}</span><span>{row.free}</span><span>{row.basic}</span><span>{row.pro}</span><span>{row.enterprise}</span></div>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}

function PlanMetric({ icon: Icon, label, value, delta, detail, tone }: { icon: LucideIcon; label: string; value: string; delta?: string; detail: string; tone: Tone }) {
  return <article className="plans-kpi-card"><div><small>{label}</small><strong>{value}</strong>{delta ? <p><ArrowUpRight size={13} /> {delta} <em>{detail}</em></p> : <em>{detail}</em>}</div><span className={`user-soft-${tone}`}><Icon size={26} /></span></article>
}

function PlanTableRow({ plan }: { plan: typeof plans[number] }) {
  const Icon = plan.icon
  return (
    <article className="plans-table-row" role="row">
      <span>
        <i className={`plan-icon-badge user-soft-${plan.tone}`}><Icon size={23} /></i>
        <b>{plan.name} {plan.badge ? <mark className={`plan-badge plan-badge-${plan.tone}`}>{plan.badge}</mark> : null}</b>
        <small>{plan.description}</small>
      </span>
      <span><b>{plan.price}</b><small>{plan.cadence}</small></span>
      <span className="plan-feature-chips">{plan.features.map((feature) => <PlanFeatureChip key={feature}>{feature}</PlanFeatureChip>)}</span>
      <span className="plan-limits">{plan.limits.map((limit) => <small key={limit}>{limit}</small>)}</span>
      <span><b>{plan.subscriptions}</b><small>{plan.share}</small></span>
      <span><UserPill tone="emerald">{plan.status}</UserPill></span>
      <span><IconButton icon={MoreHorizontal} label={`${plan.name} plan actions`} /></span>
    </article>
  )
}

function PlanFeatureChip({ children }: { children: string }) {
  return <em>{children}</em>
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
