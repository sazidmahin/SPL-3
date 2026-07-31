import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { fetchCurrentUser } from '../domains/auth/api'
import { clearStoredSession, readStoredSession, writeStoredSession } from '../domains/auth/sessionStorage'
import type { AuthSession } from '../domains/auth/types'
import { checkoutPlan as checkoutPlanRequest, fetchBillingSummary } from '../domains/billing/api'
import type { Plan, Subscription, Usage } from '../domains/billing/types'
import {
  createDiagramVersion,
  exportDiagram,
  fetchDiagramDetail,
  fetchDiagrams,
  fetchDiagramVersions,
  generateClassDiagram,
} from '../domains/diagram/api'
import { BLANK_DRAWIO_XML } from '../domains/diagram/constants'
import type { ClassDiagramMethod, Diagram, DiagramDetail, DiagramVersion } from '../domains/diagram/types'
import { fetchProjects } from '../domains/project/api'
import type { Project } from '../domains/project/types'
import {
  exportSrsDocument,
  fetchGenerationJobs,
  fetchSrsDocumentDetail,
  fetchSrsDocuments,
  generateSrs,
  runAiSrsGenerate,
  runSrsIntake,
  submitSrsClarifications,
} from '../domains/srs/api'
import type { AiSrsGenerateResponse, ClarificationAnswer, GenerationJob, SrsDocument, SrsPipelineResponse } from '../domains/srs/types'
import type { WorkspaceMembership } from '../domains/workspace/types'
import { filenameFromContentDisposition, downloadTextFile } from '../shared/download'
import { isUnauthorizedError } from '../shared/apiClient'
import { useAuthForm } from './hooks/useAuthForm'
import { useDiagramCreation } from './hooks/useDiagramCreation'
import { useProjectCreation } from './hooks/useProjectCreation'
import { useWorkspaceCreation } from './hooks/useWorkspaceCreation'
import { errorMessage } from './support/errors'
import { PROJECT_STORAGE_KEY, DIAGRAM_STORAGE_KEY, WORKSPACE_STORAGE_KEY } from '../shared/storage'

