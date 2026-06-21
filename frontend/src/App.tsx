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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingMe, setIsLoadingMe] = useState(false)

  const activeWorkspace = useMemo(() => workspaces[0], [workspaces])

  async function loadCurrentUser(authSession: AuthSession) {
    setIsLoadingMe(true)
    setError(null)
    try {
      const current = await parseApiResponse<CurrentUserResponse>(
        await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${authSession.access_token}` },
        }),
      )
      setSession({ ...authSession, user: current.user })
      setWorkspaces(current.workspaces)
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ ...authSession, user: current.user }),
      )
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
    setSession(null)
    setWorkspaces([])
    setPassword('')
    setError(null)
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
              <span className="panel-label">Active workspace</span>
              <button
                className="text-button"
                type="button"
                onClick={() => loadCurrentUser(session)}
                disabled={isLoadingMe}
              >
                {isLoadingMe ? 'Refreshing' : 'Refresh'}
              </button>
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
