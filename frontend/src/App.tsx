import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type AuthUser = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  status: string
  created_at: string
  updated_at: string
}

type Workspace = {
  id: string
  name: string
  slug: string
  type: string
  owner_user_id: string
  status: string
  created_at: string
  updated_at: string
}

type WorkspaceMembership = {
  workspace: Workspace
  role: string
  status: string
}

type Project = {
  id: string
  workspace_id: string
  name: string
  description: string | null
  status: string
  created_by_user_id: string
  created_at: string
  updated_at: string
}

type Diagram = {
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

type DiagramVersion = {
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

type DiagramDetail = Diagram & {
  current: DiagramVersion
}

type Plan = {
  id: string
  code: string
  name: string
  description: string | null
  workspace_type: string
  price_cents_monthly: number
  max_projects: number
  max_members: number
  monthly_srs_generations: number
  monthly_ai_diagram_generations: number
  monthly_manual_diagram_saves: number
  can_use_manual_drawio: boolean
  can_generate_srs: boolean
  can_generate_ai_diagrams: boolean
  can_export_srs: boolean
  can_export_diagrams: boolean
}

type Subscription = {
  id: string
  workspace_id: string
  plan_id: string
  status: string
  current_period_start: string
  current_period_end: string
  plan: Plan
}

type Usage = {
  id: string
  workspace_id: string
  period_key: string
  srs_generations: number
  ai_diagram_generations: number
  manual_diagram_saves: number
}

type CheckoutResponse = {
  checkout_session_id: string
  checkout_url: string
  plan: Plan
  subscription: Subscription
}

type GenerationJob = {
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

type ExtractedRequirement = {
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

type SrsDocument = {
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

type SrsGenerateResponse = {
  job: GenerationJob
  srs_document: SrsDocument
}

type AuthSession = {
  access_token: string
  token_type: string
  user: AuthUser
}

type CurrentUserResponse = {
  user: AuthUser
  workspaces: WorkspaceMembership[]
}

type AuthMode = 'login' | 'register'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const SESSION_STORAGE_KEY = 'spl3.auth.session'
const WORKSPACE_STORAGE_KEY = 'spl3.workspace.active'
const PROJECT_STORAGE_KEY = 'spl3.project.active'
const DIAGRAM_STORAGE_KEY = 'spl3.diagram.active'
const BLANK_DRAWIO_XML = '<mxfile><diagram name="Page-1"></diagram></mxfile>'

function readStoredSession(): AuthSession | null {
  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as AuthSession
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = body && typeof body.detail === 'string' ? body.detail : 'Request failed'
    throw new Error(detail)
  }
  return body as T
}

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [diagrams, setDiagrams] = useState<Diagram[]>([])
  const [diagramVersions, setDiagramVersions] = useState<DiagramVersion[]>([])
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
  const [generateClassDiagram, setGenerateClassDiagram] = useState(false)
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
    () =>
      workspaces.find((membership) => membership.workspace.id === activeWorkspaceId) ??
      workspaces[0],
    [activeWorkspaceId, workspaces],
  )

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId, projects],
  )

  const availablePlans = useMemo(() => {
    const workspaceType = activeWorkspace?.workspace.type
    if (!workspaceType) {
      return plans
    }
    return plans.filter((plan) => plan.workspace_type === workspaceType || plan.workspace_type === 'any')
  }, [activeWorkspace, plans])

  const activeDiagram = useMemo(
    () => diagrams.find((diagram) => diagram.id === activeDiagramId) ?? diagrams[0],
    [activeDiagramId, diagrams],
  )

  const latestGenerationJob = generationJobs[0]

  async function loadBilling(authSession: AuthSession, workspaceId: string) {
    setIsLoadingBilling(true)
    setError(null)
    try {
      const [nextPlans, nextSubscription, nextUsage] = await Promise.all([
        parseApiResponse<Plan[]>(await fetch(`${API_BASE_URL}/billing/plans`)),
        parseApiResponse<Subscription>(
          await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/subscription`, {
            headers: { Authorization: `Bearer ${authSession.access_token}` },
          }),
        ),
        parseApiResponse<Usage>(
          await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/usage`, {
            headers: { Authorization: `Bearer ${authSession.access_token}` },
          }),
        ),
      ])
      setPlans(nextPlans)
      setSubscription(nextSubscription)
      setUsage(nextUsage)
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
      const nextJobs = await parseApiResponse<GenerationJob[]>(
        await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/srs/jobs`, {
          headers: { Authorization: `Bearer ${authSession.access_token}` },
        }),
      )
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
    const document = await parseApiResponse<SrsDocument>(
      await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/srs/${documentId}`, {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      }),
    )
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
      const documents = await parseApiResponse<SrsDocument[]>(
        await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/srs`, {
          headers: { Authorization: `Bearer ${authSession.access_token}` },
        }),
      )
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
    const detail = await parseApiResponse<DiagramDetail>(
      await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/diagrams/${diagramId}`,
        { headers: { Authorization: `Bearer ${authSession.access_token}` } },
      ),
    )
    const versions = await parseApiResponse<DiagramVersion[]>(
      await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/diagrams/${diagramId}/versions`,
        { headers: { Authorization: `Bearer ${authSession.access_token}` } },
      ),
    )
    setDiagramXml(detail.current.drawio_xml)
    setDiagramVersions(versions)
    setActiveDiagramId(diagramId)
    window.localStorage.setItem(DIAGRAM_STORAGE_KEY, diagramId)
  }

  async function loadDiagrams(authSession: AuthSession, workspaceId: string, projectId: string) {
    setIsLoadingDiagrams(true)
    setError(null)
    try {
      const nextDiagrams = await parseApiResponse<Diagram[]>(
        await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects/${projectId}/diagrams`, {
          headers: { Authorization: `Bearer ${authSession.access_token}` },
        }),
      )
      setDiagrams(nextDiagrams)
      const nextDiagramId = nextDiagrams.some((diagram) => diagram.id === activeDiagramId)
        ? activeDiagramId
        : nextDiagrams[0]?.id ?? null
      if (nextDiagramId) {
        await loadDiagramDetail(authSession, workspaceId, projectId, nextDiagramId)
      } else {
        setActiveDiagramId(null)
        setDiagramVersions([])
        setDiagramXml(BLANK_DRAWIO_XML)
        window.localStorage.removeItem(DIAGRAM_STORAGE_KEY)
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
      const nextProjects = await parseApiResponse<Project[]>(
        await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/projects`, {
          headers: { Authorization: `Bearer ${authSession.access_token}` },
        }),
      )
      setProjects(nextProjects)
      const nextProjectId = nextProjects.some((project) => project.id === activeProjectId)
        ? activeProjectId
        : nextProjects[0]?.id ?? null
      setActiveProjectId(nextProjectId)
      if (nextProjectId) {
        window.localStorage.setItem(PROJECT_STORAGE_KEY, nextProjectId)
        await loadDiagrams(authSession, workspaceId, nextProjectId)
        await loadGenerationJobs(authSession, workspaceId, nextProjectId)
        await loadSrsDocuments(authSession, workspaceId, nextProjectId)
      } else {
        setDiagrams([])
        setDiagramVersions([])
        setActiveDiagramId(null)
        setDiagramXml(BLANK_DRAWIO_XML)
        window.localStorage.removeItem(PROJECT_STORAGE_KEY)
        window.localStorage.removeItem(DIAGRAM_STORAGE_KEY)
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
      const current = await parseApiResponse<CurrentUserResponse>(
        await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${authSession.access_token}` },
        }),
      )
      const nextSession = { ...authSession, user: current.user }
      const nextWorkspaceId = current.workspaces.some(
        (membership) => membership.workspace.id === activeWorkspaceId,
      )
        ? activeWorkspaceId
        : current.workspaces[0]?.workspace.id ?? null

      setSession(nextSession)
      setWorkspaces(current.workspaces)
      setActiveWorkspaceId(nextWorkspaceId)
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
      if (nextWorkspaceId) {
        window.localStorage.setItem(WORKSPACE_STORAGE_KEY, nextWorkspaceId)
        await loadBilling(nextSession, nextWorkspaceId)
        await loadProjects(nextSession, nextWorkspaceId)
      } else {
        setProjects([])
        setDiagrams([])
        setDiagramVersions([])
        setSubscription(null)
        setUsage(null)
        setActiveProjectId(null)
        setActiveDiagramId(null)
        window.localStorage.removeItem(WORKSPACE_STORAGE_KEY)
        window.localStorage.removeItem(PROJECT_STORAGE_KEY)
        window.localStorage.removeItem(DIAGRAM_STORAGE_KEY)
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

    const endpoint = mode === 'register' ? '/auth/register' : '/auth/login'
    const payload =
      mode === 'register'
        ? { email, password, full_name: fullName }
        : { email, password }

    try {
      const nextSession = await parseApiResponse<AuthSession>(
        await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      )
      setSession(nextSession)
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
      setPassword('')
      await loadCurrentUser(nextSession)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function signOut() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY)
    window.localStorage.removeItem(PROJECT_STORAGE_KEY)
    window.localStorage.removeItem(DIAGRAM_STORAGE_KEY)
    setSession(null)
    setWorkspaces([])
    setProjects([])
    setDiagrams([])
    setDiagramVersions([])
    setPlans([])
    setSubscription(null)
    setUsage(null)
    setActiveWorkspaceId(null)
    setActiveProjectId(null)
    setActiveDiagramId(null)
    setPassword('')
    setError(null)
  }

  async function selectWorkspace(workspaceId: string) {
    setActiveWorkspaceId(workspaceId)
    setActiveProjectId(null)
    setActiveDiagramId(null)
    setProjects([])
    setDiagrams([])
    setDiagramVersions([])
    setPlans([])
    setSubscription(null)
    setUsage(null)
    setDiagramXml(BLANK_DRAWIO_XML)
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
    window.localStorage.removeItem(PROJECT_STORAGE_KEY)
    window.localStorage.removeItem(DIAGRAM_STORAGE_KEY)
    if (session) {
      await loadBilling(session, workspaceId)
      await loadProjects(session, workspaceId)
    }
  }

  async function selectProject(projectId: string) {
    setActiveProjectId(projectId)
    setActiveDiagramId(null)
    setDiagrams([])
    setDiagramVersions([])
    setDiagramXml(BLANK_DRAWIO_XML)
    window.localStorage.setItem(PROJECT_STORAGE_KEY, projectId)
    window.localStorage.removeItem(DIAGRAM_STORAGE_KEY)
    if (session && activeWorkspace) {
      await loadDiagrams(session, activeWorkspace.workspace.id, projectId)
      await loadGenerationJobs(session, activeWorkspace.workspace.id, projectId)
      await loadSrsDocuments(session, activeWorkspace.workspace.id, projectId)
    }
  }

  async function selectDiagram(diagramId: string) {
    if (!session || !activeWorkspace || !activeProject) {
      return
    }
    setError(null)
    try {
      await loadDiagramDetail(
        session,
        activeWorkspace.workspace.id,
        activeProject.id,
        diagramId,
      )
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
      const membership = await parseApiResponse<WorkspaceMembership>(
        await fetch(`${API_BASE_URL}/workspaces`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: workspaceName,
            slug: workspaceSlug,
            type: 'organization',
          }),
        }),
      )
      setWorkspaces([...workspaces, membership])
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
      const project = await parseApiResponse<Project>(
        await fetch(`${API_BASE_URL}/workspaces/${activeWorkspace.workspace.id}/projects`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: projectName,
            description: projectDescription || null,
          }),
        }),
      )
      setProjects([project, ...projects])
      setActiveProjectId(project.id)
      setDiagrams([])
      setDiagramVersions([])
      setActiveDiagramId(null)
      setDiagramXml(BLANK_DRAWIO_XML)
      window.localStorage.setItem(PROJECT_STORAGE_KEY, project.id)
      window.localStorage.removeItem(DIAGRAM_STORAGE_KEY)
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
      const checkout = await parseApiResponse<CheckoutResponse>(
        await fetch(`${API_BASE_URL}/workspaces/${activeWorkspace.workspace.id}/billing/checkout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan_code: planCode }),
        }),
      )
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
      const response = await parseApiResponse<SrsGenerateResponse>(
        await fetch(`${API_BASE_URL}/workspaces/${activeWorkspace.workspace.id}/projects/${activeProject.id}/srs/generate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: srsTitle,
            raw_text: srsRawText,
            generate_class_diagram: generateClassDiagram,
            diagram_methods: generateClassDiagram ? ['llm'] : [],
          }),
        }),
      )
      setGenerationJobs([response.job, ...generationJobs])
      setSrsDocuments([response.srs_document, ...srsDocuments])
      setActiveSrsDocument(response.srs_document)
      setSrsTitle('')
      setSrsRawText('')
      setGenerateClassDiagram(false)
      await loadBilling(session, activeWorkspace.workspace.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start generation')
    } finally {
      setIsStartingGeneration(false)
    }
  }

  async function generateClassDiagramFromSrs(methods: Array<'llm' | 'rule_based'>) {
    if (!session || !activeWorkspace || !activeProject || !activeSrsDocument) {
      return
    }

    setIsGeneratingClassDiagram(true)
    setError(null)
    try {
      const detail = await parseApiResponse<DiagramDetail>(
        await fetch(`${API_BASE_URL}/workspaces/${activeWorkspace.workspace.id}/projects/${activeProject.id}/diagrams/class/generate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            srs_document_id: activeSrsDocument.id,
            methods,
          }),
        }),
      )
      setDiagrams([detail, ...diagrams])
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

  async function createDiagram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !activeWorkspace || !activeProject) {
      return
    }

    setIsCreatingDiagram(true)
    setError(null)
    try {
      const detail = await parseApiResponse<DiagramDetail>(
        await fetch(
          `${API_BASE_URL}/workspaces/${activeWorkspace.workspace.id}/projects/${activeProject.id}/diagrams`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: diagramTitle,
              diagram_type: diagramType,
              drawio_xml: diagramXml,
            }),
          },
        ),
      )
      setDiagrams([detail, ...diagrams])
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
      const version = await parseApiResponse<DiagramVersion>(
        await fetch(
          `${API_BASE_URL}/workspaces/${activeWorkspace.workspace.id}/projects/${activeProject.id}/diagrams/${activeDiagram.id}/versions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ drawio_xml: diagramXml }),
          },
        ),
      )
      setDiagramVersions([...diagramVersions, version])
      setDiagrams(
        diagrams.map((diagram) =>
          diagram.id === activeDiagram.id
            ? { ...diagram, current_version: version.version_number }
            : diagram,
        ),
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save diagram')
    } finally {
      setIsSavingDiagram(false)
    }
  }

  if (session) {
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

          <article className="panel workspace-panel">
            <div className="panel-heading">
              <span className="panel-label">Workspaces</span>
              <button
                className="text-button"
                type="button"
                onClick={() => loadCurrentUser(session)}
                disabled={isLoadingMe || isLoadingProjects || isLoadingDiagrams}
              >
                {isLoadingMe || isLoadingProjects || isLoadingDiagrams ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
            <div className="workspace-switcher">
              {workspaces.map((membership) => (
                <button
                  key={membership.workspace.id}
                  className={
                    membership.workspace.id === activeWorkspace?.workspace.id
                      ? 'workspace-option active'
                      : 'workspace-option'
                  }
                  type="button"
                  onClick={() => void selectWorkspace(membership.workspace.id)}
                >
                  <span>{membership.workspace.name}</span>
                  <small>
                    {membership.workspace.type} / {membership.role}
                  </small>
                </button>
              ))}
            </div>
            {activeWorkspace ? (
              <div className="workspace-row">
                <div>
                  <h2>{activeWorkspace.workspace.name}</h2>
                  <p>{activeWorkspace.workspace.type}</p>
                </div>
                <span className="role-chip">{activeWorkspace.role}</span>
              </div>
            ) : (
              <p>No active workspace found.</p>
            )}
          </article>

          <article className="panel create-workspace-panel">
            <span className="panel-label">New organization</span>
            <form className="workspace-form" onSubmit={createWorkspace}>
              <label>
                Name
                <input
                  value={workspaceName}
                  onChange={(event) => applyWorkspaceName(event.target.value)}
                  required
                />
              </label>
              <label>
                Slug
                <input
                  value={workspaceSlug}
                  onChange={(event) => setWorkspaceSlug(event.target.value)}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  required
                />
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={isCreatingWorkspace}
              >
                {isCreatingWorkspace ? 'Creating' : 'Create workspace'}
              </button>
            </form>
          </article>

          <article className="panel billing-panel">
            <div className="panel-heading">
              <span className="panel-label">Billing</span>
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  activeWorkspace && void loadBilling(session, activeWorkspace.workspace.id)
                }
                disabled={!activeWorkspace || isLoadingBilling}
              >
                {isLoadingBilling ? 'Loading' : 'Reload'}
              </button>
            </div>

            <div className="billing-layout">
              <div className="billing-status">
                <span className="panel-label">Current plan</span>
                <h2>{subscription?.plan.name ?? 'No plan loaded'}</h2>
                <p>{subscription?.plan.description ?? 'Refresh billing to load workspace status.'}</p>
                {usage ? (
                  <div className="usage-grid">
                    <span>SRS {usage.srs_generations}/{subscription?.plan.monthly_srs_generations ?? 0}</span>
                    <span>AI diagrams {usage.ai_diagram_generations}/{subscription?.plan.monthly_ai_diagram_generations ?? 0}</span>
                    <span>Manual saves {usage.manual_diagram_saves}/{subscription?.plan.monthly_manual_diagram_saves ?? 0}</span>
                  </div>
                ) : null}
              </div>

              <div className="plan-grid" aria-label="Plans">
                {availablePlans.map((plan) => (
                  <article className="plan-option" key={plan.id}>
                    <div>
                      <h2>{plan.name}</h2>
                      <p>{plan.description}</p>
                    </div>
                    <strong>${(plan.price_cents_monthly / 100).toFixed(0)}/mo</strong>
                    <small>
                      {plan.max_projects} projects / {plan.max_members} members / {plan.monthly_manual_diagram_saves} saves
                    </small>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => void checkoutPlan(plan.code)}
                      disabled={!activeWorkspace || isCheckingOut || subscription?.plan.code === plan.code}
                    >
                      {subscription?.plan.code === plan.code ? 'Current' : 'Select'}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </article>
          <article className="panel projects-panel">
            <div className="panel-heading">
              <span className="panel-label">Projects</span>
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  activeWorkspace && void loadProjects(session, activeWorkspace.workspace.id)
                }
                disabled={!activeWorkspace || isLoadingProjects}
              >
                {isLoadingProjects ? 'Loading' : 'Reload'}
              </button>
            </div>

            <div className="project-layout">
              <div className="project-list" aria-label="Projects">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    className={
                      project.id === activeProject?.id ? 'project-option active' : 'project-option'
                    }
                    type="button"
                    onClick={() => void selectProject(project.id)}
                  >
                    <span>{project.name}</span>
                    <small>{new Date(project.created_at).toLocaleDateString()}</small>
                  </button>
                ))}
                {projects.length === 0 ? <p>No projects found.</p> : null}
              </div>

              <div className="project-detail">
                {activeProject ? (
                  <>
                    <span className="panel-label">Project</span>
                    <h2>{activeProject.name}</h2>
                    <p>{activeProject.description ?? 'No description'}</p>
                  </>
                ) : (
                  <p>No project selected.</p>
                )}
              </div>
            </div>
          </article>

          <article className="panel create-project-panel">
            <span className="panel-label">New project</span>
            <form className="project-form" onSubmit={createProject}>
              <label>
                Name
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  value={projectDescription}
                  onChange={(event) => setProjectDescription(event.target.value)}
                  rows={3}
                />
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={!activeWorkspace || isCreatingProject}
              >
                {isCreatingProject ? 'Creating' : 'Create project'}
              </button>
            </form>
          </article>

          <article className="panel srs-panel">
            <div className="panel-heading">
              <span className="panel-label">SRS generation</span>
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  activeWorkspace &&
                  activeProject &&
                  void Promise.all([
                    loadGenerationJobs(session, activeWorkspace.workspace.id, activeProject.id),
                    loadSrsDocuments(session, activeWorkspace.workspace.id, activeProject.id),
                  ])
                }
                disabled={!activeWorkspace || !activeProject || isLoadingGenerationJobs || isLoadingSrsDocuments}
              >
                {isLoadingGenerationJobs || isLoadingSrsDocuments ? 'Loading' : 'Reload'}
              </button>
            </div>

            <div className="srs-layout">
              <form className="srs-form" onSubmit={startSrsGeneration}>
                <label>
                  Title
                  <input
                    value={srsTitle}
                    onChange={(event) => setSrsTitle(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Requirements
                  <textarea
                    value={srsRawText}
                    onChange={(event) => setSrsRawText(event.target.value)}
                    rows={5}
                    required
                  />
                </label>
                <label className="inline-toggle">
                  <input
                    checked={generateClassDiagram}
                    type="checkbox"
                    onChange={(event) => setGenerateClassDiagram(event.target.checked)}
                  />
                  Class diagram
                </label>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!activeProject || isStartingGeneration}
                >
                  {isStartingGeneration ? 'Starting' : 'Start generation'}
                </button>
              </form>

              <div className="generation-status">
                <span className="panel-label">Latest status</span>
                <h2>{latestGenerationJob?.status ?? 'No jobs yet'}</h2>
                {latestGenerationJob ? (
                  <p>
                    {latestGenerationJob.job_type} / {latestGenerationJob.progress_percent}% /{' '}
                    {new Date(latestGenerationJob.created_at).toLocaleString()}
                  </p>
                ) : (
                  <p>Submit requirements to create a generation job.</p>
                )}
                <div className="generation-list" aria-label="Generation jobs">
                  {generationJobs.map((job) => (
                    <button className="generation-option" key={job.id} type="button">
                      <span>{job.status}</span>
                      <small>
                        {job.job_type} / {new Date(job.created_at).toLocaleDateString()}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeSrsDocument ? (
              <div className="srs-review">
                <div className="panel-heading">
                  <span className="panel-label">Generated SRS</span>
                  <span>{new Date(activeSrsDocument.created_at).toLocaleString()}</span>
                </div>
                <div className="srs-document-list" aria-label="SRS documents">
                  {srsDocuments.map((document) => (
                    <button
                      className={document.id === activeSrsDocument.id ? 'generation-option active' : 'generation-option'}
                      key={document.id}
                      type="button"
                      onClick={() =>
                        activeWorkspace &&
                        activeProject &&
                        void loadSrsDocumentDetail(session, activeWorkspace.workspace.id, activeProject.id, document.id)
                      }
                    >
                      <span>{document.title}</span>
                      <small>{document.status}</small>
                    </button>
                  ))}
                </div>
                <div className="diagram-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => void generateClassDiagramFromSrs(['rule_based'])}
                    disabled={isGeneratingClassDiagram}
                  >
                    {isGeneratingClassDiagram ? 'Generating' : 'Rule-based diagram'}
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => void generateClassDiagramFromSrs(['llm'])}
                    disabled={isGeneratingClassDiagram}
                  >
                    {isGeneratingClassDiagram ? 'Generating' : 'LLM diagram'}
                  </button>
                </div>
                <pre className="srs-markdown">{activeSrsDocument.content_markdown}</pre>
                <div className="requirement-review" aria-label="Extracted requirements">
                  {activeSrsDocument.extracted_requirements?.map((requirement) => (
                    <article className="requirement-item" key={requirement.id}>
                      <strong>{requirement.requirement_code}</strong>
                      <span>{requirement.requirement_type}</span>
                      {requirement.nfr_subtype ? <small>{requirement.nfr_subtype}</small> : null}
                      <p>{requirement.requirement_text}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </article>

          <article className="panel diagrams-panel">
            <div className="panel-heading">
              <span className="panel-label">Manual diagrams</span>
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  activeWorkspace &&
                  activeProject &&
                  void loadDiagrams(session, activeWorkspace.workspace.id, activeProject.id)
                }
                disabled={!activeWorkspace || !activeProject || isLoadingDiagrams}
              >
                {isLoadingDiagrams ? 'Loading' : 'Reload'}
              </button>
            </div>

            <div className="diagram-layout">
              <div className="diagram-list" aria-label="Diagrams">
                {diagrams.map((diagram) => (
                  <button
                    key={diagram.id}
                    className={
                      diagram.id === activeDiagram?.id ? 'diagram-option active' : 'diagram-option'
                    }
                    type="button"
                    onClick={() => void selectDiagram(diagram.id)}
                  >
                    <span>{diagram.title}</span>
                    <small>
                      {diagram.diagram_type} / v{diagram.current_version}
                    </small>
                  </button>
                ))}
                {diagrams.length === 0 ? <p>No diagrams found.</p> : null}
              </div>

              <div className="drawio-editor">
                <iframe
                  className="drawio-frame"
                  src="https://embed.diagrams.net/?embed=1&proto=json&spin=1&ui=min"
                  title="Draw.io editor"
                />
                <label>
                  Draw.io XML
                  <textarea
                    value={diagramXml}
                    onChange={(event) => setDiagramXml(event.target.value)}
                    rows={8}
                  />
                </label>
                <div className="diagram-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setDiagramXml(BLANK_DRAWIO_XML)}
                  >
                    Blank XML
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => void saveDiagramVersion()}
                    disabled={!activeDiagram || isSavingDiagram}
                  >
                    {isSavingDiagram ? 'Saving' : 'Save version'}
                  </button>
                </div>
              </div>

              <div className="diagram-versions" aria-label="Diagram versions">
                <span className="panel-label">Versions</span>
                {diagramVersions.map((version) => (
                  <button
                    key={version.id}
                    className="version-option"
                    type="button"
                    onClick={() => setDiagramXml(version.drawio_xml)}
                  >
                    Version {version.version_number}
                  </button>
                ))}
                {diagramVersions.length === 0 ? <p>No versions.</p> : null}
              </div>
            </div>
          </article>

          <article className="panel create-diagram-panel">
            <span className="panel-label">New manual diagram</span>
            <form className="diagram-form" onSubmit={createDiagram}>
              <label>
                Title
                <input
                  value={diagramTitle}
                  onChange={(event) => setDiagramTitle(event.target.value)}
                  required
                />
              </label>
              <label>
                Type
                <select value={diagramType} onChange={(event) => setDiagramType(event.target.value)}>
                  <option value="class">Class</option>
                  <option value="flowchart">Flowchart</option>
                  <option value="sequence">Sequence</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={!activeProject || isCreatingDiagram}
              >
                {isCreatingDiagram ? 'Creating' : 'Create diagram'}
              </button>
            </form>
          </article>
        </section>

        {error ? <p className="status-message error-message">{error}</p> : null}
      </main>
    )
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <span className="eyebrow">SRS Diagram Platform</span>
        <h1>Sign in</h1>
        <p>Access SRS generation, diagrams, and workspace projects.</p>
      </section>

      <section className="auth-panel" aria-label="Authentication">
        <div className="mode-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={submitAuth}>
          {mode === 'register' ? (
            <label>
              Full name
              <input
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              autoComplete="email"
              inputMode="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={mode === 'register' ? 8 : 1}
            />
          </label>

          {error ? <p className="status-message error-message">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting' : mode === 'register' ? 'Create account' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default App