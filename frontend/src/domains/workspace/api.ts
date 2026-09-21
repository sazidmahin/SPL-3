import { API_BASE_URL, authHeaders, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { WorkspaceMembership } from './types'

export async function createWorkspace(accessToken: string, payload: { name: string; slug: string; type: string }) {
  return parseApiResponse<WorkspaceMembership>(
    await fetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}

export async function fetchWorkspaceMemberships(accessToken: string) {
  return parseApiResponse<WorkspaceMembership[]>(
    await fetch(`${API_BASE_URL}/workspaces`, {
      headers: authHeaders(accessToken),
    }),
  )
}