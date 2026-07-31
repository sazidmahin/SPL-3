import { useState } from 'react'
import type { FormEvent } from 'react'
import './AuthView.css'
import type { AuthMode } from '../../domains/auth/types'
import { AuthField, AuthFrame, AuthIcon, AuthLinkButton, AuthPanelHeader } from './components/AuthFrame'

type AuthFlowView = AuthMode | 'forgot' | 'reset' | 'verify' | 'workspace'

type AuthViewProps = {
  mode: AuthMode
  email: string
  password: string
  fullName: string
  verificationCode: string
  error: string | null
  isSubmitting: boolean
  onModeChange: (mode: AuthMode) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onVerificationCodeChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onVerifyEmail: (event: FormEvent<HTMLFormElement>) => void
  onMockLogin: () => void
}

export function AuthView({
  mode,
  email,
  password,
  fullName,
  verificationCode,
  error,
  isSubmitting,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onVerificationCodeChange,
  onSubmit,
  onVerifyEmail,
  onMockLogin,
}: AuthViewProps) {
  const [flowView, setFlowView] = useState<AuthFlowView>(mode)
  const visibleView = mode === 'register' && verificationCode ? 'verify' : flowView === 'login' || flowView === 'register' ? mode : flowView

  function switchMode(nextMode: AuthMode) {
    onModeChange(nextMode)
    setFlowView(nextMode)
  }

  if (visibleView === 'forgot') {
    return <ForgotPasswordView email={email} onEmailChange={onEmailChange} onBack={() => switchMode('login')} onSent={() => setFlowView('reset')} />
  }

  if (visibleView === 'reset') {
    return <ResetPasswordView password={password} onPasswordChange={onPasswordChange} onBack={() => switchMode('login')} />
  }

  if (visibleView === 'verify') {
    return (
      <VerifyEmailView
        email={email}
        error={error}
        isSubmitting={isSubmitting}
        verificationCode={verificationCode}
        onBack={() => switchMode('login')}
        onChangeEmail={() => switchMode('register')}
        onCodeChange={onVerificationCodeChange}
        onSubmit={onVerifyEmail}
      />
    )
  }

  if (visibleView === 'workspace') {
    return <WorkspaceOnboardingView onContinue={() => switchMode('login')} />
  }

  return (
    <AuthFrame artwork={mode === 'register' ? 'profile' : 'lock'}>
      <AuthPanelHeader
        title={mode === 'register' ? 'Create your account' : 'Welcome back!'}
        subtitle={mode === 'register' ? 'Join thousands of teams building better software with AI-assisted SRS and diagrams.' : 'Sign in to continue to your SRS workspace'}
      />

      <form className={`auth-form ${mode === 'register' ? 'auth-register-form' : ''}`} onSubmit={onSubmit}>
        {mode === 'register' ? (
          <AuthField
            autoComplete="name"
            icon="user"
            label="Full name"
            placeholder="Enter your full name"
            required
            value={fullName}
            onChange={onFullNameChange}
          />
        ) : null}

        <AuthField
          autoComplete="email"
          icon="mail"
          inputMode="email"
          label={mode === 'register' ? 'Work Email' : 'Email address'}
          placeholder={mode === 'register' ? 'name@company.com' : 'Enter your email'}
          required
          type="email"
          value={email}
          onChange={onEmailChange}
        />

        {mode === 'register' ? (
          <>
            <label className="auth-field auth-company-field">
              <span>Company Name</span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true"><AuthIcon name="home" /></span>
                <input autoComplete="organization" placeholder="Enter company name" required type="text" />
              </span>
            </label>
            <label className="auth-field auth-role-field">
              <span>Role</span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true"><AuthIcon name="user" /></span>
                <select defaultValue="" required>
                  <option value="" disabled>Select your role</option>
                  <option>Product Manager</option>
                  <option>Business Analyst</option>
                  <option>Software Engineer</option>
                  <option>Organization Admin</option>
                </select>
              </span>
            </label>
          </>
        ) : null}

        <AuthField
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          icon="lock"
          label="Password"
          minLength={mode === 'register' ? 8 : 1}
          placeholder={mode === 'register' ? 'Create a strong password' : 'Enter your password'}
          required
          type="password"
          value={password}
          onChange={onPasswordChange}
        />

        {mode === 'register' ? (
          <AuthField
            autoComplete="new-password"
            icon="lock"
            label="Confirm password"
            minLength={8}
            placeholder="Confirm your password"
            required
            type="password"
            value={password}
            onChange={onPasswordChange}
          />
        ) : null}

        {mode === 'login' ? (
          <div className="auth-form-row">
            <label className="auth-checkline">
              <input defaultChecked type="checkbox" />
              <span>Remember me</span>
            </label>
            <AuthLinkButton onClick={() => setFlowView('forgot')}>Forgot password?</AuthLinkButton>
          </div>
        ) : (
          <label className="auth-checkline auth-terms-line">
            <input type="checkbox" required />
            <span>
              I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
            </span>
          </label>
        )}

        {error ? <p className="status-message error-message">{error}</p> : null}

        <button className="primary-button auth-submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting' : mode === 'register' ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="auth-social-divider"><span>or continue with</span></div>
      <div className="auth-social-actions">
        <button type="button"><span>G</span> {mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}</button>
        <button type="button"><span>M</span> {mode === 'register' ? 'Sign up with Microsoft' : 'Continue with Microsoft'}</button>
      </div>

      {mode === 'login' ? (
        <button className="mock-login-button" type="button" onClick={onMockLogin}>
          Use mock account
        </button>
      ) : null}

      {mode === 'login' ? (
        <footer className="auth-footer-switch">
          <span>Don't have an account?</span>
          <AuthLinkButton onClick={() => switchMode('register')}>Create account</AuthLinkButton>
        </footer>
      ) : (
        <footer className="auth-footer-switch">
          <span>Already have an account?</span>
          <AuthLinkButton onClick={() => switchMode('login')}>Sign in</AuthLinkButton>
        </footer>
      )}
    </AuthFrame>
  )
}

