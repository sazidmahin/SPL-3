import { API_BASE_URL, authHeaders, parseApiResponse } from '../../shared/apiClient'
import type { AuthSession, CurrentUserResponse } from './types'

export async function authenticate(mode: 'login' | 'register', payload: Record<string, string>) {
  const endpoint = mode === 'register' ? '/auth/register' : '/auth/login'
  return parseApiResponse<AuthSession>(
    await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  )
}

export async function fetchCurrentUser(accessToken: string) {
  return parseApiResponse<CurrentUserResponse>(
    await fetch(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders(accessToken),
    }),
  )
}