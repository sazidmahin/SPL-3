import { API_BASE_URL, authHeaders, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { AiCredential, AiProviderId, AiProviderSetting } from './types'

const baseUrl = `${API_BASE_URL}/users/me/ai-settings`

export async function fetchAiProviders(accessToken: string) {
  return parseApiResponse<AiProviderSetting[]>(await fetch(`${baseUrl}/providers`, { headers: authHeaders(accessToken) }))
}

export async function fetchCredentialModels(accessToken: string, provider: AiProviderId) {
  return parseApiResponse<string[]>(await fetch(`${baseUrl}/credentials/${provider}/models`, { headers: authHeaders(accessToken) }))
}

export async function saveAiCredential(accessToken: string, provider: AiProviderId, payload: { api_key: string; selected_model: string; is_default: boolean }) {
  return parseApiResponse<AiCredential>(await fetch(`${baseUrl}/credentials/${provider}`, {
    method: 'PUT', headers: jsonAuthHeaders(accessToken), body: JSON.stringify(payload),
  }))
}

export async function patchAiCredential(accessToken: string, provider: AiProviderId, payload: { selected_model?: string; is_default?: boolean }) {
  return parseApiResponse<AiCredential>(await fetch(`${baseUrl}/credentials/${provider}`, {
    method: 'PATCH', headers: jsonAuthHeaders(accessToken), body: JSON.stringify(payload),
  }))
}

export async function testAiCredential(accessToken: string, provider: AiProviderId) {
  return parseApiResponse<AiCredential>(await fetch(`${baseUrl}/credentials/${provider}/test`, {
    method: 'POST', headers: authHeaders(accessToken),
  }))
}

export async function deleteAiCredential(accessToken: string, provider: AiProviderId) {
  const response = await fetch(`${baseUrl}/credentials/${provider}`, { method: 'DELETE', headers: authHeaders(accessToken) })
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? 'Unable to remove API key')
}
