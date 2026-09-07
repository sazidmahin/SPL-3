import { useEffect, useState } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CircleDollarSign,
  CreditCard,
  FileClock,
  FileText,
  Flag,
  Headphones,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  Network,
  Plug,
  ReceiptText,
  RefreshCcw,
  Settings,
  ShieldAlert,
  UserCircle,
  Users,
  Folder,
  WandSparkles,
} from 'lucide-react'
import { AiGenerationJobs } from '../features/aiJobs/AiGenerationJobs'
import { AuthView } from '../features/auth/AuthView'
import { BillingPanel } from '../features/billing/BillingPanel'
import { CreateDiagramPanel, DiagramsPanel } from '../features/diagram/DiagramPanels'
import { MemberDashboard } from '../features/dashboard/MemberDashboard'
import { ProjectDirectory } from '../features/project/ProjectDirectory'
import { PromptTemplatesPage } from '../features/promptTemplates/PromptTemplatesPage'
import { OrganizationBillingSettings } from '../features/organizationAdmin/OrganizationBillingSettings'
import { OrganizationMembersRoles } from '../features/organizationAdmin/OrganizationMembersRoles'
import { OrganizationMemberDashboard } from '../features/organizationMember/OrganizationMemberDashboard'
import { OrganizationMemberProjectWorkspace } from '../features/organizationMember/OrganizationMemberProjectWorkspace'
import { ProjectWorkspaceView } from '../features/projectWorkspace/ProjectWorkspaceView'
import { SuperAdminPlatformDashboard } from '../features/superAdmin/SuperAdminPlatformDashboard'
import { SuperAdminPlatformPage } from '../features/superAdmin/SuperAdminPlatformPages'
import type { SuperAdminSection } from '../features/superAdmin/SuperAdminPlatformPages'
import { FooterSection } from '../features/footer/FooterSection'
import { AiSettingsPanel, SettingsProfile } from '../features/settings/SettingsProfile'
import { SrsGenerationFlow } from '../features/srs/SrsGenerationFlow'
import { SrsPanel } from '../features/srs/SrsPanel'
import { CreateWorkspacePanel, WorkspacePanel } from '../features/workspace/WorkspacePanels'
import { Card, TooltipProvider } from '../shared/ui'
import { Sidebar } from './Sidebar'
import type { NavGroup, NavItem } from './Sidebar'
import { Topbar } from './Topbar'
import { useAppController } from './useAppController'

type SectionId =
  | 'overview'
  | 'users'
  | 'workspaces'
  | 'projects'
  | 'generate-srs'
  | 'srs'
  | 'diagram-editor'
  | 'ai-jobs'
  | 'requirements'
  | 'exports'
  | 'members'
  | 'prompt-templates'
  | 'plans'
  | 'billing'
  | 'subscription'
  | 'subscriptions'
  | 'usage'
  | 'llm-calls'
  | 'invoices'
  | 'profile'
  | 'settings'
  | 'ai-settings'
  | 'platform-settings'
  | 'audit-logs'
  | 'feature-flags'
  | 'integrations'
  | 'security-events'
  | 'roles-permissions'
  | 'system-health'
  | 'notifications'
  | 'activity-logs'
  | 'support-tickets'
  | 'admin'

const validSections = new Set<SectionId>([
  'overview',
  'users',
  'workspaces',
  'projects',
  'generate-srs',
  'srs',
  'diagram-editor',
  'ai-jobs',
  'requirements',
  'exports',
  'members',
  'prompt-templates',
  'plans',
  'billing',
  'subscription',
  'subscriptions',
  'usage',
  'llm-calls',
  'invoices',
  'profile',
  'settings',
  'ai-settings',
  'platform-settings',
  'audit-logs',
  'feature-flags',
  'integrations',
  'security-events',
  'roles-permissions',
  'system-health',
  'notifications',
  'activity-logs',
  'support-tickets',
  'admin',
])

const sectionLabels: Partial<Record<SectionId, string>> = {
  overview: 'Dashboard',
  users: 'Users',
  workspaces: 'Workspaces',
  projects: 'Projects',
  'generate-srs': 'Generate SRS',
  srs: 'SRS Documents',
  'diagram-editor': 'Diagrams',
  'ai-jobs': 'AI Generation Jobs',
  requirements: 'Requirements',
  exports: 'Exports',
  members: 'Members',
  'prompt-templates': 'Prompt Templates',
  plans: 'Plans',
  billing: 'Billing',
  subscription: 'Subscription',
  subscriptions: 'Subscriptions',
  usage: 'Usage',
  'llm-calls': 'LLM Calls',
  invoices: 'Invoices',
  profile: 'Profile',
  settings: 'Settings',
  'ai-settings': 'AI Settings',
  'platform-settings': 'Platform Settings',
  'audit-logs': 'Audit Logs',
  'feature-flags': 'Feature Flags',
  integrations: 'Integrations',
  'security-events': 'Security Events',
  'roles-permissions': 'Roles & Permissions',
  'system-health': 'System Health',
  notifications: 'Notifications',
  'activity-logs': 'Activity Logs',
  'support-tickets': 'Support Tickets',
  admin: 'Admin',
}

