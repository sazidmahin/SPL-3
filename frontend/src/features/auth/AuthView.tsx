import type { FormEvent } from 'react'
import './AuthView.css'
import type { AuthMode } from '../../domains/auth/types'

type AuthViewProps = {
  mode: AuthMode
  email: string
  password: string
  fullName: string
  error: string | null
  isSubmitting: boolean
  onModeChange: (mode: AuthMode) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthView({
  mode,
  email,
  password,
  fullName,
  error,
  isSubmitting,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onSubmit,
}: AuthViewProps) {
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
            onClick={() => onModeChange('login')}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => onModeChange('register')}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === 'register' ? (
            <label>
              Full name
              <input
                autoComplete="name"
                value={fullName}
                onChange={(event) => onFullNameChange(event.target.value)}
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
              onChange={(event) => onEmailChange(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
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