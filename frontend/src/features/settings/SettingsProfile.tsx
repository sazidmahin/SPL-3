import {
  Bell,
  Camera,
  Check,
  ChevronDown,
  FileOutput,
  KeyRound,
  Mail,
  Settings,
  Shield,
  SlidersHorizontal,
  User,
} from 'lucide-react'
import type { AuthUser } from '../../domains/auth/types'
import './SettingsProfile.css'

type SettingsProfileProps = {
  user: AuthUser
}

type SettingsSection = {
  id: string
  label: string
  icon: typeof User
}

const settingsSections: SettingsSection[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account Settings', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'export', label: 'Export Preferences', icon: FileOutput },
]

const notificationRows = [
  { label: 'Email Notifications', description: 'Receive email updates about your activity', enabled: true, icon: Mail },
  { label: 'In-App Notifications', description: 'Receive notifications within the platform', enabled: true, icon: Bell },
  { label: 'Project Updates', description: 'Get notified about project changes', enabled: true, icon: FileOutput },
  { label: 'AI Generation Jobs', description: 'Get notified when AI tasks are complete', enabled: false, icon: SlidersHorizontal },
]

const passwordRules = ['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number or symbol']

export function SettingsProfile({ user }: SettingsProfileProps) {
  const fullName = user.full_name || 'John Doe'
  const email = user.email || 'john.doe@example.com'

  return (
    <section className="settings-profile-screen" id="settings">
      <header className="settings-page-title">
        <h1>Settings</h1>
        <p>Manage your account preferences and security settings.</p>
      </header>

      <div className="settings-layout-grid">
        <SettingsNav active="profile" />
        <div className="settings-content-stack">
          <ProfileSummaryCard fullName={fullName} email={email} />
          <AccountSettingsCard email={email} />
          <NotificationsCard />
          <PreferencesCard />
          <ExportPreferencesCard />
        </div>
      </div>

      <div className="settings-detail-grid" id="profile">
        <SettingsNav active="profile" compact />
        <ProfileEditCard fullName={fullName} />
      </div>

      <div className="settings-detail-grid" id="security">
        <SettingsNav active="security" compact />
        <div className="settings-content-stack">
          <SecurityCard />
          <TwoFactorCard />
        </div>
      </div>
    </section>
  )
}

function SettingsNav({ active, compact = false }: { active: string; compact?: boolean }) {
  return (
    <nav className={compact ? 'settings-subnav compact' : 'settings-subnav'} aria-label="Settings sections">
      {settingsSections.map((section) => {
        const Icon = section.icon
        return (
          <a className={section.id === active ? 'active' : ''} href={`#${section.id}`} key={section.id}>
            <Icon size={17} />
            {section.label}
          </a>
        )
      })}
    </nav>
  )
}

function ProfileSummaryCard({ fullName, email }: { fullName: string; email: string }) {
  return (
    <SettingsCard title="Profile Information" description="Update your personal information and profile picture." action="Edit Profile">
      <div className="profile-summary-grid">
        <AvatarBlock name={fullName} />
        <InfoGrid
          items={[
            ['Full Name', fullName],
            ['Email', email],
            ['Job Title', 'Product Manager'],
            ['Location', 'San Francisco, CA'],
            ['Member Since', 'May 12, 2024'],
            ['Timezone', '(GMT-07:00) Pacific Time (US & Canada)'],
          ]}
        />
      </div>
    </SettingsCard>
  )
}

function AccountSettingsCard({ email }: { email: string }) {
  return (
    <SettingsCard title="Account Settings" description="Manage your account credentials and preferences." action="Edit">
      <div className="settings-row-list">
        <InfoRow label="Email Address" value={email} badge="Verified" />
        <InfoRow label="Password" value="••••••••••••" action="Change Password" />
        <InfoRow label="Language" value="English (US)" trailing={<ChevronDown size={16} />} />
      </div>
    </SettingsCard>
  )
}

function NotificationsCard() {
  return (
    <SettingsCard title="Notifications" description="Manage how you receive notifications." action="Edit">
      <div className="notification-list">
        {notificationRows.map((row) => {
          const Icon = row.icon
          return (
            <div className="notification-row" key={row.label}>
              <Icon size={18} />
              <strong>{row.label}</strong>
              <span>{row.description}</span>
              <Toggle enabled={row.enabled} />
            </div>
          )
        })}
      </div>
    </SettingsCard>
  )
}