function sectionFromHash(): SectionId {
  const hash = window.location.hash.replace('#', '')
  return validSections.has(hash as SectionId) ? (hash as SectionId) : 'overview'
}

function superAdminSectionFrom(section: SectionId): SuperAdminSection | null {
  if (section === 'subscription') {
    return 'subscriptions'
  }

  return ['users', 'workspaces', 'plans', 'subscriptions', 'ai-jobs', 'llm-calls', 'platform-settings', 'audit-logs'].includes(section)
    ? (section as SuperAdminSection)
    : null
}

export function App() {
  const controller = useAppController()
  const { session, error, signOut } = controller.shell
  const [activeSection, setActiveSection] = useState<SectionId>(() => sectionFromHash())

  useEffect(() => {
    const handleHashChange = () => setActiveSection(sectionFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (!session) {
    return <AuthView {...controller.authView} />
  }

  const currentUser = session.user
  const activeWorkspace = controller.workspacePanel.activeWorkspace
  const activeProject = controller.projectsPanel.activeProject
  const subscription = controller.billingPanel.subscription
  const roleLabel = activeWorkspace?.role ?? 'member'
  const isSuperAdmin = roleLabel === 'super_admin'
  const canAccessAdmin = ['owner', 'admin', 'organization_admin', 'super_admin'].includes(roleLabel)
  const isOrganizationAdmin =
    roleLabel === 'organization_admin' ||
    (activeWorkspace?.workspace.type === 'organization' && ['owner', 'admin'].includes(roleLabel))
  const isOrganizationMember = activeWorkspace?.workspace.type === 'organization' && !isOrganizationAdmin && !isSuperAdmin
  const isPlatformAdminShell = canAccessAdmin

  const memberNavItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'srs', label: 'SRS Documents', icon: FileText },
    { id: 'diagram-editor', label: 'Diagrams', icon: Network },
    { id: 'ai-jobs', label: 'AI Generation Jobs', icon: WandSparkles },
  ]
  const organizationMemberNavItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'My Projects', icon: Folder },
    { id: 'srs', label: 'SRS Documents', icon: FileText },
    { id: 'diagram-editor', label: 'Diagrams', icon: Network },
    { id: 'ai-jobs', label: 'AI Generation Jobs', icon: WandSparkles },
  ]
  const superAdminNavGroups: NavGroup[] = [
    {
      title: 'Management',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'generate-srs', label: 'Generate SRS', icon: WandSparkles },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'workspaces', label: 'Workspaces', icon: Building2 },
        { id: 'plans', label: 'Plans', icon: CreditCard },
        { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCcw },
        { id: 'invoices', label: 'Invoices & Payments', icon: ReceiptText },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { id: 'ai-jobs', label: 'Generation Jobs', icon: Activity },
        { id: 'llm-calls', label: 'LLM Calls', icon: Bot },
        { id: 'usage', label: 'Usage Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { id: 'prompt-templates', label: 'Prompt Templates', icon: MessageSquare },
        { id: 'ai-settings', label: 'AI Settings', icon: Bot },
        { id: 'platform-settings', label: 'Platform Settings', icon: Settings },
        { id: 'feature-flags', label: 'Feature Flags', icon: Flag },
        { id: 'integrations', label: 'Integrations', icon: Plug },
      ],
    },
    {
      title: 'Security',
      items: [
        { id: 'audit-logs', label: 'Admin Audit Logs', icon: FileClock },
        { id: 'security-events', label: 'Security Events', icon: ShieldAlert },
        { id: 'roles-permissions', label: 'Roles & Permissions', icon: LockKeyhole },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: 'system-health', label: 'System Health', icon: HeartPulse },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'activity-logs', label: 'Activity Logs', icon: FileText },
        { id: 'support-tickets', label: 'Support Tickets', icon: Headphones },
      ],
    },
  ]
  const adminNavItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'srs', label: 'SRS Documents', icon: FileText },
    { id: 'diagram-editor', label: 'Diagrams', icon: Network },
    { id: 'ai-jobs', label: 'AI Generation Jobs', icon: WandSparkles },
    { id: 'ai-settings', label: 'AI Settings', icon: Bot },
    { id: 'members', label: 'Members', icon: UserCircle },
    { id: 'billing', label: 'Billing', icon: CircleDollarSign },
  ]

  const primaryNavItems = isOrganizationAdmin ? adminNavItems : isOrganizationMember ? organizationMemberNavItems : memberNavItems
  const billingNavItems: NavItem[] = isSuperAdmin
    ? []
    : isOrganizationAdmin
    ? [
        { id: 'subscription', label: 'Subscription', icon: CircleDollarSign },
        { id: 'usage', label: 'Usage', icon: BarChart3 },
      ]
    : isOrganizationMember
    ? []
    : [
        { id: 'subscription', label: 'Subscription', icon: CircleDollarSign },
        { id: 'usage', label: 'Usage', icon: BarChart3 },
        { id: 'invoices', label: 'Invoices', icon: FileText },
      ]
  const accountNavItems: NavItem[] = isSuperAdmin
    ? []
    : [
        { id: 'profile', label: 'Profile', icon: UserCircle },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'ai-settings', label: 'AI Settings', icon: Bot },
      ]

  const navGroups: NavGroup[] = isPlatformAdminShell
    ? superAdminNavGroups
    : [
        { items: primaryNavItems },
        ...(billingNavItems.length ? [{ items: billingNavItems }] : []),
        ...(accountNavItems.length ? [{ items: accountNavItems }] : []),
        ...(canAccessAdmin ? [{ items: [{ id: 'admin', label: 'Admin', icon: Settings } as NavItem] }] : []),
      ]

  const workspaceTools = (
    <aside className="grid min-w-0 gap-4 lg:sticky lg:top-20">
      <div className="grid gap-4" id="workspace">
        <Card className="p-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Signed in</span>
          <h2 className="mt-1 font-display text-lg font-bold text-fg">{currentUser.full_name}</h2>
          <p className="text-[13px] text-fg-2">{currentUser.email}</p>
        </Card>
        <WorkspacePanel {...controller.workspacePanel} />
        <CreateWorkspacePanel {...controller.createWorkspacePanel} />
      </div>
      <div className="grid gap-4" id="billing">
        <BillingPanel {...controller.billingPanel} />
      </div>
      <CreateDiagramPanel {...controller.createDiagramPanel} />
    </aside>
  )

  const generateSrsSection = <SrsGenerationFlow {...controller.srsPanel} />

  const projectWorkspace = (
    <ProjectWorkspaceView
      activeProject={activeProject}
      srsDocuments={controller.srsPanel.srsDocuments}
      diagrams={controller.diagramsPanel.diagrams}
      generationJobs={controller.srsPanel.generationJobs}
      srsTools={
        <div id="srs">
          <SrsPanel {...controller.srsPanel} />
        </div>
      }
      diagramTools={
        <div id="diagrams">
          <DiagramsPanel {...controller.diagramsPanel} />
        </div>
      }
    />
  )

  function renderActiveSection() {
    if (activeSection === 'ai-settings') {
      return (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23.75rem]">
          <div className="min-w-0">
            <AiSettingsPanel {...controller.aiSettingsPanel} />
          </div>
          {workspaceTools}
        </section>
      )
    }

    if (isSuperAdmin) {
      const superAdminSection = superAdminSectionFrom(activeSection)

      if (superAdminSection) {
        return (
          <SuperAdminPlatformPage
            section={superAdminSection}
            user={currentUser}
            activeWorkspace={activeWorkspace}
            generationJobs={controller.srsPanel.generationJobs}
          />
        )
      }

      if (activeSection === 'prompt-templates') {
        return <PromptTemplatesPage />
      }

      if (activeSection === 'generate-srs') {
        return generateSrsSection
      }

      return (
        <SuperAdminPlatformDashboard
          user={currentUser}
          activeWorkspace={activeWorkspace}
          projects={controller.projectsPanel.projects}
          srsDocuments={controller.srsPanel.srsDocuments}
          diagrams={controller.diagramsPanel.diagrams}
          generationJobs={controller.srsPanel.generationJobs}
          subscription={subscription}
          usage={controller.billingPanel.usage}
        />
      )
    }

    if (!isSuperAdmin && canAccessAdmin) {
      const adminPlatformSection = superAdminSectionFrom(activeSection)

      if (activeSection === 'generate-srs') {
        return generateSrsSection
      }

      if (adminPlatformSection) {
        return (
          <SuperAdminPlatformPage
            section={adminPlatformSection}
            user={currentUser}
            activeWorkspace={activeWorkspace}
            generationJobs={controller.srsPanel.generationJobs}
          />
        )
      }
    }

    if (activeSection === 'projects' && isOrganizationMember) {
      return (
        <OrganizationMemberProjectWorkspace
          user={currentUser}
          activeWorkspace={activeWorkspace}
          activeProject={activeProject}
          projects={controller.projectsPanel.projects}
          srsDocuments={controller.srsPanel.srsDocuments}
          diagrams={controller.diagramsPanel.diagrams}
        />
      )
    }

    if (activeSection === 'projects') {
      return (
        <ProjectDirectory
          activeWorkspace={activeWorkspace}
          activeProject={activeProject}
          projects={controller.projectsPanel.projects}
          isLoadingProjects={controller.projectsPanel.isLoadingProjects}
          projectName={controller.createProjectPanel.projectName}
          projectDescription={controller.createProjectPanel.projectDescription}
          isCreatingProject={controller.createProjectPanel.isCreatingProject}
          onReload={controller.projectsPanel.onReload}
          onSelectProject={controller.projectsPanel.onSelectProject}
          onProjectNameChange={controller.createProjectPanel.onProjectNameChange}
          onProjectDescriptionChange={controller.createProjectPanel.onProjectDescriptionChange}
          onSubmit={controller.createProjectPanel.onSubmit}
        />
      )
    }

    if (activeSection === 'diagram-editor') {
      return (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23.75rem]">
          <div className="min-w-0">
            <DiagramsPanel {...controller.diagramsPanel} />
          </div>
          {workspaceTools}
        </section>
      )
    }

    if (activeSection === 'ai-jobs') {
      return (
        <AiGenerationJobs
          generationJobs={controller.srsPanel.generationJobs}
          projects={controller.projectsPanel.projects}
        />
      )
    }

    if (['srs', 'requirements', 'exports'].includes(activeSection)) {
      return (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23.75rem]">
          <div className="min-w-0">{projectWorkspace}</div>
          {workspaceTools}
        </section>
      )
    }

    if (['subscription', 'usage', 'invoices', 'billing'].includes(activeSection)) {
      if (isOrganizationAdmin) {
        return (
          <OrganizationBillingSettings
            activeWorkspace={activeWorkspace}
            subscription={subscription}
            usage={controller.billingPanel.usage}
          />
        )
      }

      return (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23.75rem]">
          <div className="min-w-0">
            <BillingPanel {...controller.billingPanel} />
          </div>
          {workspaceTools}
        </section>
      )
    }

    if (activeSection === 'members' && isOrganizationAdmin) {
      return <OrganizationMembersRoles user={currentUser} activeWorkspace={activeWorkspace} subscription={subscription} />
    }

    if (activeSection === 'prompt-templates' && isOrganizationAdmin) {
      return <PromptTemplatesPage />
    }

    if (['profile', 'settings', 'ai-settings', 'admin', 'members'].includes(activeSection)) {
      return (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23.75rem]">
          <div className="min-w-0">
            <SettingsProfile user={currentUser} {...controller.aiSettingsPanel} />
          </div>
          {workspaceTools}
        </section>
      )
    }

    if (isOrganizationAdmin) {
      return (
        <SuperAdminPlatformDashboard
          user={currentUser}
          activeWorkspace={activeWorkspace}
          projects={controller.projectsPanel.projects}
          srsDocuments={controller.srsPanel.srsDocuments}
          diagrams={controller.diagramsPanel.diagrams}
          generationJobs={controller.srsPanel.generationJobs}
          subscription={subscription}
          usage={controller.billingPanel.usage}
        />
      )
    }

    if (isOrganizationMember) {
      return (
        <OrganizationMemberDashboard
          user={currentUser}
          activeWorkspace={activeWorkspace}
          projects={controller.projectsPanel.projects}
          srsDocuments={controller.srsPanel.srsDocuments}
          diagrams={controller.diagramsPanel.diagrams}
          usage={controller.billingPanel.usage}
        />
      )
    }

    return (
      <MemberDashboard
        user={currentUser}
        activeWorkspace={activeWorkspace}
        activeProject={activeProject}
        projects={controller.projectsPanel.projects}
        srsDocuments={controller.srsPanel.srsDocuments}
        diagrams={controller.diagramsPanel.diagrams}
        generationJobs={controller.srsPanel.generationJobs}
        subscription={subscription}
        usage={controller.billingPanel.usage}
      />
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh bg-bg">
        <Sidebar
          user={currentUser}
          roleLabel={roleLabel}
          groups={navGroups}
          activeSection={activeSection}
          workspaces={controller.workspacePanel.workspaces}
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={controller.workspacePanel.onSelectWorkspace}
          onSignOut={signOut}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            workspaceName={activeWorkspace?.workspace.name ?? 'Personal Workspace'}
            sectionLabel={sectionLabels[activeSection] ?? 'Dashboard'}
            user={currentUser}
            onSignOut={signOut}
          />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-8 sm:py-7">
            {error ? (
              <p className="mb-4 rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            ) : null}
            {renderActiveSection()}
            <FooterSection />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
