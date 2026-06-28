import { useState } from 'react'
import type { FormEvent } from 'react'
import type { AuthSession } from '../../domains/auth/types'
import { createManualDiagram } from '../../domains/diagram/api'
import type { DiagramDetail } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { errorMessage } from '../support/errors'

type UseDiagramCreationOptions = {
  session: AuthSession | null
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  diagramXml: string
  onCreated: (diagram: DiagramDetail) => void
  setError: (message: string | null) => void
}

export function useDiagramCreation({
  session,
  activeWorkspace,
  activeProject,
  diagramXml,
  onCreated,
  setError,
}: UseDiagramCreationOptions) {
  const [diagramTitle, setDiagramTitle] = useState('')
  const [diagramType, setDiagramType] = useState('class')
  const [isCreatingDiagram, setIsCreatingDiagram] = useState(false)

  async function createDiagram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !activeWorkspace || !activeProject) {
      return
    }

    setIsCreatingDiagram(true)
    setError(null)
    try {
      const detail = await createManualDiagram(session.access_token, activeWorkspace.workspace.id, activeProject.id, {
        title: diagramTitle,
        diagram_type: diagramType,
        drawio_xml: diagramXml,
      })
      setDiagramTitle('')
      onCreated(detail)
    } catch (caught) {
      setError(errorMessage(caught, 'Unable to create diagram'))
    } finally {
      setIsCreatingDiagram(false)
    }
  }

  return {
    diagramTitle,
    diagramType,
    isCreatingDiagram,
    setDiagramTitle,
    setDiagramType,
    createDiagram,
  }
}
