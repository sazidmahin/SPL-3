import type { FormEvent } from 'react'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Button, Card, Chip, Field, Input, cn } from '../../shared/ui'

type WorkspacePanelProps = {
  workspaces: WorkspaceMembership[]
  activeWorkspace: WorkspaceMembership | undefined
  isRefreshing: boolean
  onRefresh: () => void
  onSelectWorkspace: (workspaceId: string) => void
}

export function WorkspacePanel({
  workspaces,
  activeWorkspace,
  isRefreshing,
  onRefresh,
  onSelectWorkspace,
}: WorkspacePanelProps) {
  return (
    <Card className="grid gap-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-accent">Workspaces</span>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </header>
      <div className="grid gap-2">
        {workspaces.map((membership) => (
          <button
            key={membership.workspace.id}
            type="button"
            onClick={() => onSelectWorkspace(membership.workspace.id)}
            className={cn(
              'grid w-full gap-1 rounded-md border px-3 py-2.5 text-left transition',
              membership.workspace.id === activeWorkspace?.workspace.id
                ? 'border-accent bg-accent/10'
                : 'border-border hover:bg-surface-2',
            )}
          >
            <span className="font-semibold text-fg">{membership.workspace.name}</span>
            <small className="text-xs capitalize text-fg-3">
              {membership.workspace.type} · {membership.role.replaceAll('_', ' ')}
            </small>
          </button>
        ))}
      </div>
      {activeWorkspace ? (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div>
            <h3 className="font-display text-base font-bold text-fg">{activeWorkspace.workspace.name}</h3>
            <p className="mt-0.5 text-[13px] capitalize text-fg-3">{activeWorkspace.workspace.type}</p>
          </div>
          <Chip tone="active" className="capitalize">
            {activeWorkspace.role.replaceAll('_', ' ')}
          </Chip>
        </div>
      ) : (
        <p className="text-[13px] text-fg-3">No active workspace found.</p>
      )}
    </Card>
  )
}

type CreateWorkspacePanelProps = {
  workspaceName: string
  workspaceSlug: string
  isCreatingWorkspace: boolean
  onWorkspaceNameChange: (value: string) => void
  onWorkspaceSlugChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CreateWorkspacePanel({
  workspaceName,
  workspaceSlug,
  isCreatingWorkspace,
  onWorkspaceNameChange,
  onWorkspaceSlugChange,
  onSubmit,
}: CreateWorkspacePanelProps) {
  return (
    <Card className="grid gap-4 p-4">
      <span className="text-[11px] font-bold uppercase tracking-wide text-accent">New organization</span>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Name">
          <Input value={workspaceName} onChange={(event) => onWorkspaceNameChange(event.target.value)} required />
        </Field>
        <Field label="Slug">
          <Input
            value={workspaceSlug}
            onChange={(event) => onWorkspaceSlugChange(event.target.value)}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </Field>
        <Button type="submit" className="sm:col-span-2" disabled={isCreatingWorkspace}>
          {isCreatingWorkspace ? 'Creating…' : 'Create workspace'}
        </Button>
      </form>
    </Card>
  )
}
