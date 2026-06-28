import type { DiagramDetail } from '../diagram/types'

export type GenerationJob = {
  id: string
  workspace_id: string
  project_id: string
  requirement_input_id: string
  job_type: 'srs' | 'class_diagram' | 'full'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partially_completed'
  progress_percent: number
  generate_class_diagram: boolean
  diagram_methods: string[]
  result_payload: Record<string, unknown> | null
  error_message: string | null
  created_by_user_id: string
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
}

export type ExtractedRequirement = {
  id: string
  workspace_id: string
  project_id: string
  srs_document_id: string
  requirement_input_id: string
  generation_job_id: string
  requirement_code: string
  requirement_text: string
  requirement_type: 'functional' | 'non_functional'
  nfr_subtype: string | null
  source_trace: string
  extraction_reason: string
  confidence_score: number
  created_at: string
}

export type SrsDocument = {
  id: string
  workspace_id: string
  project_id: string
  requirement_input_id: string
  generation_job_id: string
  title: string
  status: string
  content_markdown: string
  content_json: Record<string, unknown>
  created_by_user_id: string
  created_at: string
  updated_at: string
  extracted_requirements?: ExtractedRequirement[]
}

export type SrsGenerateResponse = {
  job: GenerationJob
  srs_document: SrsDocument
  diagrams: DiagramDetail[]
}