import type { AuthSession } from '../domains/auth/types'
import type { Subscription, Usage, Plan } from '../domains/billing/types'
import type { Diagram, DiagramDetail, DiagramVersion } from '../domains/diagram/types'
import type { Project } from '../domains/project/types'
import type { GenerationJob, SrsDocument } from '../domains/srs/types'
import type { WorkspaceMembership } from '../domains/workspace/types'

const now = new Date().toISOString()

export const mockSession: AuthSession = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  user: {
    id: 'mock-user-1',
    email: 'mock.user@srs.local',
    full_name: 'Priya Rahman',
    avatar_url: null,
    status: 'active',
    created_at: now,
    updated_at: now,
  },
}

export const mockWorkspaceMemberships: WorkspaceMembership[] = [
  {
    role: 'member',
    status: 'active',
    workspace: {
      id: 'mock-workspace-1',
      name: 'Personal Workspace',
      slug: 'personal-workspace',
      type: 'personal',
      owner_user_id: mockSession.user.id,
      status: 'active',
      created_at: now,
      updated_at: now,
    },
  },
]

export const mockProjects: Project[] = [
  project('mock-project-1', 'E-Commerce Platform', 'Online store with checkout, inventory, and customer management.', 'active'),
  project('mock-project-2', 'Healthcare Appointment System', 'Doctor appointment booking and patient workflow.', 'planning'),
  project('mock-project-3', 'Inventory Management System', 'Warehouse stock tracking and supplier operations.', 'active'),
  project('mock-project-4', 'Learning Management System', 'Course authoring, enrollment, and learner progress.', 'review'),
  project('mock-project-5', 'Mobile Banking App', 'Secure mobile banking flow and transaction controls.', 'on_hold'),
]

export const mockPlan: Plan = {
  id: 'mock-plan-pro',
  code: 'pro',
  name: 'Pro Plan',
  description: 'Advanced SRS generation, diagrams, and workspace collaboration.',
  workspace_type: 'any',
  price_cents_monthly: 2900,
  max_projects: 999,
  max_members: 10,
  monthly_srs_generations: 10000,
  monthly_ai_diagram_generations: 10000,
  monthly_manual_diagram_saves: 10000,
  can_use_manual_drawio: true,
  can_generate_srs: true,
  can_generate_ai_diagrams: true,
  can_export_srs: true,
  can_export_diagrams: true,
}

export const mockSubscription: Subscription = {
  id: 'mock-subscription-1',
  workspace_id: 'mock-workspace-1',
  plan_id: mockPlan.id,
  status: 'active',
  current_period_start: '2026-07-01T00:00:00.000Z',
  current_period_end: '2026-08-01T00:00:00.000Z',
  plan: mockPlan,
}

export const mockUsage: Usage = {
  id: 'mock-usage-1',
  workspace_id: 'mock-workspace-1',
  period_key: '2026-07',
  srs_generations: 6200,
  ai_diagram_generations: 2766,
  manual_diagram_saves: 241,
}

export const mockGenerationJobs: GenerationJob[] = [
  generationJob('mock-job-1', 'full', 'completed', 100),
  generationJob('mock-job-2', 'class_diagram', 'completed', 100),
  generationJob('mock-job-3', 'srs', 'running', 64),
]

export const mockSrsDocuments: SrsDocument[] = [
  srsDocument('mock-srs-1', 'E-Commerce Platform - SRS', 'approved'),
  srsDocument('mock-srs-2', 'Healthcare Appointment System - SRS', 'draft'),
  srsDocument('mock-srs-3', 'Inventory Management System - SRS', 'approved'),
  srsDocument('mock-srs-4', 'Learning Management System - SRS', 'review'),
]

const mockVersion: DiagramVersion = {
  id: 'mock-diagram-version-1',
  workspace_id: 'mock-workspace-1',
  project_id: 'mock-project-1',
  diagram_id: 'mock-diagram-1',
  version_number: 2,
  drawio_xml: '<mxfile><diagram name="Mock Class Diagram"></diagram></mxfile>',
  diagram_json: null,
  created_by_user_id: mockSession.user.id,
  created_at: now,
}

