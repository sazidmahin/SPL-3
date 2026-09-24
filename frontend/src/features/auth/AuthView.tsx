import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { AuthMode } from '../../domains/auth/types'
import { AuthField, AuthFrame, AuthIcon, AuthLinkButton, AuthPanelHeader } from './components/AuthFrame'
import { Check } from 'lucide-react'

type AuthFlowView = AuthMode | 'forgot' | 'forgot-code' | 'reset' | 'verify' | 'workspace'

const formClass = 'grid gap-4'
const spaciousFormClass = 'grid gap-5'
const submitClass = 'inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent2-dim px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_color-mix(in_oklab,var(--color-accent)_90%,transparent)] transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55'
const manualFieldClass = 'grid gap-1.5'
const manualInputClass = 'min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-3'
const inputWrapClass = 'flex h-11 items-center gap-2.5 rounded-lg border border-border-strong bg-surface px-3 shadow-[var(--elev-1)] transition hover:border-fg-3/50 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15'

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

      <form className={formClass} noValidate onSubmit={handleAuthSubmit}>
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
            <label className={manualFieldClass}>
              <span className="text-[13px] font-semibold text-fg">Company Name <small className="font-normal text-fg-3">Optional</small></span>
              <span className={`${inputWrapClass} ${fieldErrors.companyName ? 'border-danger/60' : ''}`}>
                <span className="text-fg-3" aria-hidden="true"><AuthIcon name="home" /></span>
                <input
                  className={manualInputClass}
                  aria-invalid={Boolean(fieldErrors.companyName)}
                  autoComplete="organization"
                  placeholder="Enter company name"
                  type="text"
                  value={companyName}
                  onChange={(event) => updateCompanyName(event.target.value)}
                />
              </span>
              {fieldErrors.companyName ? <small className="text-xs font-medium text-danger">{fieldErrors.companyName}</small> : null}
            </label>
            <label className={manualFieldClass}>
              <span className="text-[13px] font-semibold text-fg">Role <small className="font-normal text-fg-3">Optional</small></span>
              <span className={`${inputWrapClass} ${fieldErrors.role ? 'border-danger/60' : ''}`}>
                <span className="text-fg-3" aria-hidden="true"><AuthIcon name="user" /></span>
                <select className={manualInputClass} aria-invalid={Boolean(fieldErrors.role)} value={role} onChange={updateRole}>
                  <option value="">Select your role</option>
                  <option>Product Manager</option>
                  <option>Business Analyst</option>
                  <option>Software Engineer</option>
                  <option>Organization Admin</option>
                </select>
              </span>
              {fieldErrors.role ? <small className="text-xs font-medium text-danger">{fieldErrors.role}</small> : null}
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
          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-fg-2">
              <input defaultChecked type="checkbox" />
              <span>Remember me</span>
            </label>
            <AuthLinkButton onClick={() => setFlowView('forgot')}>Forgot password?</AuthLinkButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-5 text-fg-2">
              <input checked={termsAccepted} type="checkbox" required onChange={updateTermsAccepted} />
              <span>
                I agree to the <a className="font-semibold text-accent hover:underline" href="#terms">Terms of Service</a> and <a className="font-semibold text-accent hover:underline" href="#privacy">Privacy Policy</a>
              </span>
            </label>
            {fieldErrors.terms ? <small className="text-xs font-medium text-danger">{fieldErrors.terms}</small> : null}
          </div>
        )}

        {error ? <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[13px] font-medium text-danger">{error}</p> : null}

        <button className={submitClass} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting' : mode === 'register' ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-fg-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border"><span>or continue with</span></div>
      <div className="grid grid-cols-2 gap-3">
        <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-[13px] font-semibold text-fg shadow-[var(--elev-1)] transition hover:bg-surface-2" type="button"><GoogleLogo /> Google</button>
        <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-[13px] font-semibold text-fg shadow-[var(--elev-1)] transition hover:bg-surface-2" type="button"><MicrosoftLogo /> Microsoft</button>
      </div>



      {mode === 'login' ? (
        <footer className="mt-7 flex items-center justify-center gap-2 text-[13px] text-fg-2">
          <span>Don't have an account?</span>
          <AuthLinkButton onClick={() => switchMode('register')}>Create account</AuthLinkButton>
        </footer>
      ) : (
        <footer className="mt-7 flex items-center justify-center gap-2 text-[13px] text-fg-2">
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
      className="size-4"
      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
      alt=""
      aria-hidden="true"
    />
  )
}

function MicrosoftLogo() {
  return (
    <img
      className="size-4"
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
      <form className={spaciousFormClass} noValidate onSubmit={submitForgotPassword}>
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
        <button className={submitClass} type="submit">
          Send Reset Link
        </button>
      </form>
      <footer className="mt-6 text-center">
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
      <form className={spaciousFormClass} noValidate onSubmit={submitCode}>
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
        <button className={submitClass} type="submit">
          Verify Code
        </button>
      </form>
      <footer className="mt-6 text-center">
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
      <form className={formClass} onSubmit={(event) => event.preventDefault()}>
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
        <ul className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-surface-2 p-3 text-xs text-fg-3">
          {passwordRules.map((rule) => (
            <li className={rule.passed ? 'flex items-center gap-2 font-semibold text-success' : 'flex items-center gap-2'} key={rule.label}>
              <span className={rule.passed ? 'grid size-4 place-items-center rounded-full bg-success/15' : 'grid size-4 place-items-center rounded-full bg-surface-3'} aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
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
        <button className={submitClass} type="button" onClick={onBack}>
          Reset Password
        </button>
      </form>
      <footer className="mt-6 text-center">
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
      <section className="grid grid-cols-1 gap-5"><span className="grid size-12 place-items-center rounded-2xl bg-success/12 text-success ring-1 ring-success/20"><AuthIcon name="check" /></span>
        <AuthPanelHeader title="Verify your email" subtitle={`Enter the 6 digit verification code sent to ${email || 'your email'}.`} />
        <form className={spaciousFormClass} onSubmit={onSubmit}>
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
          {error ? <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[13px] font-medium text-danger">{error}</p> : null}
          <button className={submitClass} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying' : 'Verify Email'}
          </button>
        </form>
        <p className="rounded-lg border border-accent/20 bg-accent/[0.06] px-3 py-2 text-[13px] leading-6 text-fg-2">In console email mode, the backend returns the code automatically so local testing stays quick.</p>
        <div className="flex flex-wrap justify-between gap-3">
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
      <section className="flex items-start justify-between gap-3 rounded-xl border border-accent/40 bg-accent/[0.06] p-4 shadow-[var(--ring-accent)]">
        <div className="flex gap-3"><span className="grid size-10 place-items-center rounded-lg bg-accent/15 text-accent"><AuthIcon name="user" /></span>
          <div>
            <strong className="text-fg">Personal Use</strong>
            <p className="mt-1 text-[13px] leading-5 text-fg-2">For individual projects, documents, diagrams, and personal productivity.</p>
          </div>
        </div>
        <StatusBadge>Recommended</StatusBadge>
      </section>
      <section className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
        <strong className="text-sm text-fg">Your personal workspace will be created automatically</strong>
        <ul className="mt-3 grid grid-cols-1 list-inside list-disc gap-1.5 text-[13px] text-fg-2 marker:text-accent">
          <li>Get your own private workspace</li>
          <li>Invite collaborators anytime</li>
          <li>Upgrade or change later</li>
        </ul>
      </section>
      <button className={`${submitClass} mt-4`} type="button" onClick={onContinue}>
        Continue to Workspace
      </button>
    </AuthFrame>
  )
}

function StatusBadge({ children }: { children: string }) {
  return <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">{children}</span>
}


