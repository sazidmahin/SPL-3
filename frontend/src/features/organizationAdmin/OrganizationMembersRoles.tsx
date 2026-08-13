import {
  Check,
  ChevronDown,
  Copy,
  Crown,
  Edit3,
  Eye,
  Filter,
  Mail,
  MoreVertical,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../../domains/auth/types'
import type { Subscription } from '../../domains/billing/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'

type OrganizationMembersRolesProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  subscription: Subscription | null
}

type RoleTone = 'owner' | 'admin' | 'editor' | 'viewer'
type StatusTone = 'active' | 'pending'

const members = [
  {
    id: 'member-1',
    name: 'Alex Johnson (You)',
    email: 'alex.johnson@acme.com',
    role: 'Owner',
    roleTone: 'owner' as const,
    status: 'Active',
    statusTone: 'active' as const,
    projects: 12,
    lastActive: '2 hours ago',
  },
  {
    id: 'member-2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@acme.com',
    role: 'Admin',
    roleTone: 'admin' as const,
    status: 'Active',
    statusTone: 'active' as const,
    projects: 8,
    lastActive: '10 minutes ago',
  },
  {
    id: 'member-3',
    name: 'Michael Patel',
    email: 'michael.patel@acme.com',
    role: 'Editor',
    roleTone: 'editor' as const,
    status: 'Active',
    statusTone: 'active' as const,
    projects: 5,
    lastActive: '40 minutes ago',
  },
  {
    id: 'member-4',
    name: 'Priya Sharma',
    email: 'priya.sharma@acme.com',
    role: 'Editor',
    roleTone: 'editor' as const,
    status: 'Active',
    statusTone: 'active' as const,
    projects: 4,
    lastActive: 'Yesterday',
  },
  {
    id: 'member-5',
    name: 'David Kim',
    email: 'david.kim@acme.com',
    role: 'Viewer',
    roleTone: 'viewer' as const,
    status: 'Active',
    statusTone: 'active' as const,
    projects: 3,
    lastActive: '2 days ago',
  },
]

const pendingInvites = [
  { email: 'jessica.lee@acme.com', role: 'Editor' },
  { email: 'noman.ahmed@acme.com', role: 'Viewer' },
  { email: 'fatima.khan@acme.com', role: 'Editor' },
]

const permissionRows = [
  { permission: 'Manage members & roles', owner: true, admin: true, editor: false, viewer: false },
  { permission: 'Manage billing and data', owner: true, admin: true, editor: false, viewer: false },
  { permission: 'Create projects', owner: true, admin: true, editor: true, viewer: false },
  { permission: 'Edit SRS documents & diagrams', owner: true, admin: true, editor: true, viewer: false },
  { permission: 'View documents & diagrams', owner: true, admin: true, editor: true, viewer: true },
]

