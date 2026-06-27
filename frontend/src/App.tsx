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
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() =>
    window.localStorage.getItem(WORKSPACE_STORAGE_KEY),
  )
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    window.localStorage.getItem(PROJECT_STORAGE_KEY),
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingMe, setIsLoadingMe] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

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
      if (!nextProjects.some((project) => project.id === activeProjectId)) {
        const firstProjectId = nextProjects[0]?.id ?? null
        setActiveProjectId(firstProjectId)
        if (firstProjectId) {
          window.localStorage.setItem(PROJECT_STORAGE_KEY, firstProjectId)
        } else {
          window.localStorage.removeItem(PROJECT_STORAGE_KEY)
        }
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
        await loadProjects(nextSession, nextWorkspaceId)
      } else {
        setProjects([])
        setActiveProjectId(null)
        window.localStorage.removeItem(WORKSPACE_STORAGE_KEY)
        window.localStorage.removeItem(PROJECT_STORAGE_KEY)
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
    setSession(null)
    setWorkspaces([])
    setProjects([])
    setActiveWorkspaceId(null)
    setActiveProjectId(null)
    setPassword('')
    setError(null)
  }

  async function selectWorkspace(workspaceId: string) {
    setActiveWorkspaceId(workspaceId)
    setActiveProjectId(null)
    setProjects([])
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
    window.localStorage.removeItem(PROJECT_STORAGE_KEY)
    if (session) {
      await loadProjects(session, workspaceId)
    }
  }

  function selectProject(projectId: string) {
    setActiveProjectId(projectId)
    window.localStorage.setItem(PROJECT_STORAGE_KEY, projectId)
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
      selectProject(project.id)
      setProjectName('')
      setProjectDescription('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create project')
    } finally {
      setIsCreatingProject(false)
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
                disabled={isLoadingMe || isLoadingProjects}
              >
                {isLoadingMe || isLoadingProjects ? 'Refreshing' : 'Refresh'}
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
                    onClick={() => selectProject(project.id)}
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
                    <div className="project-actions" aria-label="Project areas">
                      <button className="secondary-button" type="button" disabled>
                        SRS
                      </button>
                      <button className="secondary-button" type="button" disabled>
                        Diagrams
                      </button>
                    </div>
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