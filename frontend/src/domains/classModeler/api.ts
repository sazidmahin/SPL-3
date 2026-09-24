import { API_BASE_URL, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { ClassModelerMode, ClassModelerResult } from './types'

export async function generateClassModel(
  accessToken: string,
  workspaceId: string,
  payload: { text: string; mode: ClassModelerMode; project_id?: string },
) {
  return parseApiResponse<ClassModelerResult>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/class-modeler/generate`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}
