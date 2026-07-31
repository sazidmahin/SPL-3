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
import './OrganizationMembersRoles.css'

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
    <section className="org-members-page" id="members">
      <header className="org-members-header">
        <div>
          <span>Organization Admin</span>
          <h1>Members &amp; Roles</h1>
          <p>{workspaceName} organization-level access control</p>
        </div>
        <button type="button">
          <UserPlus size={18} />
          Invite Member
        </button>
      </header>

      <div className="org-members-summary-grid">
        <SummaryCard icon={Users} label="Seat Usage" value={`${seatsUsed}/${seatLimit}`} detail="seats used" tone="purple">
          <div className="members-progress"><span style={{ width: `${Math.round((seatsUsed / seatLimit) * 100)}%` }} /></div>
          <a href="#usage">View Usage</a>
        </SummaryCard>
        <SummaryCard icon={ShieldCheck} label="Role Overview" value="4" detail="active roles" tone="green">
          <div className="role-count-list">
            <span><b>1</b> Owner</span>
            <span><b>2</b> Admin</span>
            <span><b>9</b> Editor</span>
            <span><b>6</b> Viewer</span>
          </div>
        </SummaryCard>
        <SummaryCard icon={Mail} label="Pending Invitations" value={pendingInvites.length} detail="awaiting response" tone="blue">
          <div className="invite-chip-list">
            {pendingInvites.slice(0, 2).map((invite) => <span key={invite.email}>{invite.role}</span>)}
          </div>
        </SummaryCard>
      </div>

      <div className="org-members-layout">
        <div className="org-members-main">
          <section className="members-table-card">
            <header>
              <div className="members-tabs" aria-label="Member filters">
                <button className="active" type="button">All Roles</button>
                <button type="button">Admins</button>
                <button type="button">Editors</button>
                <button type="button">Viewers</button>
              </div>
              <div className="members-table-tools">
                <label>
                  <Search size={16} />
                  <input placeholder="Search members..." />
                </label>
                <button type="button">All Statuses <ChevronDown size={14} /></button>
                <button type="button"><Filter size={15} />Filters</button>
              </div>
            </header>

            <div className="members-table-wrap">
              <div className="members-table" role="table" aria-label="Organization members">
                <div className="members-table-head" role="row">
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

          <section className="permission-card">
            <header>
              <div><ShieldCheck size={18} /><h2>Role &amp; Permission Overview</h2></div>
            </header>
            <div className="permission-table" role="table" aria-label="Role permission overview">
              <div className="permission-head" role="row">
                <span>Permission</span>
                <span><Crown size={15} />Owner</span>
                <span><ShieldCheck size={15} />Admin</span>
                <span><Edit3 size={15} />Editor</span>
                <span><Eye size={15} />Viewer</span>
              </div>
              {permissionRows.map((row) => (
                <div className="permission-row" role="row" key={row.permission}>
                  <span>{row.permission}</span>
                  <PermissionValue allowed={row.owner} />
                  <PermissionValue allowed={row.admin} />
                  <PermissionValue allowed={row.editor} />
                  <PermissionValue allowed={row.viewer} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="invite-member-card" aria-labelledby="invite-member-title">
          <header>
            <div>
              <UserPlus size={19} />
              <h2 id="invite-member-title">Invite Member</h2>
            </div>
            <button type="button" aria-label="Close invite panel"><X size={17} /></button>
          </header>
          <form onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>Email Address</span>
              <input type="email" placeholder="name@company.com" />
            </label>
            <label>
              <span>Role</span>
              <select defaultValue="Editor">
                <option>Admin</option>
                <option>Editor</option>
                <option>Viewer</option>
              </select>
            </label>
            <label>
              <span>Team Note (Optional)</span>
              <textarea placeholder="Add a personal note..." rows={4} />
            </label>
            <section className="role-helper-card">
              <h3>About Organization Roles</h3>
              <p>Owners and admins manage workspace settings, billing, seats, roles, and project access. Editors can create and update artifacts. Viewers have read-only access.</p>
            </section>
            <button className="send-invite-button" type="submit">
              <Mail size={17} />
              Send invitation
            </button>
            <button className="copy-link-button" type="button">
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
    <article className="org-member-summary-card">
      <span className={`summary-icon tone-${tone}`}><Icon size={24} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
      {children}
    </article>
  )
}

function MemberRow({ member, currentUserEmail }: {
  member: typeof members[number]
  currentUserEmail: string
}) {
  return (
    <article className="members-table-row" role="row">
      <span className="member-cell">
        <i className={`member-avatar tone-${member.roleTone}`}>{initials(member.name)}</i>
        <strong>{member.email === currentUserEmail ? `${member.name} (You)` : member.name}</strong>
      </span>
      <span>{member.email}</span>
      <span><RoleBadge tone={member.roleTone}>{member.role}</RoleBadge></span>
      <span><StatusBadge tone={member.statusTone}>{member.status}</StatusBadge></span>
      <span>{member.projects}</span>
      <span>{member.lastActive}</span>
      <span className="member-actions"><button type="button" aria-label={`More actions for ${member.name}`}><MoreVertical size={17} /></button></span>
    </article>
  )
}

function RoleBadge({ tone, children }: { tone: RoleTone; children: string }) {
  return <span className={`role-badge tone-${tone}`}>{children}</span>
}

function StatusBadge({ tone, children }: { tone: StatusTone; children: string }) {
  return <span className={`member-status tone-${tone}`}>{children}</span>
}

function PermissionValue({ allowed }: { allowed: boolean }) {
  return <span className={allowed ? 'permission-yes' : 'permission-no'}>{allowed ? <Check size={16} /> : <X size={16} />}</span>
}

function initials(name: string) {
  return name
    .replace('(You)', '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M'
}
