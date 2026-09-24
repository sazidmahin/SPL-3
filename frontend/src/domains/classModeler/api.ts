import { API_BASE_URL, authHeaders, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { ClassModelerMode, ClassModelerResult, LlmProvider, OllamaModels } from './types'

export async function generateClassModel(
  accessToken: string,
  workspaceId: string,
  payload: { text: string; mode: ClassModelerMode; project_id?: string; llm_provider?: LlmProvider; model_name?: string },
) {
  return parseApiResponse<ClassModelerResult>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/class-modeler/generate`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}

export async function fetchOllamaModels(accessToken: string, workspaceId: string) {
  return parseApiResponse<OllamaModels>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/class-modeler/ollama-models`, {
      headers: authHeaders(accessToken),
    }),
  )
}
