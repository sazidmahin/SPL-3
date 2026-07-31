import { useEffect, useState } from 'react'
import '../App.css'
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  CreditCard,
  FileClock,
  FileText,
  Users,
  Folder,
  Home,
  LayoutDashboard,
  LogOut,
  Network,
  ServerCog,
  Settings,
  UserCircle,
  WandSparkles,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AiGenerationJobs } from '../features/aiJobs/AiGenerationJobs'
import { AuthView } from '../features/auth/AuthView'
import { BillingPanel } from '../features/billing/BillingPanel'
import { CreateDiagramPanel, DiagramsPanel } from '../features/diagram/DiagramPanels'
import { MemberDashboard } from '../features/dashboard/MemberDashboard'
import { DiagramEditorMock } from '../features/diagramEditor/DiagramEditor'
import { ProjectDirectory } from '../features/project/ProjectDirectory'
import { OrganizationAdminDashboard } from '../features/organizationAdmin/OrganizationAdminDashboard'
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
import { SrsPanel } from '../features/srs/SrsPanel'
import { UpgradeFlow } from '../features/upgrade/UpgradeFlow'
import { CreateWorkspacePanel, WorkspacePanel } from '../features/workspace/WorkspacePanels'
import { useAppController } from './useAppController'

type SectionId =
  | 'overview'
  | 'users'
  | 'workspaces'
  | 'projects'
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
  | 'admin'

const validSections = new Set<SectionId>([
  'overview',
  'users',
  'workspaces',
  'projects',
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
  const superAdminNavItems: Array<{ id: SectionId; label: string; icon: LucideIcon }> = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'workspaces', label: 'Workspaces', icon: Building2 },
    { id: 'plans', label: 'Plans', icon: WalletCards },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'ai-jobs', label: 'AI Generation Jobs', icon: Bot },
    { id: 'llm-calls', label: 'LLM / API Call Logs', icon: BarChart3 },
    { id: 'platform-settings', label: 'Platform Settings', icon: ServerCog },
    { id: 'audit-logs', label: 'Admin Audit Logs', icon: FileClock },
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
  const primaryNavItems = isSuperAdmin ? superAdminNavItems : isOrganizationAdmin ? adminNavItems : isOrganizationMember ? organizationMemberNavItems : memberNavItems
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
    <aside className="workbench-side">
      <div id="workspace">
        <article className="panel identity-panel">
          <span className="panel-label">Signed in</span>
          <h2>{currentUser.full_name}</h2>
          <p>{currentUser.email}</p>
        </article>
        <WorkspacePanel {...controller.workspacePanel} />
        <CreateWorkspacePanel {...controller.createWorkspacePanel} />
      </div>
      <div id="billing">
        <BillingPanel {...controller.billingPanel} />
      </div>
      <CreateDiagramPanel {...controller.createDiagramPanel} />
    </aside>
  )

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
        <section className="workbench-layout">
          <div className="workbench-main"><DiagramEditorMock /></div>
          {workspaceTools}
        </section>
      )
    }

    if (activeSection === 'ai-jobs') {
      return <AiGenerationJobs />
    }

    if (['srs', 'requirements', 'exports'].includes(activeSection)) {
      return (
        <section className="workbench-layout">
          <div className="workbench-main">{projectWorkspace}</div>
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
        <section className="workbench-layout">
          <div className="workbench-main"><BillingPanel {...controller.billingPanel} /></div>
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

    if (activeSection === 'settings' && isOrganizationAdmin) {
      return (
        <OrganizationBillingSettings
          activeWorkspace={activeWorkspace}
          subscription={subscription}
          usage={controller.billingPanel.usage}
        />
      )
    }

    if (['profile', 'settings', 'admin', 'members', 'prompt-templates'].includes(activeSection)) {
      return (
        <section className="workbench-layout">
          <div className="workbench-main"><SettingsProfile user={currentUser} /></div>
          {workspaceTools}
        </section>
      )
    }

    if (isOrganizationAdmin) {
      return (
        <OrganizationAdminDashboard
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
    return activeSection === id ? 'active' : undefined
  }

  function renderNavItem(item: { id: SectionId; label: string; icon: LucideIcon }) {
    const Icon = item.icon
    return (
      <a className={navLinkClass(item.id)} href={`#${item.id}`} key={item.id}>
        <Icon size={20} />
        {item.label}
      </a>
    )
  }

  return (
    <main className="platform-shell target-user-shell">
      <aside className="platform-sidebar" aria-label="Primary">
        <div className="brand-lockup">
          <span className="brand-mark"><Network size={22} /></span>
          <div>
            <strong>SRS Platform</strong>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard sections">
          {primaryNavItems.map(renderNavItem)}
          <span className="sidebar-divider" />
          {billingNavItems.map(renderNavItem)}
          {billingNavItems.length > 0 ? <span className="sidebar-divider" /> : null}
          {accountNavItems.map(renderNavItem)}
          {canAccessAdmin && !isSuperAdmin ? renderNavItem({ id: 'admin', label: 'Admin', icon: Settings }) : null}
        </nav>

        <div className="sidebar-context pro-plan-card">
          <span>{isSuperAdmin ? 'Platform Control' : 'Pro Plan'}</span>
          <p>{isSuperAdmin ? 'All systems operational' : 'Renews on Jun 18, 2025'}</p>
          <button type="button">{isSuperAdmin ? 'Collapse' : 'Manage Subscription'}</button>
          <button className="sidebar-logout-button" type="button" onClick={signOut}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <div className="platform-main target-user-main">
        {error ? <p className="status-message error-message">{error}</p> : null}
        {renderActiveSection()}
        <FooterSection />
      </div>
    </main>
  )
}