export function useAppController() {
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
  const [diagramXml, setDiagramXml] = useState(BLANK_DRAWIO_XML)
  const [srsTitle, setSrsTitle] = useState('')
  const [srsRawText, setSrsRawText] = useState('')
  const [generateClassDiagramFromSrsInput, setGenerateClassDiagramFromSrsInput] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  const didValidateStoredSession = useRef(false)

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

  const activePlan = subscription?.plan
  const canUseManualDrawio = Boolean(activePlan?.can_use_manual_drawio)
  const canGenerateSrs = Boolean(activePlan?.can_generate_srs)
  const canGenerateAiDiagrams = Boolean(activePlan?.can_generate_ai_diagrams)
  const canExportSrs = Boolean(activePlan?.can_export_srs)
  const canExportDiagrams = Boolean(activePlan?.can_export_diagrams)

  const authForm = useAuthForm({
    onAuthenticated: handleAuthenticated,
    onRegistered: () => undefined,
    setError,
  })
  const workspaceCreation = useWorkspaceCreation({
    session,
    onCreated: handleWorkspaceCreated,
    setError,
  })
  const projectCreation = useProjectCreation({
    session,
    activeWorkspace,
    onCreated: handleProjectCreated,
    setError,
  })
  const diagramCreation = useDiagramCreation({
    session,
    activeWorkspace,
    activeProject,
    diagramXml,
    onCreated: handleDiagramCreated,
    setError,
  })

  useEffect(() => {
    if (didValidateStoredSession.current) {
      return
    }

    didValidateStoredSession.current = true
    if (session && workspaces.length === 0) {
      void loadCurrentUser(session)
    }
    // Stored sessions should be checked once on startup; later refreshes are user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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


  function expireSession() {
    clearStoredSession()
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY)
    clearProjectState()
    setSession(null)
    setWorkspaces([])
    setPlans([])
    setSubscription(null)
    setUsage(null)
    setActiveWorkspaceId(null)
    authForm.clearPassword()
  }

  function handleRequestError(caught: unknown, fallback: string) {
    if (isUnauthorizedError(caught)) {
      expireSession()
      return 'Your session expired. Please sign in again.'
    }
    return errorMessage(caught, fallback)
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
      setError(handleRequestError(caught, 'Unable to load billing'))
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
      setError(handleRequestError(caught, 'Unable to load generation jobs'))
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
      setError(handleRequestError(caught, 'Unable to load SRS documents'))
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
      setError(handleRequestError(caught, 'Unable to load diagrams'))
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
      setError(handleRequestError(caught, 'Unable to load projects'))
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
      clearStoredSession()
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY)
      clearProjectState()
      setSession(null)
      setWorkspaces([])
      setPlans([])
      setSubscription(null)
      setUsage(null)
      setActiveWorkspaceId(null)
      setError(errorMessage(caught, 'Unable to load session'))
    } finally {
      setIsLoadingMe(false)
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
    setActiveWorkspaceId(null)
    authForm.clearPassword()
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
      setError(errorMessage(caught, 'Unable to load diagram'))
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
      setError(handleRequestError(caught, 'Unable to start checkout'))
    } finally {
      setIsCheckingOut(false)
    }
  }


  function applySrsPipelineResponse(response: SrsPipelineResponse) {
    if (response.job) {
      setGenerationJobs((current) => [response.job!, ...current.filter((job) => job.id !== response.job!.id)])
    }

    if (response.srs_document) {
      setSrsDocuments((current) => [
        response.srs_document!,
        ...current.filter((document) => document.id !== response.srs_document!.id),
      ])
      setActiveSrsDocument(response.srs_document)
    }

    const generatedDiagrams = response.diagrams ?? []
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
  }

  async function runSrsGenerationIntake(payload: {
    title: string
    raw_text: string
    generate_class_diagram: boolean
    diagram_methods: string[]
  }) {
    if (!session || !activeWorkspace || !activeProject) {
      throw new Error('Select a workspace and project before generating SRS')
    }

    setIsStartingGeneration(true)
    setError(null)
    try {
      const response = await runSrsIntake(session.access_token, activeWorkspace.workspace.id, activeProject.id, payload)
      applySrsPipelineResponse(response)
      if (response.status === 'completed') {
        setSrsTitle('')
        setSrsRawText('')
        setGenerateClassDiagramFromSrsInput(false)
        await loadBilling(session, activeWorkspace.workspace.id)
      }
      return response
    } catch (caught) {
      await loadGenerationJobs(session, activeWorkspace.workspace.id, activeProject.id).catch(() => undefined)
      const message = handleRequestError(caught, 'Unable to start SRS generation')
      setError(message)
      throw new Error(message)
    } finally {
      setIsStartingGeneration(false)
    }
  }

  async function answerSrsGenerationClarifications(payload: {
    requirement_input_id: string
    answers: ClarificationAnswer[]
    generate_class_diagram: boolean
    diagram_methods: string[]
  }) {
    if (!session || !activeWorkspace || !activeProject) {
      throw new Error('Select a workspace and project before answering clarifications')
    }

    setIsStartingGeneration(true)
    setError(null)
    try {
      const response = await submitSrsClarifications(
        session.access_token,
        activeWorkspace.workspace.id,
        activeProject.id,
        payload,
      )
      applySrsPipelineResponse(response)
      if (response.status === 'completed') {
        setSrsTitle('')
        setSrsRawText('')
        setGenerateClassDiagramFromSrsInput(false)
        await loadBilling(session, activeWorkspace.workspace.id)
      }
      return response
    } catch (caught) {
      await loadGenerationJobs(session, activeWorkspace.workspace.id, activeProject.id).catch(() => undefined)
      const message = handleRequestError(caught, 'Unable to submit clarification answers')
      setError(message)
      throw new Error(message)
    } finally {
      setIsStartingGeneration(false)
    }
  }


  function aiPreviewToPipelineResponse(
    preview: AiSrsGenerateResponse,
    payload: { requirement_input_id: string; title: string; raw_text: string; generate_class_diagram: boolean; diagram_methods: string[] },
  ): SrsPipelineResponse {
    const now = new Date().toISOString()
    const jobId = crypto.randomUUID()
    const documentId = crypto.randomUUID()
    const requirementInput = {
      id: payload.requirement_input_id,
      workspace_id: activeWorkspace!.workspace.id,
      project_id: activeProject!.id,
      title: preview.title,
      raw_text: preview.raw_text,
      clarification_status: 'clarified' as const,
      clarifying_questions: [],
      clarification_answers: [],
      refined_text: preview.raw_text,
      refinement_metadata: { engine: 'ai_generate_preview', preview_only: true },
      created_by_user_id: session!.user.id,
      created_at: now,
    }
    const job: GenerationJob = {
      id: jobId,
      workspace_id: activeWorkspace!.workspace.id,
      project_id: activeProject!.id,
      requirement_input_id: payload.requirement_input_id,
      job_type: payload.generate_class_diagram ? 'full' : 'srs',
      status: 'completed',
      progress_percent: 100,
      generate_class_diagram: payload.generate_class_diagram,
      diagram_methods: payload.diagram_methods,
      result_payload: {
        preview_only: true,
        current_stage: 'complete',
        pipeline_steps: preview.pipeline_steps,
        llm_calls: preview.llm_calls,
        requirement_count: preview.classified_requirements.length,
      },
      error_message: null,
      created_by_user_id: session!.user.id,
      created_at: now,
      updated_at: now,
      started_at: now,
      completed_at: now,
    }
    const extracted_requirements = preview.classified_requirements.map((item, index) => {
      const row = item as Record<string, unknown>
      return {
        id: crypto.randomUUID(),
        workspace_id: activeWorkspace!.workspace.id,
        project_id: activeProject!.id,
        srs_document_id: documentId,
        requirement_input_id: payload.requirement_input_id,
        generation_job_id: jobId,
        requirement_code: typeof row.requirement_code === 'string' ? row.requirement_code : `REQ-${String(index + 1).padStart(3, '0')}`,
        requirement_text: typeof row.requirement_text === 'string' ? row.requirement_text : '',
        requirement_type: row.requirement_type === 'non_functional' ? 'non_functional' as const : 'functional' as const,
        nfr_subtype: typeof row.nfr_subtype === 'string' ? row.nfr_subtype : null,
        source_trace: typeof row.source_trace === 'string' ? row.source_trace : '',
        extraction_reason: typeof row.extraction_reason === 'string' ? row.extraction_reason : '',
        confidence_score: typeof row.confidence_score === 'number' ? row.confidence_score : 0.9,
        created_at: now,
      }
    })
    const srsDocument: SrsDocument = {
      id: documentId,
      workspace_id: activeWorkspace!.workspace.id,
      project_id: activeProject!.id,
      requirement_input_id: payload.requirement_input_id,
      generation_job_id: jobId,
      title: preview.title,
      status: 'preview',
      content_markdown: preview.content_markdown ?? `# ${preview.title}`,
      content_json: preview.content_json ?? { summary: preview.summary, requirements: preview.classified_requirements },
      created_by_user_id: session!.user.id,
      created_at: now,
      updated_at: now,
      extracted_requirements,
    }

    return {
      status: 'completed',
      requirement_input: requirementInput,
      needs_clarification: false,
      clarifying_questions: [],
      draft_requirement: preview.raw_text,
      refined_requirement: preview.raw_text,
      job,
      srs_document: srsDocument,
      diagrams: [],
      partial_outputs: {
        summary: preview.summary,
        extracted_requirements: preview.extracted_requirements,
        classified_requirements: preview.classified_requirements,
        content_markdown: preview.content_markdown,
        content_json: preview.content_json,
      },
    }
  }
  async function generateSrsFromReadyInput(payload: {
    requirement_input_id: string
    title: string
    raw_text: string
    generate_class_diagram: boolean
    diagram_methods: string[]
  }) {
    if (!session || !activeWorkspace || !activeProject) {
      throw new Error('Select a workspace and project before generating SRS')
    }

    setIsStartingGeneration(true)
    setError(null)
    try {
      const preview = await runAiSrsGenerate(session.access_token, activeWorkspace.workspace.id, activeProject.id, {
        title: payload.title,
        raw_text: payload.raw_text,
      })
      if (preview.status === 'needs_clarification') {
        const questions = preview.clarifying_questions.map((question) => question.question).join(' ')
        throw new Error(questions || 'Requirement input needs clarification before SRS generation')
      }
      const response = aiPreviewToPipelineResponse(preview, payload)
      applySrsPipelineResponse(response)
      if (response.status === 'completed') {
        setSrsTitle('')
        setSrsRawText('')
        setGenerateClassDiagramFromSrsInput(false)
        await loadBilling(session, activeWorkspace.workspace.id)
      }
      return response
    } catch (caught) {
      await loadGenerationJobs(session, activeWorkspace.workspace.id, activeProject.id).catch(() => undefined)
      const message = handleRequestError(caught, 'Unable to generate SRS')
      setError(message)
      throw new Error(message)
    } finally {
      setIsStartingGeneration(false)
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
      await loadGenerationJobs(session, activeWorkspace.workspace.id, activeProject.id).catch(() => undefined)
      setError(handleRequestError(caught, 'Unable to start generation'))
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
      setError(handleRequestError(caught, 'Unable to generate class diagram'))
    } finally {
      setIsGeneratingClassDiagram(false)
    }
  }

  async function exportCurrentSrsDocument() {
    if (!session || !activeWorkspace || !activeProject || !activeSrsDocument) {
      return
    }
    setError(null)
    try {
      const exported = await exportSrsDocument(
        session.access_token,
        activeWorkspace.workspace.id,
        activeProject.id,
        activeSrsDocument.id,
      )
      downloadTextFile(
        filenameFromContentDisposition(exported.filename, `${activeSrsDocument.title}.md`),
        exported.content,
        'text/markdown;charset=utf-8',
      )
    } catch (caught) {
      setError(handleRequestError(caught, 'Unable to export SRS'))
    }
  }

  async function exportCurrentDiagram() {
    if (!session || !activeWorkspace || !activeProject || !activeDiagram) {
      return
    }
    setError(null)
    try {
      const exported = await exportDiagram(
        session.access_token,
        activeWorkspace.workspace.id,
        activeProject.id,
        activeDiagram.id,
      )
      downloadTextFile(
        filenameFromContentDisposition(exported.filename, `${activeDiagram.title}.drawio`),
        exported.content,
        'application/xml;charset=utf-8',
      )
    } catch (caught) {
      setError(handleRequestError(caught, 'Unable to export diagram'))
    }
  }
  function openGeneratedDiagram(diagram: DiagramDetail) {
    setDiagrams((current) => [diagram, ...current.filter((item) => item.id !== diagram.id)])
    setDiagramVersions([diagram.current])
    setActiveDiagramId(diagram.id)
    setDiagramXml(diagram.current.drawio_xml)
    window.localStorage.setItem(DIAGRAM_STORAGE_KEY, diagram.id)
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
      setError(handleRequestError(caught, 'Unable to save diagram'))
    } finally {
      setIsSavingDiagram(false)
    }
  }

  async function handleAuthenticated(nextSession: AuthSession) {
    setSession(nextSession)
    writeStoredSession(nextSession)
    await loadCurrentUser(nextSession)
  }

  async function handleWorkspaceCreated(membership: WorkspaceMembership) {
    setWorkspaces((current) => [...current, membership])
    await selectWorkspace(membership.workspace.id)
  }

  function handleProjectCreated(project: Project) {
    setProjects((current) => [project, ...current])
    setActiveProjectId(project.id)
    clearDiagramState()
    setGenerationJobs([])
    setSrsDocuments([])
    setActiveSrsDocument(null)
    window.localStorage.setItem(PROJECT_STORAGE_KEY, project.id)
  }

  function handleDiagramCreated(detail: DiagramDetail) {
    setDiagrams((current) => [detail, ...current.filter((diagram) => diagram.id !== detail.id)])
    setActiveReviewDiagrams([detail])
    setDiagramVersions([detail.current])
    setActiveDiagramId(detail.id)
    setDiagramXml(detail.current.drawio_xml)
    window.localStorage.setItem(DIAGRAM_STORAGE_KEY, detail.id)
  }
  function refreshCurrentUser() {
    if (session) {
      void loadCurrentUser(session)
    }
  }

  function reloadBilling() {
    if (session && activeWorkspace) {
      void loadBilling(session, activeWorkspace.workspace.id)
    }
  }

  function reloadProjects() {
    if (session && activeWorkspace) {
      void loadProjects(session, activeWorkspace.workspace.id)
    }
  }

  function reloadSrsArtifacts() {
    if (session && activeWorkspace && activeProject) {
      void Promise.all([
        loadGenerationJobs(session, activeWorkspace.workspace.id, activeProject.id),
        loadSrsDocuments(session, activeWorkspace.workspace.id, activeProject.id),
      ])
    }
  }

  function reloadDiagrams() {
    if (session && activeWorkspace && activeProject) {
      void loadDiagrams(session, activeWorkspace.workspace.id, activeProject.id)
    }
  }

  function selectSrsDocument(documentId: string) {
    if (session && activeWorkspace && activeProject) {
      void loadSrsDocumentDetail(session, activeWorkspace.workspace.id, activeProject.id, documentId)
    }
  }

  return {
    shell: {
      session,
      error,
      signOut,
    },
    authView: {
      mode: authForm.mode,
      email: authForm.email,
      password: authForm.password,
      fullName: authForm.fullName,
      verificationCode: authForm.verificationCode,
      error,
      isSubmitting: authForm.isSubmitting,
      onModeChange: authForm.setMode,
      onEmailChange: authForm.setEmail,
      onPasswordChange: authForm.setPassword,
      onFullNameChange: authForm.setFullName,
      onVerificationCodeChange: authForm.setVerificationCode,
      onSubmit: authForm.submitAuth,
      onVerifyEmail: authForm.submitVerification,
    },
    workspacePanel: {
      workspaces,
      activeWorkspace,
      isRefreshing: isLoadingMe || isLoadingProjects || isLoadingDiagrams,
      onRefresh: refreshCurrentUser,
      onSelectWorkspace: (workspaceId: string) => void selectWorkspace(workspaceId),
    },
    createWorkspacePanel: {
      workspaceName: workspaceCreation.workspaceName,
      workspaceSlug: workspaceCreation.workspaceSlug,
      isCreatingWorkspace: workspaceCreation.isCreatingWorkspace,
      onWorkspaceNameChange: workspaceCreation.applyWorkspaceName,
      onWorkspaceSlugChange: workspaceCreation.setWorkspaceSlug,
      onSubmit: workspaceCreation.createWorkspace,
    },
    billingPanel: {
      activeWorkspace,
      plans,
      subscription,
      usage,
      isLoadingBilling,
      isCheckingOut,
      onReload: reloadBilling,
      onCheckoutPlan: (planCode: string) => void checkoutPlan(planCode),
    },
    projectsPanel: {
      activeWorkspace,
      activeProject,
      projects,
      isLoadingProjects,
      onReload: reloadProjects,
      onSelectProject: (projectId: string) => void selectProject(projectId),
    },
    createProjectPanel: {
      activeWorkspace,
      projectName: projectCreation.projectName,
      projectDescription: projectCreation.projectDescription,
      isCreatingProject: projectCreation.isCreatingProject,
      onProjectNameChange: projectCreation.setProjectName,
      onProjectDescriptionChange: projectCreation.setProjectDescription,
      onSubmit: projectCreation.createProject,
    },
    srsPanel: {
      activeWorkspace,
      activeProject,
      generationJobs,
      srsDocuments,
      activeSrsDocument,
      generatedDiagrams: activeReviewDiagrams,
      srsTitle,
      srsRawText,
      generateClassDiagram: generateClassDiagramFromSrsInput,
      isLoadingGenerationJobs,
      isLoadingSrsDocuments,
      isStartingGeneration,
      isGeneratingClassDiagram,
      canGenerateSrs,
      canGenerateAiDiagrams,
      canExportSrs,
      onReload: reloadSrsArtifacts,
      onSrsTitleChange: setSrsTitle,
      onSrsRawTextChange: setSrsRawText,
      onGenerateClassDiagramChange: setGenerateClassDiagramFromSrsInput,
      onStartGeneration: startSrsGeneration,
      onSelectSrsDocument: selectSrsDocument,
      onGenerateClassDiagram: (methods: ClassDiagramMethod[]) => void generateClassDiagramFromSrs(methods),
      onExportSrs: () => void exportCurrentSrsDocument(),
      onOpenGeneratedDiagram: openGeneratedDiagram,
      onRunIntake: runSrsGenerationIntake,
      onSubmitClarifications: answerSrsGenerationClarifications,
      onGenerateFromRequirement: generateSrsFromReadyInput,
    },
    diagramsPanel: {
      activeWorkspace,
      activeProject,
      activeDiagram,
      diagrams,
      diagramVersions,
      diagramXml,
      isLoadingDiagrams,
      isSavingDiagram,
      canUseManualDrawio,
      canExportDiagrams,
      onReload: reloadDiagrams,
      onSelectDiagram: (diagramId: string) => void selectDiagram(diagramId),
      onDiagramXmlChange: setDiagramXml,
      onResetXml: () => setDiagramXml(BLANK_DRAWIO_XML),
      onSaveVersion: () => void saveDiagramVersion(),
      onExportDiagram: () => void exportCurrentDiagram(),
    },
    createDiagramPanel: {
      activeProject,
      diagramTitle: diagramCreation.diagramTitle,
      diagramType: diagramCreation.diagramType,
      isCreatingDiagram: diagramCreation.isCreatingDiagram,
      canUseManualDrawio,
      onDiagramTitleChange: diagramCreation.setDiagramTitle,
      onDiagramTypeChange: diagramCreation.setDiagramType,
      onSubmit: diagramCreation.createDiagram,
    },
  }
}





