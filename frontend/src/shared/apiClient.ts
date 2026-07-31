const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '')

const normalizeApiPrefix = (value: string | undefined) => {
  const trimmed = value?.trim()
  if (!trimmed) {
    return '/api/v1'
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return trimTrailingSlashes(withLeadingSlash)
}

function resolveApiBaseUrl() {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN?.trim()
  const apiPrefix = import.meta.env.VITE_API_PREFIX?.trim()
  const legacyApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (apiOrigin || apiPrefix) {
    return `${apiOrigin ? trimTrailingSlashes(apiOrigin) : ''}${normalizeApiPrefix(apiPrefix)}`
  }

  if (legacyApiBaseUrl) {
    try {
      const parsed = new URL(legacyApiBaseUrl)
      if (parsed.pathname === '/' || parsed.pathname === '') {
        return `${trimTrailingSlashes(legacyApiBaseUrl)}/api/v1`
      }
    } catch {
      return trimTrailingSlashes(legacyApiBaseUrl)
    }

    return trimTrailingSlashes(legacyApiBaseUrl)
  }

  return '/api/v1'
}

export const API_BASE_URL = resolveApiBaseUrl()

export class ApiResponseError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(message: string, status: number, detail: unknown) {
    super(message)
    this.name = 'ApiResponseError'
    this.status = status
    this.detail = detail
  }
}

export function isUnauthorizedError(error: unknown): error is ApiResponseError {
  return error instanceof ApiResponseError && error.status === 401
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = body && typeof body.detail === 'string' ? body.detail : 'Request failed'
    throw new ApiResponseError(detail, response.status, body)
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
