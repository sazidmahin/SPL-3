import { API_BASE_URL, authHeaders, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { Project } from './types'

export async function fetchProjects(accessToken: string, workspaceId: string) {
  return parseApiResponse<Project[]>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects`, {
      headers: authHeaders(accessToken),
    }),
  )
}

export async function createProject(
  accessToken: string,
  workspaceId: string,
  payload: { name: string; description: string | null },
) {
  return parseApiResponse<Project>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}