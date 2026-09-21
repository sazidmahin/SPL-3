import { useState } from 'react'
import type { FormEvent } from 'react'
import type { AuthSession } from '../../domains/auth/types'
import { createProject as createProjectRequest } from '../../domains/project/api'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { errorMessage } from '../support/errors'

type UseProjectCreationOptions = {
  session: AuthSession | null
  activeWorkspace: WorkspaceMembership | undefined
  onCreated: (project: Project) => void
  setError: (message: string | null) => void
}

export function useProjectCreation({ session, activeWorkspace, onCreated, setError }: UseProjectCreationOptions) {
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !activeWorkspace) {
      return
    }

    setIsCreatingProject(true)
    setError(null)
    try {
      const project = await createProjectRequest(session.access_token, activeWorkspace.workspace.id, {
        name: projectName,
        description: projectDescription || null,
      })
      setProjectName('')
      setProjectDescription('')
      onCreated(project)
    } catch (caught) {
      setError(errorMessage(caught, 'Unable to create project'))
    } finally {
      setIsCreatingProject(false)
    }
  }

  return {
    projectName,
    projectDescription,
    isCreatingProject,
    setProjectName,
    setProjectDescription,
    createProject,
  }
}
