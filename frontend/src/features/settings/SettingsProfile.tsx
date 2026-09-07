import { useState } from 'react'
import { KeyRound, User } from 'lucide-react'
import type { AuthUser } from '../../domains/auth/types'
import type { AiProviderId, AiProviderSetting } from '../../domains/aiSettings/types'
import { Button, Card, Chip, Field, PageHeader, Select, Input, cn } from '../../shared/ui'

type SettingsProfileProps = {
  user: AuthUser
  aiProviders?: AiProviderSetting[]
  aiSettingsLoading?: boolean
  onSaveAiCredential?: (
    provider: AiProviderId,
    payload: { api_key: string; selected_model: string; is_default: boolean },
  ) => Promise<void>
  onTestAiCredential?: (provider: AiProviderId) => Promise<void>
  onPatchAiCredential?: (provider: AiProviderId, payload: { selected_model?: string; is_default?: boolean }) => Promise<void>
  onDeleteAiCredential?: (provider: AiProviderId) => Promise<void>
  onLoadProviderModels?: (provider: AiProviderId) => Promise<string[]>
}

const navSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'ai-providers', label: 'AI Providers', icon: KeyRound },
]

export function SettingsProfile({
  user,
  aiProviders = [],
  aiSettingsLoading = false,
  onSaveAiCredential,
  onTestAiCredential,
  onPatchAiCredential,
  onDeleteAiCredential,
  onLoadProviderModels,
}: SettingsProfileProps) {
  return (
    <section className="grid gap-5" id="settings">
      <PageHeader title="Settings" description="Manage your profile and AI provider credentials." />
      <div className="grid items-start gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <SettingsNav active="profile" />
        <div className="grid gap-5">
          <Card className="grid gap-5 p-6" id="profile">
            <PageHeader size="section" title="Profile" description="How you appear across the platform." />
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent2 to-accent text-xl font-bold text-white">
                {initials(user.full_name)}
              </span>
              <div>
                <div className="font-display text-base font-bold text-fg">{user.full_name}</div>
                <div className="text-[13px] text-fg-2">{user.email}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-fg-3">
                  Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          </Card>
          <AiProvidersCard
            providers={aiProviders}
            loading={aiSettingsLoading}
            onSave={onSaveAiCredential}
            onTest={onTestAiCredential}
            onPatch={onPatchAiCredential}
            onDelete={onDeleteAiCredential}
            onLoadModels={onLoadProviderModels}
          />
        </div>
      </div>
    </section>
  )
}

export function AiSettingsPanel({
  aiProviders = [],
  aiSettingsLoading = false,
  onSaveAiCredential,
  onTestAiCredential,
  onPatchAiCredential,
  onDeleteAiCredential,
  onLoadProviderModels,
}: Omit<SettingsProfileProps, 'user'>) {
  return (
    <section className="grid gap-5" id="ai-settings">
      <PageHeader
        title="AI Settings"
        description="Add provider API keys, choose a model, test the connection, and select the provider used by AI-Gen."
      />
      <AiProvidersCard
        providers={aiProviders}
        loading={aiSettingsLoading}
        onSave={onSaveAiCredential}
        onTest={onTestAiCredential}
        onPatch={onPatchAiCredential}
        onDelete={onDeleteAiCredential}
        onLoadModels={onLoadProviderModels}
      />
    </section>
  )
}

