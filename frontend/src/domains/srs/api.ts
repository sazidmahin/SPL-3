import { API_BASE_URL, authHeaders, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { GenerationJob, SrsDocument, SrsGenerateResponse, SrsPipelineResponse } from './types'

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
  const response = await parseApiResponse<SrsPipelineResponse>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/srs/intake`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )

  if (response.status === 'needs_clarification') {
    const questions = response.clarifying_questions.map((question) => question.question).join(' ')
    throw new Error(questions || 'Requirement input needs clarification before SRS generation')
  }
  if (!response.job || !response.srs_document) {
    throw new Error('SRS generation completed without a generated document')
  }

  return {
    requirement_input: response.requirement_input,
    job: response.job,
    srs_document: response.srs_document,
    diagrams: response.diagrams,
  } satisfies SrsGenerateResponse
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
