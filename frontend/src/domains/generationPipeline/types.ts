export type GenerationMode = 'rule_based' | 'srsgen' | 'byok'
export type PipelineStage = 'input' | 'clarifications' | 'final-story' | 'requirements' | 'class-model' | 'xml'

export type PipelineStageRevision = {
  id: string
  stage_name: PipelineStage
  version_number: number
  status: string
  payload: Record<string, unknown>
  created_by_user_id: string
  approved_by_user_id: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export type PipelineRun = {
  id: string
  workspace_id: string
  project_id: string
  title: string
  raw_text: string
  generation_mode: GenerationMode
  provider: string | null
  model_name: string | null
  current_stage: PipelineStage
  status: string
  created_by_user_id: string
  created_at: string
  updated_at: string
  stages: PipelineStageRevision[]
}
