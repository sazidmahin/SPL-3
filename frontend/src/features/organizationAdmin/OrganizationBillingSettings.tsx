import type { Subscription, Usage } from '../../domains/billing/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Card, Chip, PageHeader, ProgressBar } from '../../shared/ui'

type OrganizationBillingSettingsProps = {
  activeWorkspace: WorkspaceMembership | undefined
  subscription: Subscription | null
  usage: Usage | null
}

export function OrganizationBillingSettings({ activeWorkspace, subscription, usage }: OrganizationBillingSettingsProps) {
  const plan = subscription?.plan
  const price = plan ? plan.price_cents_monthly / 100 : 0
  const renews = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const rows = [
    { label: 'SRS generations', used: usage?.srs_generations ?? 0, limit: plan?.monthly_srs_generations ?? 0 },
    { label: 'AI diagrams', used: usage?.ai_diagram_generations ?? 0, limit: plan?.monthly_ai_diagram_generations ?? 0 },
    { label: 'Manual saves', used: usage?.manual_diagram_saves ?? 0, limit: plan?.monthly_manual_diagram_saves ?? 0 },
  ]

  return (
    <section className="grid gap-6" id="billing">
      <PageHeader
        eyebrow="Organization Admin"
        title="Billing & Usage"
        description={`Plan and usage for ${activeWorkspace?.workspace.name ?? 'this organization'}.`}
      />

      <Card className="grid gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-fg">{plan?.name ?? 'No plan loaded'}</h2>
            <p className="mt-0.5 text-[13px] text-fg-2">{plan?.description ?? 'Refresh billing to load workspace status.'}</p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-extrabold text-fg">
              ${price.toFixed(0)}
              <span className="text-sm font-normal text-fg-3">/mo</span>
            </div>
            {renews ? <div className="text-xs text-fg-3">Renews {renews}</div> : null}
          </div>
        </div>
        <Chip tone={subscription?.status === 'active' ? 'active' : 'muted'} className="w-max capitalize">
          {subscription?.status ?? 'no subscription'}
        </Chip>
      </Card>

      <Card className="grid gap-4 p-6">
        <PageHeader size="section" title="Usage this period" />
        <div className="grid gap-4">
          {rows.map((row) => {
            const percent = row.limit > 0 ? Math.min(100, Math.round((row.used / row.limit) * 100)) : 0
            return (
              <div key={row.label}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-fg-2">{row.label}</span>
                  <span className="font-mono font-semibold text-fg">
                    {row.used} / {row.limit}
                  </span>
                </div>
                <ProgressBar className="mt-1.5" value={percent} />
              </div>
            )
          })}
        </div>
      </Card>
    </section>
  )
}
