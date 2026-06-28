import { API_BASE_URL, authHeaders, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { GenerationJob, SrsDocument, SrsGenerateResponse } from './types'

export async function fetchGenerationJobs(accessToken: string, workspaceId: string, projectId: string) {
  return parseApiResponse<GenerationJob[]>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/srs/jobs`, {
      headers: authHeaders(accessToken),
    }),
  )
}

export async function fetchSrsDocuments(accessToken: string, workspaceId: string, projectId: string) {
  return parseApiResponse<SrsDocument[]>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/srs`, {
      headers: authHeaders(accessToken),
    }),
  )
}

export async function fetchSrsDocumentDetail(
  accessToken: string,
  workspaceId: string,
  projectId: string,
  documentId: string,
) {
  return parseApiResponse<SrsDocument>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/srs/${documentId}`, {
      headers: authHeaders(accessToken),
    }),
  )
}

export async function generateSrs(
  accessToken: string,
  workspaceId: string,
  projectId: string,
  payload: {
    title: string
    raw_text: string
    generate_class_diagram: boolean
    diagram_methods: string[]
  },
) {
  return parseApiResponse<SrsGenerateResponse>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/srs/generate`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}
export async function exportSrsDocument(accessToken: string, workspaceId: string, projectId: string, documentId: string) {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/srs/${documentId}/export`, {
    headers: authHeaders(accessToken),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = body && typeof body.detail === 'string' ? body.detail : 'Unable to export SRS'
    throw new Error(detail)
  }
  return {
    content: await response.text(),
    filename: response.headers.get('content-disposition'),
  }
}