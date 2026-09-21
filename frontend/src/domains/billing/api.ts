import { API_BASE_URL, authHeaders, jsonAuthHeaders, parseApiResponse } from '../../shared/apiClient'
import type { CheckoutResponse, Plan, Subscription, Usage } from './types'

export async function fetchBillingSummary(accessToken: string, workspaceId: string) {
  const [plans, subscription, usage] = await Promise.all([
    parseApiResponse<Plan[]>(await fetch(`${API_BASE_URL}/billing/plans`)),
    parseApiResponse<Subscription>(
      await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/subscription`, {
        headers: authHeaders(accessToken),
      }),
    ),
    parseApiResponse<Usage>(
      await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/usage`, {
        headers: authHeaders(accessToken),
      }),
    ),
  ])
  return { plans, subscription, usage }
}

export async function checkoutPlan(accessToken: string, workspaceId: string, planCode: string) {
  return parseApiResponse<CheckoutResponse>(
    await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/checkout`, {
      method: 'POST',
      headers: jsonAuthHeaders(accessToken),
      body: JSON.stringify({ plan_code: planCode }),
    }),
  )
}