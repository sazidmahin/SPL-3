import type { FormEvent } from 'react'
import './WorkspacePanels.css'
import type { WorkspaceMembership } from '../../domains/workspace/types'

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
    <article className="panel workspace-panel">
      <div className="panel-heading">
        <span className="panel-label">Workspaces</span>
        <button className="text-button" type="button" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>
      <div className="workspace-switcher">
        {workspaces.map((membership) => (
          <button
            key={membership.workspace.id}
            className={
              membership.workspace.id === activeWorkspace?.workspace.id
                ? 'workspace-option active'
                : 'workspace-option'
            }
            type="button"
            onClick={() => onSelectWorkspace(membership.workspace.id)}
          >
            <span>{membership.workspace.name}</span>
            <small>
              {membership.workspace.type} / {membership.role}
            </small>
          </button>
        ))}
      </div>
      {activeWorkspace ? (
        <div className="workspace-row">
          <div>
            <h2>{activeWorkspace.workspace.name}</h2>
            <p>{activeWorkspace.workspace.type}</p>
          </div>
          <span className="role-chip">{activeWorkspace.role}</span>
        </div>
      ) : (
        <p>No active workspace found.</p>
      )}
    </article>
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
    <article className="panel create-workspace-panel">
      <span className="panel-label">New organization</span>
      <form className="workspace-form" onSubmit={onSubmit}>
        <label>
          Name
          <input
            value={workspaceName}
            onChange={(event) => onWorkspaceNameChange(event.target.value)}
            required
          />
        </label>
        <label>
          Slug
          <input
            value={workspaceSlug}
            onChange={(event) => onWorkspaceSlugChange(event.target.value)}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={isCreatingWorkspace}>
          {isCreatingWorkspace ? 'Creating' : 'Create workspace'}
        </button>
      </form>
    </article>
  )
}