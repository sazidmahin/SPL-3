import {
  Bot,
  Building2,
  CreditCard,
  Database,
  FileClock,
  FileText,
  ServerCog,
  UserCog,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AuthUser } from '../../domains/auth/types'
import type { GenerationJob } from '../../domains/srs/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { EmptyState, PageHeader } from '../../shared/ui'
import { AiGenerationJobs } from '../aiJobs/AiGenerationJobs'

export type SuperAdminSection =
  | 'users'
  | 'workspaces'
  | 'plans'
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
}

const pageConfig: Record<SuperAdminSection, { title: string; description: string; icon: LucideIcon }> = {
  users: { title: 'Users', description: 'Review platform users, roles, and account status.', icon: UserCog },
  workspaces: {
    title: 'Workspaces',
    description: 'Manage personal and organization workspaces, ownership, and plans.',
    icon: Building2,
  },
  plans: { title: 'Plans', description: 'Define pricing plans, features, and limits.', icon: FileText },
  subscriptions: { title: 'Subscriptions', description: 'Monitor billing state and plan changes.', icon: CreditCard },
  'ai-jobs': { title: 'AI Generation Jobs', description: 'Track AI job status and performance.', icon: Bot },
  'llm-calls': { title: 'LLM / API Call Logs', description: 'Inspect model usage, latency, and cost.', icon: Database },
  'platform-settings': { title: 'Platform Settings', description: 'System-wide controls for super admins.', icon: ServerCog },
  'audit-logs': { title: 'Admin Audit Logs', description: 'Review admin actions and access logs.', icon: FileClock },
}

export function SuperAdminPlatformPage({ section, generationJobs }: SuperAdminPlatformPageProps) {
  if (section === 'ai-jobs') {
    return <AiGenerationJobs generationJobs={generationJobs} projects={[]} />
  }

  const config = pageConfig[section]
  return (
    <section className="grid gap-6" id={section}>
      <PageHeader title={config.title} description={config.description} />
      <EmptyState
        icon={config.icon}
        title="Not available yet"
        description="This platform-admin view is not connected to a data source in this build."
      />
    </section>
  )
}
