import { useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, Loader2, Moon, Plus, ShieldCheck, Sun, User } from 'lucide-react'
import { errorMessage, workspaceApi } from '../api'
import { href, navigate, routes } from '../app/core/router'
import { useSession } from '../app/core/session'
import { formatDate, humanize, slugify } from '../shared/format'
import { useTheme } from '../shared/theme'
import { Avatar, Button, Card, Chip, Field, Input, PageHeader, cn, initials, useFeedback } from '../shared/ui'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'workspaces', label: 'Workspaces', icon: Building2 },
] as const

export function SettingsPage({ tab }: { tab?: string }) {
  const active = TABS.some((item) => item.id === tab) ? tab : 'profile'
  return (
    <section className="grid grid-cols-1 gap-5">
      <PageHeader title="Settings" description="Your profile and your workspaces." />
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-20 lg:flex-col" aria-label="Settings sections">
          {TABS.map((item) => {
            const Icon = item.icon
            const selected = item.id === active
            return (
              <a
                key={item.id}
                href={href(routes.settings(item.id === 'profile' ? undefined : item.id))}
                aria-current={selected ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition',
                  selected ? 'bg-accent/10 text-accent' : 'text-fg-2 hover:bg-surface-3 hover:text-fg',
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </a>
            )
          })}
        </nav>
        <div className="min-w-0">
          {active === 'profile' ? <ProfileSection /> : null}
          {active === 'workspaces' ? <WorkspacesSection /> : null}
        </div>
      </div>
    </section>
  )
}

function ProfileSection() {
  const { user, isSuperAdmin } = useSession()
  const { theme, toggleTheme } = useTheme()
  if (!user) return null
  return (
    <div className="grid grid-cols-1 gap-5">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={user.full_name} className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold text-fg">{user.full_name}</h2>
          <p className="truncate text-[13.5px] text-fg-2">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip tone="muted">Member since {formatDate(user.created_at)}</Chip>
            {isSuperAdmin ? (
              <Chip tone="accent">
                <ShieldCheck /> Platform admin
              </Chip>
            ) : null}
          </div>
        </div>
      </Card>
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-bold text-fg">Appearance</h3>
          <p className="mt-0.5 text-[13px] text-fg-2">Switch between the light and dark theme. Your choice is remembered on this device.</p>
        </div>
        <Button variant="secondary" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun /> : <Moon />} {theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
        </Button>
      </Card>
    </div>
  )
}

function WorkspacesSection() {
  const { workspaces, workspace, selectWorkspace, refresh } = useSession()
  const { toast } = useFeedback()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const finalSlug = slug || slugify(name)
    if (!name.trim() || finalSlug.length < 3) {
      setError('Enter a name (the URL slug needs at least 3 characters).')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await workspaceApi.createOrganization({ name: name.trim(), slug: finalSlug })
      await refresh()
      selectWorkspace(created.workspace.id)
      setName('')
      setSlug('')
      setSlugTouched(false)
      toast('Organization created', { description: `Switched to ${created.workspace.name}` })
      navigate(routes.members())
    } catch (caught) {
      setError(errorMessage(caught, 'Unable to create the organization'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-display text-[15px] font-bold text-fg">Your workspaces</h3>
          <p className="text-[13px] text-fg-2">Everything you create belongs to the active workspace.</p>
        </div>
        <ul className="divide-y divide-border">
          {workspaces.map((membership) => {
            const selected = membership.workspace.id === workspace?.workspace.id
            return (
              <li key={membership.workspace.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky to-accent text-[11px] font-extrabold text-white">
                  {initials(membership.workspace.name, 'W')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-fg">{membership.workspace.name}</p>
                  <p className="text-xs text-fg-3">
                    {humanize(membership.workspace.type)} · {humanize(membership.role)}
                  </p>
                </div>
                {selected ? (
                  <Chip tone="accent">Active</Chip>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      selectWorkspace(membership.workspace.id)
                      toast(`Switched to ${membership.workspace.name}`)
                    }}
                  >
                    Switch
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-[15px] font-bold text-fg">New organization workspace</h3>
        <p className="mb-4 text-[13px] text-fg-2">Invite teammates and share projects, documents and diagrams.</p>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end" onSubmit={create} noValidate>
          <Field label="Name" htmlFor="org-name">
            <Input
              id="org-name"
              value={name}
              maxLength={255}
              placeholder="Acme Inc."
              onChange={(event) => {
                setName(event.target.value)
                if (!slugTouched) setSlug(slugify(event.target.value))
              }}
            />
          </Field>
          <Field label="URL slug" htmlFor="org-slug">
            <Input
              id="org-slug"
              value={slug}
              maxLength={60}
              placeholder="acme"
              onChange={(event) => {
                setSlugTouched(true)
                setSlug(slugify(event.target.value))
              }}
            />
          </Field>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Plus />} Create
          </Button>
        </form>
        {error ? <p className="mt-3 text-[13px] font-medium text-danger" role="alert">{error}</p> : null}
      </Card>
    </div>
  )
}
