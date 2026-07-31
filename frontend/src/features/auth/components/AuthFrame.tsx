import { BrainCircuit, Check, CircleHelp, Eye, EyeOff, FileText, GitBranch, Home, LockKeyhole, Mail, Network, Plus, ShieldCheck, Sparkles, User, Users, Wand2, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

type AuthArtwork = 'lock' | 'profile' | 'mail' | 'question' | 'key' | 'home'
type AuthIconName = 'user' | 'mail' | 'lock' | 'eye' | 'home' | 'check' | 'plus' | 'help' | 'cube'

type AuthFrameProps = {
  artwork: AuthArtwork
  children: ReactNode
}

export function AuthFrame({ artwork, children }: AuthFrameProps) {
  const isLogin = artwork === 'lock'

  return (
    <main className={`auth-layout ${isLogin ? 'auth-login-layout' : ''}`}>
      {isLogin ? (
        <div className="auth-login-brand">
          <img className="auth-brand-logo" src="/srs-gen-platform-log.png" alt="" aria-hidden="true" />
          <strong>SRS Platform</strong>
        </div>
      ) : null}
      <section className={`auth-card auth-card-${artwork}`} aria-label="Authentication">
        <section className="auth-form-panel">{children}</section>
        <AuthVisualPanel artwork={artwork} />
      </section>
    </main>
  )
}

type AuthVisualPanelProps = {
  artwork: AuthArtwork
}

function AuthVisualPanel({ artwork }: AuthVisualPanelProps) {
  if (artwork === 'lock') {
    return <AuthLoginDiagram />
  }

  return (
    <aside className="auth-visual-panel" aria-label="SRS Platform">
      <div className="auth-brand">
        <img className="auth-brand-logo" src="/srs-gen-platform-log.png" alt="" aria-hidden="true" />
        <strong>SRS Platform</strong>
      </div>

      {artwork === 'profile' ? <span className="auth-visual-kicker"><Sparkles size={16} /> AI-POWERED</span> : null}

      <section className="auth-preview-stage" aria-hidden="true">
        <article className="preview-progress-card">
          <span><Sparkles size={18} /></span>
          <div>
            <strong>AI Generation</strong>
            <small>{artwork === 'profile' ? 'Generating SRS for Inventory Management System' : 'Generating SRS document.'}</small>
            <i><b style={{ width: artwork === 'profile' ? '48%' : '72%' }} /></i>
          </div>
          <em>{artwork === 'profile' ? '48%' : '72%'}</em>
        </article>

        <article className="preview-document-card">
          <header>
            <span><FileText size={18} /></span>
            <strong>SRS Document</strong>
          </header>
          <div className="preview-doc-lines">
            <i />
            <i />
            <i />
            <i />
          </div>
        </article>

        <article className="preview-mini-card requirements-card">
          <span><GitBranch size={17} /></span>
          <div><strong>24</strong><small>Requirements</small></div>
        </article>

        <article className="preview-mini-card diagrams-card">
          <span><Network size={17} /></span>
          <div><strong>88</strong><small>Diagrams</small></div>
        </article>
      </section>

      <div className="auth-visual-copy">
        <h2>{artwork === 'profile' ? 'Write better SRS. Faster with AI.' : 'All your SRS work, smarter with AI'}</h2>
        <p>{artwork === 'profile' ? 'Generate complete Software Requirements Specifications, professional diagrams, and project artifacts in minutes.' : 'Create, collaborate, and manage SRS documents, diagrams, and requirements - all in one intelligent platform.'}</p>
      </div>

      <div className="auth-feature-row" aria-hidden="true">
        {(artwork === 'profile' ? signupFeatures : loginFeatures).map((feature) => (
          <FeatureChip icon={feature.icon} title={feature.title} label={feature.label} key={feature.title} />
        ))}
      </div>
    </aside>
  )
}

function AuthLoginDiagram() {
  return (
    <aside className="auth-visual-panel auth-login-diagram-panel" aria-label="SRS Platform AI workflow preview">
      <div className="login-diagram-canvas" aria-hidden="true">
        <span className="diagram-spark spark-a" />
        <span className="diagram-spark spark-b" />
        <span className="diagram-spark spark-c" />
        <span className="diagram-dot-field" />
        <svg className="diagram-connectors" viewBox="0 0 640 560" role="img" aria-hidden="true">
          <path d="M320 315 V455" />
          <path d="M144 438 H246 Q286 438 286 478 H320" />
          <path d="M496 438 H394 Q354 438 354 478 H320" />
        </svg>

        <article className="diagram-ai-card">
          <div>
            <span><Wand2 size={17} /></span>
            <strong>AI Generation</strong>
          </div>
          <p>Generating SRS document...</p>
          <div className="diagram-progress"><i /></div>
          <em>72%</em>
        </article>

        <article className="diagram-document-card">
          <header>
            <span><FileText size={22} /></span>
            <strong>SRS Document</strong>
          </header>
          <div className="diagram-lines">
            <i /><i /><i /><i /><i />
          </div>
          <b>v1.2</b>
        </article>

        <article className="diagram-requirements-card">
          <strong>Requirements</strong>
          <p><Check size={13} /><span /></p>
          <p><Check size={13} /><span /></p>
          <p><i /><span /></p>
        </article>

        <article className="diagram-flow-card">
          <header><span><Network size={17} /></span><strong>Diagrams</strong></header>
          <div className="mini-flowchart">
            <i /><i /><i /><i /><i />
          </div>
        </article>

        <span className="diagram-core"><X size={38} strokeWidth={3} /></span>
      </div>

      <section className="login-diagram-copy">
        <h2>All your SRS work, smarter with AI</h2>
        <p>Create, collaborate, and manage SRS documents, diagrams, and requirements - all in one intelligent platform.</p>
        <div className="login-feature-grid">
          {loginFeatures.map((feature) => (
            <FeatureChip icon={feature.icon} title={feature.title} label={feature.label} key={feature.title} />
          ))}
        </div>
      </section>
    </aside>
  )
}
const loginFeatures = [
  { icon: BrainCircuit, title: 'AI-Powered', label: 'Generation' },
  { icon: Network, title: 'Smart', label: 'Diagrams' },
  { icon: ShieldCheck, title: 'Version', label: 'Control' },
  { icon: Users, title: 'Team', label: 'Collaboration' },
]

const signupFeatures = [
  { icon: BrainCircuit, title: 'AI-Assisted Writing', label: 'Generate, refine, and enhance SRS content with AI' },
  { icon: Network, title: 'Smart Diagrams', label: 'Auto-generate UML diagrams from your requirements' },
  { icon: Users, title: 'Team Collaboration', label: 'Invite team members and work together seamlessly' },
  { icon: ShieldCheck, title: 'Enterprise Ready', label: 'Secure, scalable, and built for professional teams' },
]
function FeatureChip({ icon: Icon, title, label }: { icon: LucideIcon; title: string; label: string }) {
  return (
    <span className="auth-feature-chip">
      <Icon size={20} />
      <strong>{title}</strong>
      <small>{label}</small>
    </span>
  )
}

type AuthFieldProps = {
  label: string
  icon: AuthIconName
  type?: string
  value: string
  placeholder: string
  autoComplete?: string
  inputMode?: 'email' | 'numeric'
  required?: boolean
  minLength?: number
  error?: string
  onChange: (value: string) => void
}

export function AuthField({
  label,
  icon,
  type = 'text',
  value,
  placeholder,
  autoComplete,
  inputMode,
  required,
  minLength,
  error,
  onChange,
}: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPasswordField = type === 'password'
  const inputType = isPasswordField && isPasswordVisible ? 'text' : type

  return (
    <label className={`auth-field ${error ? 'auth-field-error' : ''}`}>
      <span>{label}</span>
      <span className="auth-input-wrap">
        <span className="auth-input-icon" aria-hidden="true">
          <AuthIcon name={icon} />
        </span>
        <input
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          minLength={minLength}
          placeholder={placeholder}
          required={required}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {isPasswordField ? (
          <button
            className="auth-input-action"
            type="button"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            onClick={(event) => {
              event.preventDefault()
              setIsPasswordVisible((visible) => !visible)
            }}
          >
            {isPasswordVisible ? <EyeOff className="auth-icon" aria-hidden="true" /> : <AuthIcon name="eye" />}
          </button>
        ) : null}
      </span>
      {error ? <small className="auth-field-message">{error}</small> : null}
    </label>
  )
}

type AuthIconProps = {
  name: AuthIconName
}

const authIcons: Record<AuthIconName, LucideIcon> = {
  check: Check,
  cube: X,
  eye: Eye,
  help: CircleHelp,
  home: Home,
  lock: LockKeyhole,
  mail: Mail,
  plus: Plus,
  user: User,
}

export function AuthIcon({ name }: AuthIconProps) {
  const Icon = authIcons[name]
  return <Icon className="auth-icon" aria-hidden="true" />
}

type AuthLinkButtonProps = {
  children: ReactNode
  onClick: () => void
}

export function AuthLinkButton({ children, onClick }: AuthLinkButtonProps) {
  return (
    <button className="auth-link-button" type="button" onClick={onClick}>
      {children}
    </button>
  )
}

type AuthPanelHeaderProps = {
  title: string
  subtitle: string
}

export function AuthPanelHeader({ title, subtitle }: AuthPanelHeaderProps) {
  return (
    <header className="auth-panel-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}






