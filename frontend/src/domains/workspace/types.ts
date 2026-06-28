export type Workspace = {
  id: string
  name: string
  slug: string
  type: string
  owner_user_id: string
  status: string
  created_at: string
  updated_at: string
}

export type WorkspaceMembership = {
  workspace: Workspace
  role: string
  status: string
}