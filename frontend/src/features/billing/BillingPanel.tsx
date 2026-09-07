import type { Plan, Subscription, Usage } from '../../domains/billing/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Button, Card, Chip, PageHeader, cn } from '../../shared/ui'

type BillingPanelProps = {
  activeWorkspace: WorkspaceMembership | undefined
  plans: Plan[]
  subscription: Subscription | null
  usage: Usage | null
  isLoadingBilling: boolean
  isCheckingOut: boolean
  onReload: () => void
  onCheckoutPlan: (planCode: string) => void
}

export function BillingPanel({
  activeWorkspace,
  plans,
  subscription,
  usage,
  isLoadingBilling,
  isCheckingOut,
  onReload,
  onCheckoutPlan,
}: BillingPanelProps) {
  const availablePlans = activeWorkspace
    ? plans.filter(
        (plan) => plan.workspace_type === activeWorkspace.workspace.type || plan.workspace_type === 'any',
      )
    : plans

  const usageRows = usage
    ? [
        { label: 'SRS generations', used: usage.srs_generations, limit: subscription?.plan.monthly_srs_generations ?? 0 },
        {
          label: 'AI diagrams',
          used: usage.ai_diagram_generations,
          limit: subscription?.plan.monthly_ai_diagram_generations ?? 0,
        },
        {
          label: 'Manual saves',
          used: usage.manual_diagram_saves,
          limit: subscription?.plan.monthly_manual_diagram_saves ?? 0,
        },
      ]
    : []

  return (
    <Card className="grid gap-4 p-4">
      <PageHeader
        size="section"
        eyebrow="Billing"
        title="Plan & usage"
        actions={
          <Button variant="ghost" size="sm" onClick={onReload} disabled={!activeWorkspace || isLoadingBilling}>
            {isLoadingBilling ? 'Loading…' : 'Reload'}
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[16.25rem_minmax(0,1fr)]">
        <div className="grid content-start gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-accent">Current plan</span>
          <h3 className="font-display text-lg font-bold text-fg">{subscription?.plan.name ?? 'No plan loaded'}</h3>
          <p className="text-[13px] text-fg-3">
            {subscription?.plan.description ?? 'Refresh billing to load workspace status.'}
          </p>
          {usageRows.length > 0 ? (
            <div className="mt-2 grid gap-2">
              {usageRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-xs"
                >
                  <span className="text-fg-2">{row.label}</span>
                  <span className="font-mono font-semibold text-fg">
                    {row.used} / {row.limit}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {availablePlans.map((plan) => {
            const current = subscription?.plan.code === plan.code
            return (
              <div
                key={plan.id}
                className={cn('grid content-start gap-3 rounded-lg border p-4', current ? 'border-accent' : 'border-border')}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-fg">{plan.name}</h3>
                  {current ? <Chip tone="active">Current</Chip> : null}
                </div>
                <p className="text-[13px] text-fg-3">{plan.description}</p>
                <strong className="font-display text-xl text-fg">
                  ${(plan.price_cents_monthly / 100).toFixed(0)}
                  <span className="text-sm font-normal text-fg-3">/mo</span>
                </strong>
                <small className="text-xs text-fg-3">
                  {plan.max_projects} projects · {plan.max_members} members · {plan.monthly_srs_generations} SRS/mo
                </small>
                <Button
                  variant={current ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => onCheckoutPlan(plan.code)}
                  disabled={!activeWorkspace || isCheckingOut || current}
                >
                  {current ? 'Current plan' : 'Select plan'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
