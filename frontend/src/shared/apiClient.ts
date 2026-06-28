export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = body && typeof body.detail === 'string' ? body.detail : 'Request failed'
    throw new Error(detail)
  }
  return body as T
}

export function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` }
}

export function jsonAuthHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}