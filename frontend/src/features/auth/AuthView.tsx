import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './AuthView.css'
import type { AuthMode } from '../../domains/auth/types'
import { AuthField, AuthFrame, AuthIcon, AuthLinkButton, AuthPanelHeader } from './components/AuthFrame'
import { Check } from 'lucide-react'

type AuthFlowView = AuthMode | 'forgot' | 'forgot-code' | 'reset' | 'verify' | 'workspace'

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
}: AuthViewProps) {
  const [flowView, setFlowView] = useState<AuthFlowView>(mode)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [forgotResetCode, setForgotResetCode] = useState('')
  const visibleView = mode === 'register' && verificationCode ? 'verify' : flowView === 'login' || flowView === 'register' ? mode : flowView

  function switchMode(nextMode: AuthMode) {
    onModeChange(nextMode)
    setFlowView(nextMode)
    setFieldErrors({})
  }

  function updateEmail(value: string) {
    onEmailChange(value)
    if (fieldErrors.email) {
      setFieldErrors((current) => ({ ...current, email: '' }))
    }
  }

  function updatePassword(value: string) {
    onPasswordChange(value)
    if (fieldErrors.password) {
      setFieldErrors((current) => ({ ...current, password: '' }))
    }
  }

  function updateFullName(value: string) {
    onFullNameChange(value)
    if (fieldErrors.fullName) {
      setFieldErrors((current) => ({ ...current, fullName: '' }))
    }
  }

  function updateCompanyName(value: string) {
    setCompanyName(value)
    if (fieldErrors.companyName) {
      setFieldErrors((current) => ({ ...current, companyName: '' }))
    }
  }

  function updateRole(event: ChangeEvent<HTMLSelectElement>) {
    setRole(event.target.value)
    if (fieldErrors.role) {
      setFieldErrors((current) => ({ ...current, role: '' }))
    }
  }

  function updateConfirmPassword(value: string) {
    setConfirmPassword(value)
    if (fieldErrors.confirmPassword) {
      setFieldErrors((current) => ({ ...current, confirmPassword: '' }))
    }
  }

  function updateTermsAccepted(event: ChangeEvent<HTMLInputElement>) {
    setTermsAccepted(event.target.checked)
    if (fieldErrors.terms) {
      setFieldErrors((current) => ({ ...current, terms: '' }))
    }
  }

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors: Record<string, string> = {}

    if (!email.trim()) {
      nextErrors.email = 'Enter your email'
    }
    if (!password.trim()) {
      nextErrors.password = mode === 'register' ? 'Create your password' : 'Enter your password'
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        nextErrors.fullName = 'Enter your full name'
      }
      if (!confirmPassword.trim()) {
        nextErrors.confirmPassword = 'Confirm your password'
      } else if (password && confirmPassword !== password) {
        nextErrors.confirmPassword = 'Passwords do not match'
      }
      if (!termsAccepted) {
        nextErrors.terms = 'Accept the terms to continue'
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault()
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    onSubmit(event)
  }

  if (visibleView === 'forgot') {
    return <ForgotPasswordView email={email} onEmailChange={onEmailChange} onBack={() => switchMode('login')} onSent={() => setFlowView('forgot-code')} />
  }

  if (visibleView === 'forgot-code') {
    return (
      <ForgotPasswordCodeView
        code={forgotResetCode}
        email={email}
        onBack={() => setFlowView('forgot')}
        onCodeChange={setForgotResetCode}
        onSubmit={() => setFlowView('reset')}
      />
    )
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
        subtitle={mode === 'register' ? 'Create your workspace and start building better SRS documents with AI.' : 'Sign in to continue to your SRS workspace'}
      />

      <form className={`auth-form ${mode === 'register' ? 'auth-register-form' : ''}`} noValidate onSubmit={handleAuthSubmit}>
        {mode === 'register' ? (
          <AuthField
            autoComplete="name"
            icon="user"
            label="Full name"
            placeholder="Enter your full name"
            required
            value={fullName}
            error={fieldErrors.fullName}
            onChange={updateFullName}
          />
        ) : null}

        <AuthField
          autoComplete="email"
          icon="mail"
          inputMode="email"
          label="Email address"
          placeholder="Enter your email"
          required
          type="email"
          value={email}
          error={fieldErrors.email}
          onChange={updateEmail}
        />

        {mode === 'register' ? (
          <>
            <label className={`auth-field auth-company-field ${fieldErrors.companyName ? 'auth-field-error' : ''}`}>
              <span>Company Name <small>Optional</small></span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true"><AuthIcon name="home" /></span>
                <input
                  aria-invalid={Boolean(fieldErrors.companyName)}
                  autoComplete="organization"
                  placeholder="Enter company name"
                  type="text"
                  value={companyName}
                  onChange={(event) => updateCompanyName(event.target.value)}
                />
              </span>
              {fieldErrors.companyName ? <small className="auth-field-message">{fieldErrors.companyName}</small> : null}
            </label>
            <label className={`auth-field auth-role-field ${fieldErrors.role ? 'auth-field-error' : ''}`}>
              <span>Role <small>Optional</small></span>
              <span className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true"><AuthIcon name="user" /></span>
                <select aria-invalid={Boolean(fieldErrors.role)} value={role} onChange={updateRole}>
                  <option value="">Select your role</option>
                  <option>Product Manager</option>
                  <option>Business Analyst</option>
                  <option>Software Engineer</option>
                  <option>Organization Admin</option>
                </select>
              </span>
              {fieldErrors.role ? <small className="auth-field-message">{fieldErrors.role}</small> : null}
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
          error={fieldErrors.password}
          onChange={updatePassword}
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
            value={confirmPassword}
            error={fieldErrors.confirmPassword}
            onChange={updateConfirmPassword}
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
          <div className={`auth-terms-group ${fieldErrors.terms ? 'auth-field-error' : ''}`}>
            <label className="auth-checkline auth-terms-line">
              <input checked={termsAccepted} type="checkbox" required onChange={updateTermsAccepted} />
              <span>
                I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
              </span>
            </label>
            {fieldErrors.terms ? <small className="auth-field-message auth-terms-message">{fieldErrors.terms}</small> : null}
          </div>
        )}

        {error ? <p className="status-message error-message">{error}</p> : null}

        <button className="primary-button auth-submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting' : mode === 'register' ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="auth-social-divider"><span>or continue with</span></div>
      <div className="auth-social-actions">
        <button type="button"><GoogleLogo /> {mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}</button>
        <button type="button"><MicrosoftLogo /> {mode === 'register' ? 'Sign up with Microsoft' : 'Continue with Microsoft'}</button>
      </div>



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

function GoogleLogo() {
  return (
    <img
      className="auth-provider-logo"
      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
      alt=""
      aria-hidden="true"
    />
  )
}

function MicrosoftLogo() {
  return (
    <img
      className="auth-provider-logo"
      src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
      alt=""
      aria-hidden="true"
    />
  )
}

type EmailProps = {
  email: string
  onEmailChange: (value: string) => void
}

function ForgotPasswordView({ email, onEmailChange, onBack, onSent }: EmailProps & { onBack: () => void; onSent: () => void }) {
  const [emailError, setEmailError] = useState('')

  function updateForgotEmail(value: string) {
    onEmailChange(value)
    if (emailError) {
      setEmailError('')
    }
  }

  function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) {
      setEmailError('Enter your email')
      return
    }
    setEmailError('')
    onSent()
  }

  return (
    <AuthFrame artwork="question">
      <AuthPanelHeader title="Forgot your password?" subtitle="Enter your email address and we'll send you a link to reset your password." />
      <form className="auth-form auth-spacious-form" noValidate onSubmit={submitForgotPassword}>
        <AuthField
          autoComplete="email"
          icon="mail"
          inputMode="email"
          label="Email address"
          placeholder="Enter your email"
          required
          type="email"
          value={email}
          error={emailError}
          onChange={updateForgotEmail}
        />
        <button className="primary-button auth-submit-button" type="submit">
          Send Reset Link
        </button>
      </form>
      <footer className="auth-back-row">
        <AuthLinkButton onClick={onBack}>Back to sign in</AuthLinkButton>
      </footer>
    </AuthFrame>
  )
}

