import './BillingPanel.css'
import type { Plan, Subscription, Usage } from '../../domains/billing/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'

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

  return (
    <article className="panel billing-panel">
      <div className="panel-heading">
        <span className="panel-label">Billing</span>
        <button
          className="text-button"
          type="button"
          onClick={onReload}
          disabled={!activeWorkspace || isLoadingBilling}
        >
          {isLoadingBilling ? 'Loading' : 'Reload'}
        </button>
      </div>

      <div className="billing-layout">
        <div className="billing-status">
          <span className="panel-label">Current plan</span>
          <h2>{subscription?.plan.name ?? 'No plan loaded'}</h2>
          <p>{subscription?.plan.description ?? 'Refresh billing to load workspace status.'}</p>
          {usage ? (
            <div className="usage-grid">
              <span>SRS {usage.srs_generations}/{subscription?.plan.monthly_srs_generations ?? 0}</span>
              <span>
                AI diagrams {usage.ai_diagram_generations}/
                {subscription?.plan.monthly_ai_diagram_generations ?? 0}
              </span>
              <span>
                Manual saves {usage.manual_diagram_saves}/
                {subscription?.plan.monthly_manual_diagram_saves ?? 0}
              </span>
            </div>
          ) : null}
        </div>

        <div className="plan-grid" aria-label="Plans">
          {availablePlans.map((plan) => (
            <article className="plan-option" key={plan.id}>
              <div>
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
              </div>
              <strong>${(plan.price_cents_monthly / 100).toFixed(0)}/mo</strong>
              <small>
                {plan.max_projects} projects / {plan.max_members} members /{' '}
                {plan.monthly_manual_diagram_saves} saves
              </small>
              <button
                className="secondary-button"
                type="button"
                onClick={() => onCheckoutPlan(plan.code)}
                disabled={!activeWorkspace || isCheckingOut || subscription?.plan.code === plan.code}
              >
                {subscription?.plan.code === plan.code ? 'Current' : 'Select'}
              </button>
            </article>
          ))}
        </div>
      </div>
    </article>
  )
}