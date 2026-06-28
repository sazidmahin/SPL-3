import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { authenticate, fetchCurrentUser } from './domains/auth/api'
import { clearStoredSession, readStoredSession, writeStoredSession } from './domains/auth/sessionStorage'
import type { AuthMode, AuthSession } from './domains/auth/types'
import { checkoutPlan as checkoutPlanRequest, fetchBillingSummary } from './domains/billing/api'
import type { Plan, Subscription, Usage } from './domains/billing/types'
import {
  createDiagramVersion,
  createManualDiagram,
  fetchDiagramDetail,
  fetchDiagrams,
  fetchDiagramVersions,
  generateClassDiagram,
} from './domains/diagram/api'
import { BLANK_DRAWIO_XML } from './domains/diagram/constants'
import type { ClassDiagramMethod, Diagram, DiagramDetail, DiagramVersion } from './domains/diagram/types'
import { createProject as createProjectRequest, fetchProjects } from './domains/project/api'
import type { Project } from './domains/project/types'
import {
  fetchGenerationJobs,
  fetchSrsDocumentDetail,
  fetchSrsDocuments,
  generateSrs,
} from './domains/srs/api'
import type { GenerationJob, SrsDocument } from './domains/srs/types'
import { createWorkspace as createWorkspaceRequest } from './domains/workspace/api'
import type { WorkspaceMembership } from './domains/workspace/types'
import { PROJECT_STORAGE_KEY, DIAGRAM_STORAGE_KEY, WORKSPACE_STORAGE_KEY } from './shared/storage'
import { AuthView } from './features/auth/AuthView'
import { BillingPanel } from './features/billing/BillingPanel'
import { CreateDiagramPanel, DiagramsPanel } from './features/diagram/DiagramPanels'
import { CreateProjectPanel, ProjectsPanel } from './features/project/ProjectPanels'
import { SrsPanel } from './features/srs/SrsPanel'
import { CreateWorkspacePanel, WorkspacePanel } from './features/workspace/WorkspacePanels'

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [diagrams, setDiagrams] = useState<Diagram[]>([])
  const [diagramVersions, setDiagramVersions] = useState<DiagramVersion[]>([])
  const [activeReviewDiagrams, setActiveReviewDiagrams] = useState<DiagramDetail[]>([])
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([])
  const [srsDocuments, setSrsDocuments] = useState<SrsDocument[]>([])
  const [activeSrsDocument, setActiveSrsDocument] = useState<SrsDocument | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() =>
    window.localStorage.getItem(WORKSPACE_STORAGE_KEY),
  )
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    window.localStorage.getItem(PROJECT_STORAGE_KEY),
  )
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(() =>
    window.localStorage.getItem(DIAGRAM_STORAGE_KEY),
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [diagramTitle, setDiagramTitle] = useState('')
  const [diagramType, setDiagramType] = useState('class')
  const [diagramXml, setDiagramXml] = useState(BLANK_DRAWIO_XML)
  const [srsTitle, setSrsTitle] = useState('')
  const [srsRawText, setSrsRawText] = useState('')
  const [generateClassDiagramFromSrsInput, setGenerateClassDiagramFromSrsInput] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingMe, setIsLoadingMe] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isLoadingDiagrams, setIsLoadingDiagrams] = useState(false)
  const [isLoadingBilling, setIsLoadingBilling] = useState(false)
  const [isLoadingGenerationJobs, setIsLoadingGenerationJobs] = useState(false)
  const [isLoadingSrsDocuments, setIsLoadingSrsDocuments] = useState(false)
  const [isSavingDiagram, setIsSavingDiagram] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isStartingGeneration, setIsStartingGeneration] = useState(false)
  const [isGeneratingClassDiagram, setIsGeneratingClassDiagram] = useState(false)
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isCreatingDiagram, setIsCreatingDiagram] = useState(false)

  const activeWorkspace = useMemo(
    () => workspaces.find((membership) => membership.workspace.id === activeWorkspaceId) ?? workspaces[0],
    [activeWorkspaceId, workspaces],
  )

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId, projects],
  )

  const activeDiagram = useMemo(
    () => diagrams.find((diagram) => diagram.id === activeDiagramId) ?? diagrams[0],
    [activeDiagramId, diagrams],
  )

  function clearProjectState() {
    setProjects([])
    setDiagrams([])
    setDiagramVersions([])
    setGenerationJobs([])
    setSrsDocuments([])
    setActiveSrsDocument(null)
    setActiveProjectId(null)
    setActiveDiagramId(null)
    setDiagramXml(BLANK_DRAWIO_XML)
    window.localStorage.removeItem(PROJECT_STORAGE_KEY)
    window.localStorage.removeItem(DIAGRAM_STORAGE_KEY)
  }

  function clearDiagramState() {
    setDiagrams([])
    setDiagramVersions([])
    setActiveDiagramId(null)
    setDiagramXml(BLANK_DRAWIO_XML)
    window.localStorage.removeItem(DIAGRAM_STORAGE_KEY)
  }

  async function loadBilling(authSession: AuthSession, workspaceId: string) {
    setIsLoadingBilling(true)
    setError(null)
    try {
      const summary = await fetchBillingSummary(authSession.access_token, workspaceId)
      setPlans(summary.plans)
      setSubscription(summary.subscription)
      setUsage(summary.usage)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load billing')
    } finally {
      setIsLoadingBilling(false)
    }
  }

  async function loadGenerationJobs(authSession: AuthSession, workspaceId: string, projectId: string) {
    setIsLoadingGenerationJobs(true)
    setError(null)
    try {
      const nextJobs = await fetchGenerationJobs(authSession.access_token, workspaceId, projectId)
      setGenerationJobs(nextJobs)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load generation jobs')
    } finally {
      setIsLoadingGenerationJobs(false)
    }
  }

  async function loadSrsDocumentDetail(
    authSession: AuthSession,
    workspaceId: string,
    projectId: string,
    documentId: string,
  ) {
    const document = await fetchSrsDocumentDetail(authSession.access_token, workspaceId, projectId, documentId)
    setActiveSrsDocument(document)
    setSrsDocuments((current) =>
      current.some((item) => item.id === document.id)
        ? current.map((item) => (item.id === document.id ? document : item))
        : [document, ...current],
    )
  }

  async function loadSrsDocuments(authSession: AuthSession, workspaceId: string, projectId: string) {
    setIsLoadingSrsDocuments(true)
    setError(null)
    try {
      const documents = await fetchSrsDocuments(authSession.access_token, workspaceId, projectId)
      setSrsDocuments(documents)
      if (documents[0]) {
        await loadSrsDocumentDetail(authSession, workspaceId, projectId, documents[0].id)
      } else {
        setActiveSrsDocument(null)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load SRS documents')
    } finally {
      setIsLoadingSrsDocuments(false)
    }
  }

  async function loadDiagramDetail(
    authSession: AuthSession,
    workspaceId: string,
    projectId: string,
    diagramId: string,
  ) {
    const [detail, versions] = await Promise.all([
      fetchDiagramDetail(authSession.access_token, workspaceId, projectId, diagramId),
      fetchDiagramVersions(authSession.access_token, workspaceId, projectId, diagramId),
    ])
    setDiagramXml(detail.current.drawio_xml)
    setDiagramVersions(versions)
    setActiveDiagramId(diagramId)
    window.localStorage.setItem(DIAGRAM_STORAGE_KEY, diagramId)
  }

  async function loadDiagrams(authSession: AuthSession, workspaceId: string, projectId: string) {
    setIsLoadingDiagrams(true)
    setError(null)
    try {
      const nextDiagrams = await fetchDiagrams(authSession.access_token, workspaceId, projectId)
      setDiagrams(nextDiagrams)
      const nextDiagramId = nextDiagrams.some((diagram) => diagram.id === activeDiagramId)
        ? activeDiagramId
        : nextDiagrams[0]?.id ?? null
      if (nextDiagramId) {
        await loadDiagramDetail(authSession, workspaceId, projectId, nextDiagramId)
      } else {
        clearDiagramState()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load diagrams')
    } finally {
      setIsLoadingDiagrams(false)
    }
  }

  async function loadProjects(authSession: AuthSession, workspaceId: string) {
    setIsLoadingProjects(true)
    setError(null)
    try {
      const nextProjects = await fetchProjects(authSession.access_token, workspaceId)
      setProjects(nextProjects)
      const nextProjectId = nextProjects.some((project) => project.id === activeProjectId)
        ? activeProjectId
        : nextProjects[0]?.id ?? null
      setActiveProjectId(nextProjectId)
      if (nextProjectId) {
        window.localStorage.setItem(PROJECT_STORAGE_KEY, nextProjectId)
        await Promise.all([
          loadDiagrams(authSession, workspaceId, nextProjectId),
          loadGenerationJobs(authSession, workspaceId, nextProjectId),
          loadSrsDocuments(authSession, workspaceId, nextProjectId),
        ])
      } else {
        clearProjectState()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load projects')
    } finally {
      setIsLoadingProjects(false)
    }
  }

  async function loadCurrentUser(authSession: AuthSession) {
    setIsLoadingMe(true)
    setError(null)
    try {
      const current = await fetchCurrentUser(authSession.access_token)
      const nextSession = { ...authSession, user: current.user }
      const nextWorkspaceId = current.workspaces.some((membership) => membership.workspace.id === activeWorkspaceId)
        ? activeWorkspaceId
        : current.workspaces[0]?.workspace.id ?? null

      setSession(nextSession)
      setWorkspaces(current.workspaces)
      setActiveWorkspaceId(nextWorkspaceId)
      writeStoredSession(nextSession)
      if (nextWorkspaceId) {
        window.localStorage.setItem(WORKSPACE_STORAGE_KEY, nextWorkspaceId)
        await Promise.all([loadBilling(nextSession, nextWorkspaceId), loadProjects(nextSession, nextWorkspaceId)])
      } else {
        setSubscription(null)
        setUsage(null)
        clearProjectState()
        window.localStorage.removeItem(WORKSPACE_STORAGE_KEY)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load session')
    } finally {
      setIsLoadingMe(false)
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload: Record<string, string> = mode === 'register' ? { email, password, full_name: fullName } : { email, password }

    try {
      const nextSession = await authenticate(mode, payload)
      setSession(nextSession)
      writeStoredSession(nextSession)
      setPassword('')
      await loadCurrentUser(nextSession)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function signOut() {
    clearStoredSession()
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY)
    clearProjectState()
    setSession(null)
    setWorkspaces([])
    setPlans([])
    setSubscription(null)
    setUsage(null)
    setPassword('')
    setError(null)
  }

  async function selectWorkspace(workspaceId: string) {
    setActiveWorkspaceId(workspaceId)
    setPlans([])
    setSubscription(null)
    setUsage(null)
    clearProjectState()
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
    if (session) {
      await Promise.all([loadBilling(session, workspaceId), loadProjects(session, workspaceId)])
    }
  }

  async function selectProject(projectId: string) {
    setActiveProjectId(projectId)
    clearDiagramState()
    setGenerationJobs([])
    setSrsDocuments([])
    setActiveSrsDocument(null)
    window.localStorage.setItem(PROJECT_STORAGE_KEY, projectId)
    if (session && activeWorkspace) {
      await Promise.all([
        loadDiagrams(session, activeWorkspace.workspace.id, projectId),
        loadGenerationJobs(session, activeWorkspace.workspace.id, projectId),
        loadSrsDocuments(session, activeWorkspace.workspace.id, projectId),
      ])
    }
  }

  async function selectDiagram(diagramId: string) {
    if (!session || !activeWorkspace || !activeProject) {
      return
    }
    setError(null)
    try {
      await loadDiagramDetail(session, activeWorkspace.workspace.id, activeProject.id, diagramId)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load diagram')
    }
  }

  function applyWorkspaceName(value: string) {
    setWorkspaceName(value)
    if (!workspaceSlug) {
      setWorkspaceSlug(
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      )
    }
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      return
    }

    setIsCreatingWorkspace(true)
    setError(null)
    try {
      const membership = await createWorkspaceRequest(session.access_token, {
        name: workspaceName,
        slug: workspaceSlug,
        type: 'organization',
      })
      setWorkspaces((current) => [...current, membership])
      setWorkspaceName('')
      setWorkspaceSlug('')
      await selectWorkspace(membership.workspace.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create workspace')
    } finally {
      setIsCreatingWorkspace(false)
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !activeWorkspace) {
      return
    }

    setIsCreatingProject(true)
    setError(null)
    try {
      const project = await createProjectRequest(session.access_token, activeWorkspace.workspace.id, {
        name: projectName,
        description: projectDescription || null,
      })
      setProjects((current) => [project, ...current])
      setActiveProjectId(project.id)
      clearDiagramState()
      setGenerationJobs([])
      setSrsDocuments([])
      setActiveSrsDocument(null)
      window.localStorage.setItem(PROJECT_STORAGE_KEY, project.id)
      setProjectName('')
      setProjectDescription('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create project')
    } finally {
      setIsCreatingProject(false)
    }
  }

  async function checkoutPlan(planCode: string) {
    if (!session || !activeWorkspace) {
      return
    }

    setIsCheckingOut(true)
    setError(null)
    try {
      const checkout = await checkoutPlanRequest(session.access_token, activeWorkspace.workspace.id, planCode)
      setSubscription(checkout.subscription)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start checkout')
    } finally {
      setIsCheckingOut(false)
    }
  }

  async function startSrsGeneration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !activeWorkspace || !activeProject) {
      return
    }

    setIsStartingGeneration(true)
    setError(null)
    try {
      const response = await generateSrs(session.access_token, activeWorkspace.workspace.id, activeProject.id, {
        title: srsTitle,
        raw_text: srsRawText,
        generate_class_diagram: generateClassDiagramFromSrsInput,
        diagram_methods: generateClassDiagramFromSrsInput ? ['llm'] : [],
      })
      const generatedDiagrams = response.diagrams ?? []
      setGenerationJobs((current) => [response.job, ...current])
      setSrsDocuments((current) => [response.srs_document, ...current])
      setActiveSrsDocument(response.srs_document)
      setActiveReviewDiagrams(generatedDiagrams)
      if (generatedDiagrams[0]) {
        const generatedDiagram = generatedDiagrams[0]
        setDiagrams((current) => [
          generatedDiagram,
          ...current.filter((diagram) => diagram.id !== generatedDiagram.id),
        ])
        setDiagramVersions([generatedDiagram.current])
        setActiveDiagramId(generatedDiagram.id)
        setDiagramXml(generatedDiagram.current.drawio_xml)
        window.localStorage.setItem(DIAGRAM_STORAGE_KEY, generatedDiagram.id)
      }
      setSrsTitle('')
      setSrsRawText('')
      setGenerateClassDiagramFromSrsInput(false)
      await loadBilling(session, activeWorkspace.workspace.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start generation')
    } finally {
      setIsStartingGeneration(false)
    }
  }

  async function generateClassDiagramFromSrs(methods: ClassDiagramMethod[]) {
    if (!session || !activeWorkspace || !activeProject || !activeSrsDocument) {
      return
    }

    setIsGeneratingClassDiagram(true)
    setError(null)
    try {
      const detail = await generateClassDiagram(session.access_token, activeWorkspace.workspace.id, activeProject.id, {
        srs_document_id: activeSrsDocument.id,
        methods,
      })
      setDiagrams((current) => [detail, ...current.filter((diagram) => diagram.id !== detail.id)])
      setActiveReviewDiagrams([detail])
      setDiagramVersions([detail.current])
      setActiveDiagramId(detail.id)
      setDiagramXml(detail.current.drawio_xml)
      window.localStorage.setItem(DIAGRAM_STORAGE_KEY, detail.id)
      await loadBilling(session, activeWorkspace.workspace.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to generate class diagram')
    } finally {
      setIsGeneratingClassDiagram(false)
    }
  }

  function openGeneratedDiagram(diagram: DiagramDetail) {
    setDiagrams((current) => [diagram, ...current.filter((item) => item.id !== diagram.id)])
    setDiagramVersions([diagram.current])
    setActiveDiagramId(diagram.id)
    setDiagramXml(diagram.current.drawio_xml)
    window.localStorage.setItem(DIAGRAM_STORAGE_KEY, diagram.id)
  }
  async function createDiagram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !activeWorkspace || !activeProject) {
      return
    }

    setIsCreatingDiagram(true)
    setError(null)
    try {
      const detail = await createManualDiagram(session.access_token, activeWorkspace.workspace.id, activeProject.id, {
        title: diagramTitle,
        diagram_type: diagramType,
        drawio_xml: diagramXml,
      })
      setDiagrams((current) => [detail, ...current.filter((diagram) => diagram.id !== detail.id)])
      setActiveReviewDiagrams([detail])
      setDiagramVersions([detail.current])
      setActiveDiagramId(detail.id)
      setDiagramXml(detail.current.drawio_xml)
      window.localStorage.setItem(DIAGRAM_STORAGE_KEY, detail.id)
      setDiagramTitle('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create diagram')
    } finally {
      setIsCreatingDiagram(false)
    }
  }

  async function saveDiagramVersion() {
    if (!session || !activeWorkspace || !activeProject || !activeDiagram) {
      return
    }

    setIsSavingDiagram(true)
    setError(null)
    try {
      const version = await createDiagramVersion(
        session.access_token,
        activeWorkspace.workspace.id,
        activeProject.id,
        activeDiagram.id,
        { drawio_xml: diagramXml },
      )
      setDiagramVersions((current) => [...current, version])
      setDiagrams((current) =>
        current.map((diagram) =>
          diagram.id === activeDiagram.id ? { ...diagram, current_version: version.version_number } : diagram,
        ),
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save diagram')
    } finally {
      setIsSavingDiagram(false)
    }
  }

  if (!session) {
    return (
      <AuthView
        mode={mode}
        email={email}
        password={password}
        fullName={fullName}
        error={error}
        isSubmitting={isSubmitting}
        onModeChange={setMode}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onFullNameChange={setFullName}
        onSubmit={submitAuth}
      />
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">SRS Diagram Platform</span>
          <h1>Workspace</h1>
        </div>
        <button className="secondary-button" type="button" onClick={signOut}>
          Sign out
        </button>
      </header>

      <section className="dashboard-grid">
        <article className="panel identity-panel">
          <span className="panel-label">Signed in</span>
          <h2>{session.user.full_name}</h2>
          <p>{session.user.email}</p>
        </article>

        <WorkspacePanel
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          isRefreshing={isLoadingMe || isLoadingProjects || isLoadingDiagrams}
          onRefresh={() => void loadCurrentUser(session)}
          onSelectWorkspace={(workspaceId) => void selectWorkspace(workspaceId)}
        />

        <CreateWorkspacePanel
          workspaceName={workspaceName}
          workspaceSlug={workspaceSlug}
          isCreatingWorkspace={isCreatingWorkspace}
          onWorkspaceNameChange={applyWorkspaceName}
          onWorkspaceSlugChange={setWorkspaceSlug}
          onSubmit={createWorkspace}
        />

        <BillingPanel
          activeWorkspace={activeWorkspace}
          plans={plans}
          subscription={subscription}
          usage={usage}
          isLoadingBilling={isLoadingBilling}
          isCheckingOut={isCheckingOut}
          onReload={() => {
            if (activeWorkspace) {
              void loadBilling(session, activeWorkspace.workspace.id)
            }
          }}
          onCheckoutPlan={(planCode) => void checkoutPlan(planCode)}
        />

        <ProjectsPanel
          activeWorkspace={activeWorkspace}
          activeProject={activeProject}
          projects={projects}
          isLoadingProjects={isLoadingProjects}
          onReload={() => {
            if (activeWorkspace) {
              void loadProjects(session, activeWorkspace.workspace.id)
            }
          }}
          onSelectProject={(projectId) => void selectProject(projectId)}
        />

        <CreateProjectPanel
          activeWorkspace={activeWorkspace}
          projectName={projectName}
          projectDescription={projectDescription}
          isCreatingProject={isCreatingProject}
          onProjectNameChange={setProjectName}
          onProjectDescriptionChange={setProjectDescription}
          onSubmit={createProject}
        />

        <SrsPanel
          activeWorkspace={activeWorkspace}
          activeProject={activeProject}
          generationJobs={generationJobs}
          srsDocuments={srsDocuments}
          activeSrsDocument={activeSrsDocument}
          generatedDiagrams={activeReviewDiagrams}
          srsTitle={srsTitle}
          srsRawText={srsRawText}
          generateClassDiagram={generateClassDiagramFromSrsInput}
          isLoadingGenerationJobs={isLoadingGenerationJobs}
          isLoadingSrsDocuments={isLoadingSrsDocuments}
          isStartingGeneration={isStartingGeneration}
          isGeneratingClassDiagram={isGeneratingClassDiagram}
          onReload={() => {
            if (activeWorkspace && activeProject) {
              void Promise.all([
                loadGenerationJobs(session, activeWorkspace.workspace.id, activeProject.id),
                loadSrsDocuments(session, activeWorkspace.workspace.id, activeProject.id),
              ])
            }
          }}
          onSrsTitleChange={setSrsTitle}
          onSrsRawTextChange={setSrsRawText}
          onGenerateClassDiagramChange={setGenerateClassDiagramFromSrsInput}
          onStartGeneration={startSrsGeneration}
          onSelectSrsDocument={(documentId) => {
            if (activeWorkspace && activeProject) {
              void loadSrsDocumentDetail(session, activeWorkspace.workspace.id, activeProject.id, documentId)
            }
          }}
          onGenerateClassDiagram={(methods) => void generateClassDiagramFromSrs(methods)}
          onOpenGeneratedDiagram={openGeneratedDiagram}
        />

        <DiagramsPanel
          activeWorkspace={activeWorkspace}
          activeProject={activeProject}
          activeDiagram={activeDiagram}
          diagrams={diagrams}
          diagramVersions={diagramVersions}
          diagramXml={diagramXml}
          isLoadingDiagrams={isLoadingDiagrams}
          isSavingDiagram={isSavingDiagram}
          onReload={() => {
            if (activeWorkspace && activeProject) {
              void loadDiagrams(session, activeWorkspace.workspace.id, activeProject.id)
            }
          }}
          onSelectDiagram={(diagramId) => void selectDiagram(diagramId)}
          onDiagramXmlChange={setDiagramXml}
          onResetXml={() => setDiagramXml(BLANK_DRAWIO_XML)}
          onSaveVersion={() => void saveDiagramVersion()}
        />

        <CreateDiagramPanel
          activeProject={activeProject}
          diagramTitle={diagramTitle}
          diagramType={diagramType}
          isCreatingDiagram={isCreatingDiagram}
          onDiagramTitleChange={setDiagramTitle}
          onDiagramTypeChange={setDiagramType}
          onSubmit={createDiagram}
        />
      </section>

      {error ? <p className="status-message error-message">{error}</p> : null}
    </main>
  )
}

export default App