function ForgotPasswordCodeView({
  email,
  code,
  onCodeChange,
  onBack,
  onSubmit,
}: {
  email: string
  code: string
  onCodeChange: (value: string) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const [codeError, setCodeError] = useState('')

  function updateCode(value: string) {
    onCodeChange(value.replace(/\D/g, '').slice(0, 6))
    if (codeError) {
      setCodeError('')
    }
  }

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!code.trim()) {
      setCodeError('Enter the 6 digit code')
      return
    }
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Code must be 6 digits')
      return
    }
    setCodeError('')
    onSubmit()
  }

  return (
    <AuthFrame artwork="mail">
      <AuthPanelHeader title="Enter verification code" subtitle={`We sent a 6 digit code to ${email || 'your email'}.`} />
      <form className="auth-form auth-spacious-form" noValidate onSubmit={submitCode}>
        <AuthField
          autoComplete="one-time-code"
          icon="mail"
          inputMode="numeric"
          label="Verification code"
          minLength={6}
          placeholder="Enter 6 digit code"
          required
          value={code}
          error={codeError}
          onChange={updateCode}
        />
        <button className="primary-button auth-submit-button" type="submit">
          Verify Code
        </button>
      </form>
      <footer className="auth-back-row">
        <AuthLinkButton onClick={onBack}>Back to email</AuthLinkButton>
      </footer>
    </AuthFrame>
  )
}
function ResetPasswordView({ password, onPasswordChange, onBack }: { password: string; onPasswordChange: (value: string) => void; onBack: () => void }) {
  const passwordRules = [
    { label: 'At least 8 characters', passed: password.length >= 8 },
    { label: 'Include uppercase and lowercase letters', passed: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Include a number or special character', passed: /[0-9\W_]/.test(password) },
  ]

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
          {passwordRules.map((rule) => (
            <li className={rule.passed ? 'passed' : undefined} key={rule.label}>
              <span aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
              {rule.label}
            </li>
          ))}
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


