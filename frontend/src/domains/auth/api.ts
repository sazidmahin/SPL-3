import { API_BASE_URL, authHeaders, parseApiResponse } from '../../shared/apiClient'
import type { AuthSession, CurrentUserResponse } from './types'

export type RegisterResponse = {
  message: string
  verification_code: string | null
}

export async function login(payload: Record<string, string>) {
  return parseApiResponse<AuthSession>(
    await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  )
}

export async function register(payload: Record<string, string>) {
  return parseApiResponse<RegisterResponse>(
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  )
}

export async function verifyEmail(payload: Record<string, string>) {
  return parseApiResponse<AuthSession>(
    await fetch(`${API_BASE_URL}/auth/verify-email`, {
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
