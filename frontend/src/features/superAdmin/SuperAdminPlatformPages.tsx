import {
  Bot,
  Building2,
  CreditCard,
  Database,
  FileClock,
  ServerCog,
  UserCog,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AuthUser } from '../../domains/auth/types'
import type { GenerationJob } from '../../domains/srs/types'
import type { PipelineRun } from '../../domains/generationPipeline/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { EmptyState, PageHeader } from '../../shared/ui'
import { AiGenerationJobs } from '../aiJobs/AiGenerationJobs'

export type SuperAdminSection =
  | 'users'
  | 'workspaces'
  | 'subscriptions'
  | 'ai-jobs'
  | 'llm-calls'
  | 'platform-settings'
  | 'audit-logs'

type SuperAdminPlatformPageProps = {
  section: SuperAdminSection
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  generationJobs: GenerationJob[]
  projects?: Project[]
  pipelineRuns?: PipelineRun[]
}

const pageConfig: Record<SuperAdminSection, { title: string; description: string; icon: LucideIcon }> = {
  users: { title: 'Users', description: 'Review platform users, roles, and account status.', icon: UserCog },
  workspaces: {
    title: 'Workspaces',
    description: 'Manage personal and organization workspaces, ownership, and plans.',
    icon: Building2,
  },
  subscriptions: { title: 'Subscriptions', description: 'Monitor billing state and plan changes.', icon: CreditCard },
  'ai-jobs': { title: 'AI Generation Jobs', description: 'Track AI job status and performance.', icon: Bot },
  'llm-calls': { title: 'LLM / API Call Logs', description: 'Inspect model usage, latency, and cost.', icon: Database },
  'platform-settings': { title: 'Platform Settings', description: 'System-wide controls for super admins.', icon: ServerCog },
  'audit-logs': { title: 'Admin Audit Logs', description: 'Review admin actions and access logs.', icon: FileClock },
}

export function SuperAdminPlatformPage({ section, generationJobs, projects = [], pipelineRuns = [] }: SuperAdminPlatformPageProps) {
  if (section === 'ai-jobs') {
    return <AiGenerationJobs generationJobs={generationJobs} projects={projects} pipelineRuns={pipelineRuns} />
  }

  const config = pageConfig[section]
  return (
    <section className="grid grid-cols-1 gap-6" id={section}>
      <PageHeader title={config.title} description={config.description} />
      <EmptyState
        icon={config.icon}
        title="Not available yet"
        description="This platform-admin view is not connected to a data source in this build."
      />
    </section>
  )
}
