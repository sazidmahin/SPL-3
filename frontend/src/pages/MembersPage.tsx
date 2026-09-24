import { useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react'
import { errorMessage, workspaceApi } from '../api'
import type { WorkspaceMember, WorkspaceRole } from '../api'
import { ErrorState, LoadingState } from '../app/components/PageStates'
import { useSession } from '../app/core/session'
import { useAsync } from '../app/core/useAsync'
import { formatDate, humanize } from '../shared/format'
import { Avatar, Button, Card, Chip, EmptyState, Field, Input, PageHeader, Select, useFeedback } from '../shared/ui'

type AssignableRole = Exclude<WorkspaceRole, 'owner'>
const ROLES: Array<{ value: AssignableRole; label: string; description: string }> = [
  { value: 'admin', label: 'Admin', description: 'Manage members and all content' },
  { value: 'member', label: 'Member', description: 'Create and edit projects' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
]

export function MembersPage() {
  const { workspaceId, workspace, canManageWorkspace, user } = useSession()
  const { toast, confirm } = useFeedback()
  const members = useAsync(() => workspaceApi.members(workspaceId), [workspaceId], Boolean(workspaceId) && canManageWorkspace)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AssignableRole>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  if (!canManageWorkspace) {
    return (
      <EmptyState
        icon={Users}
        title="Members are managed in organization workspaces"
        description="Switch to an organization where you are an owner or admin, or create one in Settings → Workspaces."
      />
    )
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) {
      setInviteError('Enter the email of a registered SpecTwin user.')
      return
    }
    setInviting(true)
    setInviteError(null)
    try {
      const added = await workspaceApi.invite(workspaceId, { email: email.trim(), role })
      members.setData((current) => [...(current ?? []).filter((item) => item.id !== added.id), added])
      toast('Member added', { description: `${email.trim()} can now access ${workspace?.workspace.name}.` })
      setEmail('')
    } catch (caught) {
      setInviteError(errorMessage(caught, 'Unable to add this member'))
    } finally {
      setInviting(false)
    }
  }

  async function changeRole(member: WorkspaceMember, next: AssignableRole) {
    try {
      const updated = await workspaceApi.updateRole(workspaceId, member.id, next)
      members.setData((current) => (current ?? []).map((item) => (item.id === updated.id ? { ...item, role: updated.role } : item)))
      toast('Role updated', { description: `${member.user?.full_name ?? 'Member'} is now ${humanize(next)}.` })
    } catch (caught) {
      toast('Role change failed', { description: errorMessage(caught), tone: 'error' })
    }
  }

  async function remove(member: WorkspaceMember) {
    const ok = await confirm({
      title: `Remove ${member.user?.full_name ?? 'this member'}?`,
      description: 'They lose access to every project in this workspace. You can add them again later.',
      confirmLabel: 'Remove member',
    })
    if (!ok) return
    try {
      await workspaceApi.removeMember(workspaceId, member.id)
      members.setData((current) => (current ?? []).filter((item) => item.id !== member.id))
      toast('Member removed')
    } catch (caught) {
      toast('Remove failed', { description: errorMessage(caught), tone: 'error' })
    }
  }

  return (
    <section className="grid grid-cols-1 gap-5">
      <PageHeader title="Members" description={`People with access to ${workspace?.workspace.name ?? 'this workspace'}.`} />

      <Card className="p-5">
        <h2 className="font-display text-[15px] font-bold text-fg">Add a member</h2>
        <p className="mb-4 text-[13px] text-fg-2">They need a SpecTwin account first — ask them to sign up with this email.</p>
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-end" onSubmit={invite} noValidate>
          <Field label="Email" htmlFor="invite-email">
            <Input id="invite-email" type="email" value={email} placeholder="teammate@example.com" onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Role" htmlFor="invite-role">
            <Select id="invite-role" value={role} onChange={(event) => setRole(event.target.value as AssignableRole)}>
              {ROLES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={inviting}>
            {inviting ? <Loader2 className="animate-spin" /> : <UserPlus />} Add
          </Button>
        </form>
        {inviteError ? <p className="mt-3 text-[13px] font-medium text-danger" role="alert">{inviteError}</p> : null}
      </Card>

      {members.loading && !members.data ? (
        <LoadingState rows={3} />
      ) : members.error ? (
        <ErrorState message={members.error} onRetry={members.reload} />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {(members.data ?? []).map((member) => {
              const isOwner = member.role === 'owner'
              const isSelf = member.user_id === user?.id
              return (
                <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                  <Avatar name={member.user?.full_name ?? '?'} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-fg">
                      {member.user?.full_name ?? 'Unknown user'} {isSelf ? <span className="font-normal text-fg-3">(you)</span> : null}
                    </p>
                    <p className="truncate text-xs text-fg-3">
                      {member.user?.email} · joined {formatDate(member.created_at)}
                    </p>
                  </div>
                  {isOwner || isSelf ? (
                    <Chip tone={isOwner ? 'accent' : 'muted'}>{humanize(member.role)}</Chip>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select
                        inputSize="sm"
                        value={member.role}
                        onChange={(event) => void changeRole(member, event.target.value as AssignableRole)}
                        aria-label={`Role for ${member.user?.full_name ?? 'member'}`}
                        className="w-32"
                      >
                        {ROLES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </Select>
                      <Button variant="ghost" size="sm" className="px-2 text-danger hover:bg-danger/10 hover:text-danger" onClick={() => void remove(member)} aria-label={`Remove ${member.user?.full_name ?? 'member'}`}>
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </section>
  )
}