type EmailProps = {
  email: string
  onEmailChange: (value: string) => void
}

function ForgotPasswordView({ email, onEmailChange, onBack, onSent }: EmailProps & { onBack: () => void; onSent: () => void }) {
  return (
    <AuthFrame artwork="question">
      <AuthPanelHeader title="Forgot your password?" subtitle="Enter your email address and we'll send you a link to reset your password." />
      <form className="auth-form auth-spacious-form" onSubmit={(event) => event.preventDefault()}>
        <AuthField
          autoComplete="email"
          icon="mail"
          inputMode="email"
          label="Email address"
          placeholder="Enter your email"
          required
          type="email"
          value={email}
          onChange={onEmailChange}
        />
        <button className="primary-button auth-submit-button" type="button" onClick={onSent}>
          Send Reset Link
        </button>
      </form>
      <footer className="auth-back-row">
        <AuthLinkButton onClick={onBack}>Back to sign in</AuthLinkButton>
      </footer>
    </AuthFrame>
  )
}

function ResetPasswordView({ password, onPasswordChange, onBack }: { password: string; onPasswordChange: (value: string) => void; onBack: () => void }) {
  return (
    <AuthFrame artwork="key">
      <AuthPanelHeader title="Reset your password" subtitle="Enter and confirm your new password." />
      <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
        <AuthField
          autoComplete="new-password"
          icon="lock"
          label="New password"
          placeholder="Create a strong password"
          required
          type="password"
          value={password}
          onChange={onPasswordChange}
        />
        <ul className="password-rules">
          <li>At least 8 characters</li>
          <li>Include uppercase and lowercase letters</li>
          <li>Include a number or special character</li>
        </ul>
        <AuthField
          autoComplete="new-password"
          icon="lock"
          label="Confirm new password"
          placeholder="Confirm your new password"
          required
          type="password"
          value={password}
          onChange={onPasswordChange}
        />
        <button className="primary-button auth-submit-button" type="button" onClick={onBack}>
          Reset Password
        </button>
      </form>
      <footer className="auth-back-row">
        <AuthLinkButton onClick={onBack}>Back to sign in</AuthLinkButton>
      </footer>
    </AuthFrame>
  )
}

function VerifyEmailView({
  email,
  error,
  isSubmitting,
  verificationCode,
  onBack,
  onChangeEmail,
  onCodeChange,
  onSubmit,
}: {
  email: string
  error: string | null
  isSubmitting: boolean
  verificationCode: string
  onBack: () => void
  onChangeEmail: () => void
  onCodeChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <AuthFrame artwork="mail">
      <section className="auth-state-panel">
        <span className="success-orb"><AuthIcon name="check" /></span>
        <AuthPanelHeader title="Verify your email" subtitle={`Enter the 6 digit verification code sent to ${email || 'your email'}.`} />
        <form className="auth-form auth-spacious-form" onSubmit={onSubmit}>
          <AuthField
            autoComplete="one-time-code"
            icon="mail"
            label="Verification code"
            minLength={6}
            placeholder="Enter 6 digit code"
            required
            value={verificationCode}
            onChange={onCodeChange}
          />
          {error ? <p className="status-message error-message">{error}</p> : null}
          <button className="primary-button auth-submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying' : 'Verify Email'}
          </button>
        </form>
        <p className="auth-info-box">In console email mode, the backend returns the code automatically so local testing stays quick.</p>
        <div className="auth-state-actions">
          <AuthLinkButton onClick={onBack}>Back to sign in</AuthLinkButton>
          <AuthLinkButton onClick={onChangeEmail}>Change email address</AuthLinkButton>
        </div>
      </section>
    </AuthFrame>
  )
}

function WorkspaceOnboardingView({ onContinue }: { onContinue: () => void }) {
  return (
    <AuthFrame artwork="home">
      <AuthPanelHeader title="Choose your workspace" subtitle="Select how you plan to use SRS Platform." />
      <section className="workspace-choice-card">
        <div className="workspace-choice-main">
          <span className="workspace-choice-icon"><AuthIcon name="user" /></span>
          <div>
            <strong>Personal Use</strong>
            <p>For individual projects, documents, diagrams, and personal productivity.</p>
          </div>
        </div>
        <StatusBadge>Recommended</StatusBadge>
      </section>
      <section className="workspace-auto-card">
        <strong>Your personal workspace will be created automatically</strong>
        <ul>
          <li>Get your own private workspace</li>
          <li>Invite collaborators anytime</li>
          <li>Upgrade or change later</li>
        </ul>
      </section>
      <button className="primary-button auth-submit-button" type="button" onClick={onContinue}>
        Continue to Workspace
      </button>
    </AuthFrame>
  )
}

function StatusBadge({ children }: { children: string }) {
  return <span className="auth-status-badge">{children}</span>
}
