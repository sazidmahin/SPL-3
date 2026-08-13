import { API_BASE_URL, authHeaders, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { GenerationMode, PipelineRun, PipelineStage, PipelineStageRevision } from './types'

function base(workspaceId: string, projectId: string) {
  return `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/generation-pipelines`
}

export async function fetchPipelineRuns(accessToken: string, workspaceId: string, projectId: string) {
  return parseApiResponse<PipelineRun[]>(await fetch(base(workspaceId, projectId), { headers: authHeaders(accessToken) }))
}

export async function createPipelineRun(accessToken: string, workspaceId: string, projectId: string, payload: { title: string; raw_text: string; generation_mode: GenerationMode }) {
  return parseApiResponse<PipelineRun>(await fetch(base(workspaceId, projectId), { method: 'POST', headers: jsonAuthHeaders(accessToken), body: JSON.stringify(payload) }))
}

export async function savePipelineStage(accessToken: string, workspaceId: string, projectId: string, runId: string, stage: PipelineStage, payload: Record<string, unknown>, expected_version?: number) {
  return parseApiResponse<PipelineStageRevision>(await fetch(`${base(workspaceId, projectId)}/${runId}/stages/${stage}/revisions`, {
    method: 'POST', headers: jsonAuthHeaders(accessToken), body: JSON.stringify({ payload, expected_version }),
  }))
}

export async function approvePipelineStage(accessToken: string, workspaceId: string, projectId: string, runId: string, stage: PipelineStage, version_number: number) {
  return parseApiResponse<PipelineRun>(await fetch(`${base(workspaceId, projectId)}/${runId}/stages/${stage}/approve`, {
    method: 'POST', headers: jsonAuthHeaders(accessToken), body: JSON.stringify({ version_number, proceed: true }),
  }))
}

export async function reopenPipelineStage(accessToken: string, workspaceId: string, projectId: string, runId: string, stage: PipelineStage) {
  return parseApiResponse<PipelineStageRevision>(await fetch(`${base(workspaceId, projectId)}/${runId}/stages/${stage}/reopen`, { method: 'POST', headers: authHeaders(accessToken) }))
}