export const mockDiagrams: Diagram[] = [
  diagram('mock-diagram-1', 'Class Diagram - E-Commerce Platform', 'class', 2),
  diagram('mock-diagram-2', 'Checkout Flow - E-Commerce Platform', 'flowchart', 1),
  diagram('mock-diagram-3', 'Use Case Diagram - Healthcare', 'use_case', 3),
]

export const mockDiagramDetail: DiagramDetail = {
  ...mockDiagrams[0],
  current: mockVersion,
  requirement_links: [
    {
      id: 'mock-link-1',
      workspace_id: 'mock-workspace-1',
      project_id: 'mock-project-1',
      diagram_id: 'mock-diagram-1',
      diagram_version_id: mockVersion.id,
      srs_document_id: 'mock-srs-1',
      extracted_requirement_id: 'mock-req-1',
      requirement_code: 'REQ-014',
      diagram_element_id: 'Customer',
      diagram_element_label: 'Customer',
      link_reason: 'Customer actor maps to checkout requirements.',
      confidence_score: 0.92,
      created_at: now,
    },
  ],
}

function project(id: string, name: string, description: string, status: string): Project {
  return {
    id,
    workspace_id: 'mock-workspace-1',
    name,
    description,
    status,
    created_by_user_id: mockSession.user.id,
    created_at: now,
    updated_at: now,
  }
}

function srsDocument(id: string, title: string, status: string): SrsDocument {
  return {
    id,
    workspace_id: 'mock-workspace-1',
    project_id: 'mock-project-1',
    requirement_input_id: `${id}-input`,
    generation_job_id: 'mock-job-1',
    title,
    status,
    content_markdown: `# ${title}\n\n## Introduction\nThis mock SRS document is loaded for frontend review.\n\n## Functional Requirements\n- REQ-014: User shall register and sign in.\n- REQ-021: System shall generate SRS from raw business input.\n- REQ-037: Diagrams should link back to source requirements.`,
    content_json: {},
    created_by_user_id: mockSession.user.id,
    created_at: now,
    updated_at: now,
    extracted_requirements: [
      {
        id: `${id}-req-1`,
        workspace_id: 'mock-workspace-1',
        project_id: 'mock-project-1',
        srs_document_id: id,
        requirement_input_id: `${id}-input`,
        generation_job_id: 'mock-job-1',
        requirement_code: 'REQ-014',
        requirement_text: 'User shall register using email and password.',
        requirement_type: 'functional',
        nfr_subtype: null,
        source_trace: 'Mock source paragraph 1',
        extraction_reason: 'Core authentication requirement.',
        confidence_score: 0.95,
        created_at: now,
      },
    ],
  }
}

function diagram(id: string, title: string, diagram_type: string, current_version: number): Diagram {
  return {
    id,
    workspace_id: 'mock-workspace-1',
    project_id: 'mock-project-1',
    title,
    diagram_type,
    source: 'mock',
    status: 'active',
    current_version,
    created_by_user_id: mockSession.user.id,
    created_at: now,
    updated_at: now,
  }
}

function generationJob(
  id: string,
  job_type: GenerationJob['job_type'],
  status: GenerationJob['status'],
  progress_percent: number,
): GenerationJob {
  return {
    id,
    workspace_id: 'mock-workspace-1',
    project_id: 'mock-project-1',
    requirement_input_id: `${id}-input`,
    job_type,
    status,
    progress_percent,
    generate_class_diagram: job_type !== 'srs',
    diagram_methods: job_type !== 'srs' ? ['llm'] : [],
    result_payload: null,
    error_message: null,
    created_by_user_id: mockSession.user.id,
    created_at: now,
    updated_at: now,
    started_at: now,
    completed_at: status === 'completed' ? now : null,
  }
}