function PreferencesCard() {
  return (
    <SettingsCard title="Preferences" description="Manage your experience." action="Edit">
      <div className="settings-row-list compact-list-settings">
        <InfoRow label="Theme" value="Light" trailing={<ChevronDown size={16} />} />
        <InfoRow label="Date Format" value="May 31, 2025 (MMM DD, YYYY)" trailing={<ChevronDown size={16} />} />
        <InfoRow label="Time Format" value="12 Hour (1:30 PM)" trailing={<ChevronDown size={16} />} />
        <InfoRow label="Default Dashboard" value="Projects Overview" trailing={<ChevronDown size={16} />} />
      </div>
    </SettingsCard>
  )
}

function ExportPreferencesCard() {
  return (
    <SettingsCard title="Export Preferences" description="Configure your default export settings." action="Edit">
      <div className="settings-row-list compact-list-settings">
        <InfoRow label="Default Format" value="PDF" />
        <InfoRow label="Include Diagrams" value="Yes" />
        <InfoRow label="Include Comments" value="Yes" />
        <InfoRow label="Page Size" value="A4" />
      </div>
    </SettingsCard>
  )
}

function ProfileEditCard({ fullName }: { fullName: string }) {
  return (
    <SettingsCard title="Profile Information" description="Change your personal information and how others see you.">
      <form className="profile-edit-form">
        <div className="profile-photo-row">
          <span>Profile Photo</span>
          <AvatarBlock name={fullName} small />
          <div>
            <button type="button">Change Photo</button>
            <small>JPG, PNG or GIF. Max size 2MB.</small>
          </div>
        </div>
        <LabeledInput label="Full Name" defaultValue={fullName} />
        <LabeledInput label="Job Title" defaultValue="Product Manager" />
        <LabeledInput label="Location" defaultValue="San Francisco, CA" />
        <LabeledInput label="Timezone" defaultValue="(GMT-07:00) Pacific Time (US & Canada)" withChevron />
        <LabeledInput label="Bio" defaultValue="Product manager with a passion for building intuitive SaaS platforms and driving user-centric solutions." textarea />
        <footer>
          <button type="button">Cancel</button>
          <button type="button">Save Changes</button>
        </footer>
      </form>
    </SettingsCard>
  )
}

function SecurityCard() {
  return (
    <SettingsCard title="Change Password" description="Update your password to keep your account secure.">
      <form className="security-form">
        <LabeledInput label="Current Password" placeholder="Enter current password" password />
        <LabeledInput label="New Password" placeholder="Enter new password" password />
        <div className="password-rule-list">
          <span>Password must contain:</span>
          <ul>{passwordRules.map((rule) => <li key={rule}><Check size={13} />{rule}</li>)}</ul>
        </div>
        <LabeledInput label="Confirm New Password" placeholder="Confirm new password" password />
        <footer><button type="button">Update Password</button></footer>
      </form>
    </SettingsCard>
  )
}

function TwoFactorCard() {
  return (
    <SettingsCard title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
      <div className="two-factor-row">
        <div>
          <strong>Enable Two-Factor Authentication</strong>
          <p>Use an authenticator app to verify your identity</p>
        </div>
        <Toggle enabled={false} />
      </div>
    </SettingsCard>
  )
}

function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: string
  children: React.ReactNode
}) {
  return (
    <article className="settings-card">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action ? <button type="button">{action}</button> : null}
      </header>
      {children}
    </article>
  )
}

function AvatarBlock({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <div className={small ? 'profile-avatar small' : 'profile-avatar'}>
      <span>{initials(name)}</span>
      {!small ? <button type="button" aria-label="Change photo"><Camera size={18} /></button> : null}
    </div>
  )
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="profile-info-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function InfoRow({
  label,
  value,
  badge,
  action,
  trailing,
}: {
  label: string
  value: string
  badge?: string
  action?: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="settings-info-row">
      <strong>{label}</strong>
      <span>{value}</span>
      {badge ? <b>{badge}</b> : null}
      {action ? <button type="button">{action}</button> : null}
      {trailing ? <i>{trailing}</i> : null}
    </div>
  )
}

function LabeledInput({
  label,
  defaultValue,
  placeholder,
  textarea = false,
  password = false,
  withChevron = false,
}: {
  label: string
  defaultValue?: string
  placeholder?: string
  textarea?: boolean
  password?: boolean
  withChevron?: boolean
}) {
  return (
    <label className="settings-input-row">
      <span>{label}</span>
      <div>
        {textarea ? (
          <textarea defaultValue={defaultValue} maxLength={200} rows={4} />
        ) : (
          <input defaultValue={defaultValue} placeholder={placeholder} type={password ? 'password' : 'text'} />
        )}
        {password ? <KeyRound size={16} /> : null}
        {withChevron ? <ChevronDown size={16} /> : null}
      </div>
    </label>
  )
}

function Toggle({ enabled }: { enabled: boolean }) {
  return <span className={enabled ? 'settings-toggle enabled' : 'settings-toggle'}><i /></span>
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}
