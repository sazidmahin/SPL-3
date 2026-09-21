export type AiProviderId = 'openai' | 'anthropic' | 'gemini'

export type AiCredential = {
  id: string
  provider: AiProviderId
  configured: boolean
  key_last_four: string
  selected_model: string
  is_default: boolean
  status: string
  validated_at: string | null
  last_used_at: string | null
  created_at: string
  updated_at: string
  test_response?: string | null
}

export type AiProviderSetting = {
  provider: AiProviderId
  label: string
  models: string[]
  default_model: string
  credential: AiCredential | null
}
