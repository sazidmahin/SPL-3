import { Users } from 'lucide-react'
import type { AuthUser } from '../../domains/auth/types'
import type { Subscription } from '../../domains/billing/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Card, Chip, DataTable, EmptyState, PageHeader } from '../../shared/ui'

type OrganizationMembersRolesProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  subscription: Subscription | null
}

export function OrganizationMembersRoles({ user, activeWorkspace, subscription }: OrganizationMembersRolesProps) {
  return (
    <section className="grid gap-6" id="members">
      <PageHeader
        eyebrow="Organization Admin"
        title="Members & Roles"
        description={`People with access to ${activeWorkspace?.workspace.name ?? 'this organization'}.`}
      />

      <Card>
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-[15px] font-bold text-fg">Members</h2>
        </div>
        <DataTable>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Seats</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-semibold text-fg">{user.full_name} (You)</td>
              <td>{user.email}</td>
              <td>
                <Chip tone="accent" className="capitalize">
                  {activeWorkspace?.role.replaceAll('_', ' ') ?? 'member'}
                </Chip>
              </td>
              <td>{subscription?.plan.max_members ?? '—'}</td>
            </tr>
          </tbody>
        </DataTable>
      </Card>

      <EmptyState
        icon={Users}
        title="Member management is not wired up yet"
        description="Inviting members and editing roles will appear here once the members API is connected."
      />
    </section>
  )
}
