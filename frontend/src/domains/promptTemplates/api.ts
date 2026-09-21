import { API_BASE_URL, authHeaders, parseApiResponse } from '../../shared/apiClient'
import type { PromptTemplate } from './types'

export async function fetchPromptTemplates(accessToken: string) {
  return parseApiResponse<PromptTemplate[]>(
    await fetch(`${API_BASE_URL}/admin/prompt-templates`, {
      headers: authHeaders(accessToken),
    }),
  )
}
