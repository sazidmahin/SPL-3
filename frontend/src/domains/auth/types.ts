import type { WorkspaceMembership } from '../workspace/types'

export type AuthUser = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  status: string
  created_at: string
  updated_at: string
}

export type AuthSession = {
  access_token: string
  token_type: string
  user: AuthUser
}

export type CurrentUserResponse = {
  user: AuthUser
  workspaces: WorkspaceMembership[]
}

export type AuthMode = 'login' | 'register'