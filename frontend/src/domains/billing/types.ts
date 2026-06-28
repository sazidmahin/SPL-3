export type Plan = {
  id: string
  code: string
  name: string
  description: string | null
  workspace_type: string
  price_cents_monthly: number
  max_projects: number
  max_members: number
  monthly_srs_generations: number
  monthly_ai_diagram_generations: number
  monthly_manual_diagram_saves: number
  can_use_manual_drawio: boolean
  can_generate_srs: boolean
  can_generate_ai_diagrams: boolean
  can_export_srs: boolean
  can_export_diagrams: boolean
}

export type Subscription = {
  id: string
  workspace_id: string
  plan_id: string
  status: string
  current_period_start: string
  current_period_end: string
  plan: Plan
}

export type Usage = {
  id: string
  workspace_id: string
  period_key: string
  srs_generations: number
  ai_diagram_generations: number
  manual_diagram_saves: number
}

export type CheckoutResponse = {
  checkout_session_id: string
  checkout_url: string
  plan: Plan
  subscription: Subscription
}