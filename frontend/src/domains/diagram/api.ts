import { API_BASE_URL, authHeaders, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { ClassDiagramMethod, Diagram, DiagramDetail, DiagramVersion } from './types'

export async function fetchDiagrams(accessToken: string, workspaceId: string, projectId: string) {
  return parseApiResponse<Diagram[]>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/diagrams`, {
      headers: authHeaders(accessToken),
    }),
  )
}

export async function fetchDiagramDetail(
  accessToken: string,
  workspaceId: string,
  projectId: string,
  diagramId: string,
) {
  return parseApiResponse<DiagramDetail>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/diagrams/${diagramId}`, {
      headers: authHeaders(accessToken),
    }),
  )
}

export async function fetchDiagramVersions(
  accessToken: string,
  workspaceId: string,
  projectId: string,
  diagramId: string,
) {
  return parseApiResponse<DiagramVersion[]>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/diagrams/${diagramId}/versions`, {
      headers: authHeaders(accessToken),
    }),
  )
}

export async function createManualDiagram(
  accessToken: string,
  workspaceId: string,
  projectId: string,
  payload: { title: string; diagram_type: string; drawio_xml: string },
) {
  return parseApiResponse<DiagramDetail>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/diagrams`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}

export async function createDiagramVersion(
  accessToken: string,
  workspaceId: string,
  projectId: string,
  diagramId: string,
  payload: { drawio_xml: string },
) {
  return parseApiResponse<DiagramVersion>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/diagrams/${diagramId}/versions`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}

export async function generateClassDiagram(
  accessToken: string,
  workspaceId: string,
  projectId: string,
  payload: { srs_document_id: string; methods: ClassDiagramMethod[] },
) {
  return parseApiResponse<DiagramDetail>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/diagrams/class/generate`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}