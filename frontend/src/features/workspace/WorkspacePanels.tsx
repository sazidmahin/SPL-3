import type { FormEvent } from 'react'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Button, Card, Chip, Field, Input, cn, initials } from '../../shared/ui'

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
    <Card className="grid grid-cols-1 gap-4 p-5">
      <header className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-accent">Workspaces</span>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </header>
      <div className="grid grid-cols-1 gap-2">
        {workspaces.map((membership) => {
          const selected = membership.workspace.id === activeWorkspace?.workspace.id
          return (
            <button
              key={membership.workspace.id}
              type="button"
              onClick={() => onSelectWorkspace(membership.workspace.id)}
              aria-pressed={selected}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition',
                selected ? 'border-accent/60 bg-accent/[0.06] shadow-[var(--ring-accent)]' : 'border-border hover:border-border-strong hover:bg-surface-2',
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky to-accent text-[11px] font-extrabold text-white">
                {initials(membership.workspace.name, 'W')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-fg">{membership.workspace.name}</span>
                <small className="block text-xs capitalize text-fg-3">{membership.workspace.type} workspace</small>
              </span>
              <Chip tone={selected ? 'accent' : 'muted'} className="capitalize">
                {membership.role.replaceAll('_', ' ')}
              </Chip>
            </button>
          )
        })}
      </div>
      {!activeWorkspace ? <p className="text-[13px] text-fg-3">No active workspace found.</p> : null}
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
    <Card className="grid grid-cols-1 gap-4 p-5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-accent">New organization</span>
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
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