function AiProvidersCard({
  providers,
  loading,
  onSave,
  onTest,
  onPatch,
  onDelete,
  onLoadModels,
}: {
  providers: AiProviderSetting[]
  loading: boolean
  onSave?: SettingsProfileProps['onSaveAiCredential']
  onTest?: SettingsProfileProps['onTestAiCredential']
  onPatch?: SettingsProfileProps['onPatchAiCredential']
  onDelete?: SettingsProfileProps['onDeleteAiCredential']
  onLoadModels?: SettingsProfileProps['onLoadProviderModels']
}) {
  return (
    <Card className="grid gap-4 p-6" id="ai-providers">
      <PageHeader
        size="section"
        title="AI Providers"
        description="Keys are encrypted at rest and used only for your generation requests."
      />
      {loading ? <p className="text-[13px] text-fg-3">Loading providers…</p> : null}
      {!loading && providers.length === 0 ? (
        <p className="text-[13px] text-fg-3">Provider settings are unavailable right now.</p>
      ) : null}
      {providers.map((provider) => (
        <ProviderCard
          key={provider.provider}
          provider={provider}
          onSave={onSave}
          onTest={onTest}
          onPatch={onPatch}
          onDelete={onDelete}
          onLoadModels={onLoadModels}
        />
      ))}
    </Card>
  )
}

function ProviderCard({
  provider,
  onSave,
  onTest,
  onPatch,
  onDelete,
  onLoadModels,
}: {
  provider: AiProviderSetting
  onSave?: SettingsProfileProps['onSaveAiCredential']
  onTest?: SettingsProfileProps['onTestAiCredential']
  onPatch?: SettingsProfileProps['onPatchAiCredential']
  onDelete?: SettingsProfileProps['onDeleteAiCredential']
  onLoadModels?: SettingsProfileProps['onLoadProviderModels']
}) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(provider.credential?.selected_model ?? provider.default_model)
  const [availableModels, setAvailableModels] = useState(provider.models)
  const [busy, setBusy] = useState(false)
  const credential = provider.credential
  const modelOptions = Array.from(new Set([model, ...availableModels]))

  async function execute(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }

  const status = credential?.status ?? 'unconfigured'

  return (
    <div className="grid gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-semibold text-fg">{provider.label}</h3>
          <p className="mt-0.5 text-[12.5px] text-fg-2">
            {credential?.configured
              ? `Configured •••• ${credential.key_last_four}${credential.is_default ? ' · Active for AI-Gen' : ''}`
              : 'No API key configured'}
          </p>
        </div>
        <Chip tone={status === 'valid' ? 'active' : status === 'invalid' ? 'danger' : 'muted'} className="w-max capitalize">
          {status}
        </Chip>
      </div>

      <Field label="Model" hint="After saving the key, use Load models to refresh this list from the provider.">
        <Select value={model} onChange={(event) => setModel(event.target.value)}>
          {modelOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="API key">
        <Input
          type="password"
          autoComplete="off"
          value={apiKey}
          placeholder={credential ? 'Enter a new key to replace the saved key' : 'Paste your API key'}
          onChange={(event) => setApiKey(event.target.value)}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy || !apiKey.trim()}
          onClick={() =>
            void execute(async () => {
              await onSave?.(provider.provider, {
                api_key: apiKey.trim(),
                selected_model: model,
                is_default: credential?.is_default ?? false,
              })
              setApiKey('')
            })
          }
        >
          Save key
        </Button>
        {credential ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void execute(async () => setAvailableModels((await onLoadModels?.(provider.provider)) ?? availableModels))
              }
            >
              Load models
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void execute(() => onPatch?.(provider.provider, { selected_model: model }) ?? Promise.resolve())}
            >
              Save model
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void execute(() => onTest?.(provider.provider) ?? Promise.resolve())}
            >
              Test connection
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || credential.is_default}
              onClick={() => void execute(() => onPatch?.(provider.provider, { is_default: true }) ?? Promise.resolve())}
            >
              Use for AI-Gen
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Remove the ${provider.label} credential?`)) {
                  void execute(() => onDelete?.(provider.provider) ?? Promise.resolve())
                }
              }}
            >
              Remove
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}

function SettingsNav({ active }: { active: string }) {
  return (
    <nav className="grid gap-1 lg:sticky lg:top-20" aria-label="Settings sections">
      {navSections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition',
            section.id === active ? 'bg-accent/15 font-semibold text-accent' : 'text-fg-3 hover:bg-surface-3 hover:text-fg',
          )}
        >
          <section.icon className="size-4" />
          {section.label}
        </a>
      ))}
    </nav>
  )
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  )
}
