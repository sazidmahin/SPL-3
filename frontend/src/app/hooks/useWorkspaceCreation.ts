import { useState } from 'react'
import type { FormEvent } from 'react'
import { createWorkspace as createWorkspaceRequest } from '../../domains/workspace/api'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import type { AuthSession } from '../../domains/auth/types'
import { errorMessage } from '../support/errors'
import { workspaceSlugFromName } from '../support/workspaceSlug'

type UseWorkspaceCreationOptions = {
  session: AuthSession | null
  onCreated: (membership: WorkspaceMembership) => Promise<void>
  setError: (message: string | null) => void
}

export function useWorkspaceCreation({ session, onCreated, setError }: UseWorkspaceCreationOptions) {
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)

  function applyWorkspaceName(value: string) {
    setWorkspaceName(value)
    if (!workspaceSlug) {
      setWorkspaceSlug(workspaceSlugFromName(value))
    }
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setIsCreatingWorkspace(true)
    setError(null)
    try {
      const membership = await createWorkspaceRequest(session.access_token, {
        name: workspaceName,
        slug: workspaceSlug,
        type: 'organization',
      })
      setWorkspaceName('')
      setWorkspaceSlug('')
      await onCreated(membership)
    } catch (caught) {
      setError(errorMessage(caught, 'Unable to create workspace'))
    } finally {
      setIsCreatingWorkspace(false)
    }
  }

  return {
    workspaceName,
    workspaceSlug,
    isCreatingWorkspace,
    applyWorkspaceName,
    setWorkspaceSlug,
    createWorkspace,
  }
}
