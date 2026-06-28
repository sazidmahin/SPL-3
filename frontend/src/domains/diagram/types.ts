export type Diagram = {
  id: string
  workspace_id: string
  project_id: string
  title: string
  diagram_type: string
  source: string
  status: string
  current_version: number
  created_by_user_id: string
  created_at: string
  updated_at: string
}

export type DiagramVersion = {
  id: string
  workspace_id: string
  project_id: string
  diagram_id: string
  version_number: number
  drawio_xml: string
  diagram_json: string | null
  created_by_user_id: string
  created_at: string
}

export type DiagramRequirementLink = {
  id: string
  workspace_id: string
  project_id: string
  diagram_id: string
  diagram_version_id: string
  srs_document_id: string
  extracted_requirement_id: string
  requirement_code: string
  diagram_element_id: string
  diagram_element_label: string
  link_reason: string
  confidence_score: number
  created_at: string
}

export type DiagramDetail = Diagram & {
  current: DiagramVersion
  requirement_links: DiagramRequirementLink[]
}

export type ClassDiagramMethod = 'llm' | 'rule_based'