export function OrganizationMembersRoles({ user, activeWorkspace, subscription }: OrganizationMembersRolesProps) {
  const workspaceName = activeWorkspace?.workspace.name ?? 'Acme Corporation'
  const seatLimit = Math.max(subscription?.plan.max_members ?? 25, 25)
  const seatsUsed = 18

  return (
    <section className="mx-auto grid max-w-400 gap-5 p-4 sm:p-6" id="members">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">Organization Admin</span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Members &amp; Roles</h1>
          <p className="mt-1 text-sm text-slate-500">{workspaceName} organization-level access control</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700" type="button">
          <UserPlus size={18} />
          Invite Member
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Users} label="Seat Usage" value={`${seatsUsed}/${seatLimit}`} detail="seats used" tone="purple">
           <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${Math.round((seatsUsed / seatLimit) * 100)}%` }} /></div>
           <a className="text-xs font-bold text-brand-600" href="#usage">View Usage</a>
        </SummaryCard>
        <SummaryCard icon={ShieldCheck} label="Role Overview" value="4" detail="active roles" tone="green">
           <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
             <span className="rounded bg-slate-100 px-1.5 py-1"><b>1</b> Owner</span>
             <span className="rounded bg-slate-100 px-1.5 py-1"><b>2</b> Admin</span>
             <span className="rounded bg-slate-100 px-1.5 py-1"><b>9</b> Editor</span>
             <span className="rounded bg-slate-100 px-1.5 py-1"><b>6</b> Viewer</span>
          </div>
        </SummaryCard>
        <SummaryCard icon={Mail} label="Pending Invitations" value={pendingInvites.length} detail="awaiting response" tone="blue">
           <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-slate-600">
             {pendingInvites.slice(0, 2).map((invite) => <span className="rounded bg-sky-50 px-1.5 py-1 text-sky-700" key={invite.email}>{invite.role}</span>)}
          </div>
        </SummaryCard>
      </div>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="grid gap-5">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="grid gap-3 border-b border-slate-100 p-4 lg:flex lg:items-center lg:justify-between">
              <div className="flex gap-1 overflow-x-auto" aria-label="Member filters">
                <button className="shrink-0 rounded-md bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700" type="button">All Roles</button>
                <button className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100" type="button">Admins</button>
                <button className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100" type="button">Editors</button>
                <button className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100" type="button">Viewers</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-400 lg:w-52">
                  <Search size={16} />
                  <input className="min-w-0 flex-1 text-sm text-slate-800 outline-none" placeholder="Search members..." />
                </label>
                <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" type="button">All Statuses <ChevronDown size={14} /></button>
                <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" type="button"><Filter size={15} />Filters</button>
              </div>
            </header>

            <div className="overflow-x-auto">
              <div className="min-w-225" role="table" aria-label="Organization members">
                <div className="grid grid-cols-[1.25fr_1.5fr_.65fr_.65fr_.9fr_.9fr_3rem] items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500" role="row">
                  <span>Member</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Assigned Projects</span>
                  <span>Last Active</span>
                  <span>Actions</span>
                </div>
                {members.map((member) => <MemberRow member={member} currentUserEmail={user.email} key={member.id} />)}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-4 text-brand-600">
              <ShieldCheck size={18} /><h2 className="text-base font-bold text-slate-950">Role &amp; Permission Overview</h2>
            </header>
            <div className="overflow-x-auto">
              <div className="min-w-155" role="table" aria-label="Role permission overview">
              <div className="grid grid-cols-[minmax(14rem,1fr)_repeat(4,5.5rem)] items-center bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500" role="row">
                <span>Permission</span>
                <span><Crown size={15} />Owner</span>
                <span><ShieldCheck size={15} />Admin</span>
                <span><Edit3 size={15} />Editor</span>
                <span><Eye size={15} />Viewer</span>
              </div>
              {permissionRows.map((row) => (
                <div className="grid grid-cols-[minmax(14rem,1fr)_repeat(4,5.5rem)] items-center border-t border-slate-100 px-4 py-3 text-sm text-slate-700" role="row" key={row.permission}>
                  <span className="font-medium">{row.permission}</span>
                  <PermissionValue allowed={row.owner} />
                  <PermissionValue allowed={row.admin} />
                  <PermissionValue allowed={row.editor} />
                  <PermissionValue allowed={row.viewer} />
                </div>
              ))}
            </div>
              </div>
          </section>
        </div>

        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="invite-member-title">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div className="flex items-center gap-2 text-brand-600">
              <UserPlus size={19} />
              <h2 className="font-bold text-slate-950" id="invite-member-title">Invite Member</h2>
            </div>
            <button className="grid size-8 place-items-center rounded text-slate-500 hover:bg-slate-100" type="button" aria-label="Close invite panel"><X size={17} /></button>
          </header>
          <form className="grid gap-4 p-4" onSubmit={(event) => event.preventDefault()}>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Email Address</span>
              <input className={fieldClass} type="email" placeholder="name@company.com" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Role</span>
              <select className={fieldClass} defaultValue="Editor">
                <option>Admin</option>
                <option>Editor</option>
                <option>Viewer</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Team Note (Optional)</span>
              <textarea className={`${fieldClass} resize-y`} placeholder="Add a personal note..." rows={4} />
            </label>
            <section className="rounded-lg bg-brand-50 p-3">
              <h3 className="text-sm font-bold text-brand-900">About Organization Roles</h3>
              <p className="mt-1 text-xs leading-5 text-brand-800">Owners and admins manage workspace settings, billing, seats, roles, and project access. Editors can create and update artifacts. Viewers have read-only access.</p>
            </section>
            <button className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-bold text-white" type="submit">
              <Mail size={17} />
              Send invitation
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-700" type="button">
              <Copy size={17} />
              Copy invitation link
            </button>
          </form>
        </aside>
      </div>
    </section>
  )
}

function SummaryCard({ icon: Icon, label, value, detail, tone, children }: {
  icon: LucideIcon
  label: string
  value: string | number
  detail: string
  tone: 'purple' | 'green' | 'blue'
  children: ReactNode
}) {
  return (
    <article className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={summaryIconClass(tone)}><Icon size={22} /></span>
      <div>
        <small className="text-xs font-semibold text-slate-500">{label}</small>
        <strong className="mt-1 block text-2xl font-bold text-slate-950">{value}</strong>
        <p className="mt-1 text-xs text-slate-500">{detail}</p>
      </div>
      <div className="col-span-2 grid gap-2">{children}</div>
    </article>
  )
}

function MemberRow({ member, currentUserEmail }: {
  member: typeof members[number]
  currentUserEmail: string
}) {
  return (
    <article className="grid grid-cols-[1.25fr_1.5fr_.65fr_.65fr_.9fr_.9fr_3rem] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50" role="row">
      <span className="flex items-center gap-2 min-w-0">
        <i className={memberAvatarClass(member.roleTone)}>{initials(member.name)}</i>
        <strong>{member.email === currentUserEmail ? `${member.name} (You)` : member.name}</strong>
      </span>
      <span>{member.email}</span>
      <span><RoleBadge tone={member.roleTone}>{member.role}</RoleBadge></span>
      <span><StatusBadge tone={member.statusTone}>{member.status}</StatusBadge></span>
      <span>{member.projects}</span>
      <span>{member.lastActive}</span>
      <span><button className="grid size-8 place-items-center rounded text-slate-500 hover:bg-slate-200" type="button" aria-label={`More actions for ${member.name}`}><MoreVertical size={17} /></button></span>
    </article>
  )
}

function RoleBadge({ tone, children }: { tone: RoleTone; children: string }) {
  return <span className={roleClass(tone)}>{children}</span>
}

function StatusBadge({ tone, children }: { tone: StatusTone; children: string }) {
  return <span className={tone === 'active' ? 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700' : 'rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700'}>{children}</span>
}

function PermissionValue({ allowed }: { allowed: boolean }) {
  return <span className={allowed ? 'grid place-items-center text-emerald-600' : 'grid place-items-center text-slate-300'}>{allowed ? <Check size={16} /> : <X size={16} />}</span>
}

const fieldClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-100'
function summaryIconClass(tone: 'purple' | 'green' | 'blue') { return tone === 'purple' ? 'grid size-12 place-items-center rounded-xl bg-brand-100 text-brand-700' : tone === 'green' ? 'grid size-12 place-items-center rounded-xl bg-emerald-100 text-emerald-700' : 'grid size-12 place-items-center rounded-xl bg-sky-100 text-sky-700' }
function roleClass(tone: RoleTone) { return tone === 'owner' ? 'rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700' : tone === 'admin' ? 'rounded-full bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700' : tone === 'editor' ? 'rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700' : 'rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600' }
function memberAvatarClass(tone: RoleTone) { return `${roleClass(tone).replace('px-2 py-1 text-xs font-bold', '')} grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold not-italic` }

function initials(name: string) {
  return name
    .replace('(You)', '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M'
}
