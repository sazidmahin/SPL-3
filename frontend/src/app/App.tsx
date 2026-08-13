import { useEffect, useState } from 'react'
import '../shared/ui.css'
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  CreditCard,
  FileClock,
  FileText,
  Flag,
  Headphones,
  HeartPulse,
  LockKeyhole,
  Plug,
  ReceiptText,
  ShieldAlert,
  Users,
  Folder,
  Home,
  LogOut,
  MessageSquare,
  Network,
  RefreshCcw,
  Settings,
  UserCircle,
  WandSparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AiGenerationJobs } from '../features/aiJobs/AiGenerationJobs'
import { AuthView } from '../features/auth/AuthView'
import { BillingPanel } from '../features/billing/BillingPanel'
import { CreateDiagramPanel, DiagramsPanel } from '../features/diagram/DiagramPanels'
import { MemberDashboard } from '../features/dashboard/MemberDashboard'
import { DiagramEditorMock } from '../features/diagramEditor/DiagramEditor'
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
import { SettingsProfile } from '../features/settings/SettingsProfile'
import { SrsGenerationFlow } from '../features/srs/SrsGenerationFlow'
import { SrsPanel } from '../features/srs/SrsPanel'
import { UpgradeFlow } from '../features/upgrade/UpgradeFlow'
import { CreateWorkspacePanel, WorkspacePanel } from '../features/workspace/WorkspacePanels'
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
  const [isAdminSidebarCollapsed, setIsAdminSidebarCollapsed] = useState(false)

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
  const memberNavItems: Array<{ id: SectionId; label: string; icon: LucideIcon }> = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'srs', label: 'SRS Documents', icon: FileText },
    { id: 'diagram-editor', label: 'Diagrams', icon: Network },
    { id: 'ai-jobs', label: 'AI Generation Jobs', icon: WandSparkles },
    { id: 'requirements', label: 'Requirements', icon: BriefcaseBusiness },
    { id: 'exports', label: 'Exports', icon: FileText },
  ]
  const organizationMemberNavItems: Array<{ id: SectionId; label: string; icon: LucideIcon }> = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'My Projects', icon: Folder },
    { id: 'srs', label: 'SRS Documents', icon: FileText },
    { id: 'diagram-editor', label: 'Diagrams', icon: Network },
    { id: 'ai-jobs', label: 'AI Generation Jobs', icon: WandSparkles },
    { id: 'requirements', label: 'Requirements', icon: BriefcaseBusiness },
    { id: 'exports', label: 'Exports', icon: FileText },
  ]
  const superAdminNavGroups: Array<{ title: string; items: Array<{ id: SectionId; label: string; icon: LucideIcon }> }> = [
    {
      title: 'Management',
      items: [
        { id: 'overview', label: 'Dashboard', icon: Home },
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
  const adminNavItems: Array<{ id: SectionId; label: string; icon: LucideIcon }> = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'srs', label: 'SRS Documents', icon: FileText },
    { id: 'diagram-editor', label: 'Diagrams', icon: Network },
    { id: 'ai-jobs', label: 'AI Generation Jobs', icon: WandSparkles },
    { id: 'members', label: 'Members', icon: UserCircle },
    { id: 'prompt-templates', label: 'Prompt Templates', icon: BriefcaseBusiness },
    { id: 'billing', label: 'Billing', icon: CircleDollarSign },
  ]
  const primaryNavItems = isOrganizationAdmin ? adminNavItems : isOrganizationMember ? organizationMemberNavItems : memberNavItems
  const billingNavItems: Array<{ id: SectionId; label: string; icon: LucideIcon }> = isSuperAdmin
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
  const accountNavItems: Array<{ id: SectionId; label: string; icon: LucideIcon }> = isSuperAdmin ? [] : [
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const workspaceTools = (
    <aside className="grid min-w-0 gap-4 lg:sticky lg:top-5">
      <div className="grid gap-4" id="workspace">
        <article className="panel identity-panel">
          <span className="panel-label">Signed in</span>
          <h2>{currentUser.full_name}</h2>
          <p>{currentUser.email}</p>
        </article>
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
          <div className="min-w-0"><DiagramEditorMock /></div>
          {workspaceTools}
        </section>
      )
    }

    if (activeSection === 'ai-jobs') {
      return <AiGenerationJobs />
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
          <div className="min-w-0"><BillingPanel {...controller.billingPanel} /></div>
          {workspaceTools}
        </section>
      )
    }

    if (activeSection === 'members' && isOrganizationAdmin) {
      return (
        <OrganizationMembersRoles
          user={currentUser}
          activeWorkspace={activeWorkspace}
          subscription={subscription}
        />
      )
    }

    if (activeSection === 'prompt-templates' && isOrganizationAdmin) {
      return <PromptTemplatesPage />
    }

    if (activeSection === 'settings' && isOrganizationAdmin) {
      return (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23.75rem]">
          <div className="min-w-0"><SettingsProfile user={currentUser} {...controller.aiSettingsPanel} /></div>
          {workspaceTools}
        </section>
      )
    }

    if (['profile', 'settings', 'admin', 'members'].includes(activeSection)) {
      return (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23.75rem]">
          <div className="min-w-0"><SettingsProfile user={currentUser} {...controller.aiSettingsPanel} /></div>
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
      <>
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
        <UpgradeFlow />
      </>
    )
  }

  function navLinkClass(id: SectionId) {
    const active = activeSection === id
    const collapsed = isPlatformAdminShell && isAdminSidebarCollapsed
    return `flex min-h-11 items-center gap-3.5 rounded-lg px-3.5 text-[15px] font-bold transition ${collapsed ? 'justify-center px-0' : ''} ${active ? 'bg-linear-to-r from-violet-700 to-violet-900 text-white shadow-lg shadow-violet-950/20' : 'text-slate-200 hover:bg-slate-800 hover:text-white'}`
  }

  function renderNavItem(item: { id: SectionId; label: string; icon: LucideIcon }) {
    const Icon = item.icon
    return (
      <a className={navLinkClass(item.id)} href={`#${item.id}`} key={item.id}>
        <Icon size={20} />
        <span className={isPlatformAdminShell && isAdminSidebarCollapsed ? 'hidden' : undefined}>{item.label}</span>
      </a>
    )
  }

  function renderSuperAdminNav() {
    return superAdminNavGroups.map((group) => (
      <section className={`grid gap-2 border-b border-slate-700/50 px-2.5 py-4 ${isAdminSidebarCollapsed ? 'justify-items-center px-0' : ''}`} key={group.title}>
        <h2 className={`text-xs font-extrabold uppercase tracking-wide text-slate-400 ${isAdminSidebarCollapsed ? 'hidden' : ''}`}>{group.title}</h2>
        <div className={`grid gap-1 ${isAdminSidebarCollapsed ? 'justify-items-center' : ''}`}>
          {group.items.map(renderNavItem)}
        </div>
      </section>
    ))
  }

  return (
    <main className={`grid min-h-svh bg-slate-50 xl:grid-cols-[15.25rem_minmax(0,1fr)] ${isPlatformAdminShell ? 'xl:grid-cols-[16.25rem_minmax(0,1fr)]' : ''} ${isPlatformAdminShell && isAdminSidebarCollapsed ? 'xl:grid-cols-[4.5rem_minmax(0,1fr)]' : ''}`}>
      <aside className={`grid min-h-0 grid-rows-[auto_1fr_auto] gap-5 overflow-y-auto bg-linear-to-b from-slate-950 via-slate-950 to-slate-950 px-4 py-6 text-slate-100 shadow-xl xl:sticky xl:top-0 xl:h-svh ${isAdminSidebarCollapsed ? 'px-2' : ''}`} aria-label="Primary">
        {isPlatformAdminShell ? (
          <button
            className="absolute right-2.5 top-3 grid size-7 place-items-center rounded-full border border-slate-600 bg-slate-900 text-slate-100 shadow-lg transition hover:bg-violet-700"
            type="button"
            aria-label={isAdminSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setIsAdminSidebarCollapsed((collapsed) => !collapsed)}
          >
            {isAdminSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        ) : null}
        <div className={`flex min-h-15 items-center gap-3 border-b border-slate-700/50 pb-4 ${isAdminSidebarCollapsed ? 'justify-center' : ''}`}>
          <span className="grid size-11 place-items-center rounded-xl border border-violet-500/70 bg-violet-700/15 text-violet-300"><Network size={22} /></span>
          <div className={isAdminSidebarCollapsed ? 'hidden' : undefined}>
            <strong className="block text-xl font-extrabold text-white">SRS Platform</strong>
            {isPlatformAdminShell ? <small className="mt-1 block text-sm font-bold text-violet-400">Platform Admin</small> : null}
          </div>
        </div>

        <nav className="grid content-start gap-1" aria-label="Dashboard sections">
          {isPlatformAdminShell ? (
            renderSuperAdminNav()
          ) : (
            <>
              {primaryNavItems.map(renderNavItem)}
              <span className="my-3 h-px bg-slate-700/50" />
              {billingNavItems.map(renderNavItem)}
              {billingNavItems.length > 0 ? <span className="my-3 h-px bg-slate-700/50" /> : null}
              {accountNavItems.map(renderNavItem)}
              {canAccessAdmin ? renderNavItem({ id: 'admin', label: 'Admin', icon: Settings }) : null}
              <button className={`flex min-h-11 items-center gap-3.5 rounded-lg px-3.5 text-[15px] font-bold text-red-200 transition hover:bg-red-950/60 hover:text-white ${isAdminSidebarCollapsed ? 'justify-center px-0' : ''}`} type="button" onClick={signOut}>
                <LogOut size={20} />
                <span className={isAdminSidebarCollapsed ? 'hidden' : undefined}>Logout</span>
              </button>
            </>
          )}
        </nav>

        <div className={`grid gap-2 rounded-xl bg-slate-900 p-3 ${isAdminSidebarCollapsed ? 'bg-transparent p-0' : ''}`}>
          {isPlatformAdminShell ? (
            <div className={`grid gap-2.5 ${isAdminSidebarCollapsed ? 'justify-items-center' : ''}`}>
              <div className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 ${isAdminSidebarCollapsed ? 'flex justify-center' : ''}`}>
                <span className="grid size-11 place-items-center rounded-full bg-linear-to-br from-violet-500 to-violet-800 text-sm font-extrabold text-white">{isSuperAdmin ? 'SA' : 'PA'}</span>
                <div className={isAdminSidebarCollapsed ? 'hidden' : undefined}>
                  <strong className="block text-sm font-extrabold text-white">{isSuperAdmin ? 'Super Admin' : 'Platform Admin'}</strong>
                  <p className="mt-1 truncate text-xs text-slate-400">{currentUser.email || 'superadmin@srs.com'}</p>
                </div>
              </div>
              <button className={`flex min-h-10 items-center gap-2.5 rounded-lg border border-red-400/20 bg-red-950/30 px-3 text-sm font-bold text-red-200 transition hover:bg-red-900/50 hover:text-white ${isAdminSidebarCollapsed ? 'grid size-10 place-items-center p-0' : ''}`} type="button" onClick={signOut}>
                <LogOut size={18} />
                <span className={isAdminSidebarCollapsed ? 'hidden' : undefined}>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <span className="text-base font-extrabold text-white">Pro Plan</span>
              <p className="text-sm text-slate-400">Renews on Jun 18, 2025</p>
              <button className="min-h-10 rounded-lg bg-linear-to-b from-violet-600 to-violet-700 px-3 text-sm font-extrabold text-white transition hover:from-violet-500 hover:to-violet-600" type="button">Manage Subscription</button>
            </>
          )}
        </div>
      </aside>

      <div className="min-w-0 bg-slate-50 p-4 sm:p-7">
        {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        {renderActiveSection()}
        <FooterSection />
      </div>
    </main>
  )
}



















