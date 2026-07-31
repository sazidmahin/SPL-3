import { BrainCircuit, Check, CircleHelp, Cuboid, Eye, FileText, GitBranch, Home, LockKeyhole, Mail, Network, Plus, ShieldCheck, Sparkles, User, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthArtwork = 'lock' | 'profile' | 'mail' | 'question' | 'key' | 'home'
type AuthIconName = 'user' | 'mail' | 'lock' | 'eye' | 'home' | 'check' | 'plus' | 'help' | 'cube'

type AuthFrameProps = {
  artwork: AuthArtwork
  children: ReactNode
}

export function AuthFrame({ artwork, children }: AuthFrameProps) {
  return (
    <main className="auth-layout">
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
  return (
    <aside className="auth-visual-panel" aria-label="SRS Platform">
      <div className="auth-brand">
        <span className="auth-logo-cube" aria-hidden="true">
          <AuthIcon name="cube" />
        </span>
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
  inputMode?: 'email'
  required?: boolean
  minLength?: number
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
  onChange,
}: AuthFieldProps) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        <span className="auth-input-icon" aria-hidden="true">
          <AuthIcon name={icon} />
        </span>
        <input
          autoComplete={autoComplete}
          inputMode={inputMode}
          minLength={minLength}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {type === 'password' ? (
          <span className="auth-input-action" aria-hidden="true">
            <AuthIcon name="eye" />
          </span>
        ) : null}
      </span>
    </label>
  )
}

type AuthIconProps = {
  name: AuthIconName
}

const authIcons: Record<AuthIconName, LucideIcon> = {
  check: Check,
  cube: Cuboid,
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




