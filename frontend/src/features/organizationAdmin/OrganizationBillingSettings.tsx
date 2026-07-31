import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
} from 'lucide-react'
import type { Subscription, Usage } from '../../domains/billing/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import './OrganizationBillingSettings.css'

type OrganizationBillingSettingsProps = {
  activeWorkspace: WorkspaceMembership | undefined
  subscription: Subscription | null
  usage: Usage | null
}

const invoices = [
  { id: 'INV-2025-0518', date: 'May 18, 2025', plan: 'Pro Plan (Monthly)', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-0418', date: 'Apr 18, 2025', plan: 'Pro Plan (Monthly)', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-0318', date: 'Mar 18, 2025', plan: 'Pro Plan (Monthly)', amount: '$29.00', status: 'Paid' },
]

const usageTrend = [26, 38, 34, 48, 42, 58, 54, 68, 62]

export function OrganizationBillingSettings({ activeWorkspace, subscription, usage }: OrganizationBillingSettingsProps) {
  const workspaceName = activeWorkspace?.workspace.name ?? 'Acme Technologies Inc.'
  const planName = subscription?.plan.name ?? 'Pro Plan'
  const price = subscription?.plan.price_cents_monthly ? subscription.plan.price_cents_monthly / 100 : 29
  const creditsUsed = usage?.srs_generations ?? 6200
  const creditLimit = Math.max(subscription?.plan.monthly_srs_generations ?? 10000, 10000)
  const creditPercent = Math.min(100, Math.round((creditsUsed / creditLimit) * 100))

  return (
    <section className="org-billing-settings-page" id="billing">
      <header className="org-billing-header">
        <div>
          <span>Organization Admin</span>
          <h1>Billing &amp; Workspace Settings</h1>
          <p>These settings are available to Organization Admins / Owners only.</p>
        </div>
      </header>

      <div className="org-billing-tabs" role="tablist" aria-label="Billing and workspace sections">
        <button className="active" type="button">Billing &amp; Subscription</button>
        <button type="button">Workspace Settings</button>
      </div>

      <div className="org-billing-layout">
        <main className="org-billing-main">
          <section className="current-plan-card">
            <header>
              <div><CreditCard size={19} /><h2>Current Plan</h2></div>
              <button type="button">Change Plan</button>
            </header>
            <div className="current-plan-body">
              <div>
                <strong>{planName}</strong>
                <p>${price.toFixed(0)} / month</p>
                <span>Billed monthly</span>
              </div>
              <ul>
                <li><CheckCircle2 size={16} />Unlimited projects</li>
                <li><CheckCircle2 size={16} />Advanced AI generation</li>
                <li><CheckCircle2 size={16} />Priority support</li>
              </ul>
            </div>
          </section>

          <section className="usage-overview-admin-card">
            <header>
              <div><BarChart3 size={19} /><h2>Usage Overview</h2></div>
              <button type="button">This Month <ChevronDown size={14} /></button>
            </header>
            <div className="admin-usage-body">
              <div className="admin-usage-ring" style={{ background: `conic-gradient(#6d28d9 ${creditPercent * 3.6}deg, #ede9fe 0deg)` }}>
                <div><strong>{creditPercent}%</strong><span>{formatNumber(creditsUsed)}</span></div>
              </div>
              <div className="admin-usage-copy">
                <strong>{formatNumber(creditsUsed)} / {formatNumber(creditLimit)} credits</strong>
                <p>Credits used this billing cycle.</p>
                <div className="usage-key"><span /><b>Credits used</b></div>
                <div className="usage-key remaining"><span /><b>Credits remaining</b></div>
              </div>
            </div>
          </section>

          <section className="credit-trend-card">
            <header>
              <div><BarChart3 size={19} /><h2>Credit Usage Trend</h2></div>
              <button type="button">6 Months <ChevronDown size={14} /></button>
            </header>
            <div className="trend-bars" aria-label="Credit usage trend">
              {usageTrend.map((height, index) => <span style={{ height: `${height}%` }} key={index} />)}
            </div>
          </section>

          <section className="payment-method-card">
            <header>
              <div><CreditCard size={19} /><h2>Payment Method</h2></div>
              <button type="button">Update</button>
            </header>
            <article className="payment-method-row">
              <span>VISA</span>
              <div>
                <strong>Visa ending in 4242</strong>
                <small>Expires 08/28</small>
              </div>
              <b>Default</b>
            </article>
          </section>

          <section className="invoice-history-card">
            <header>
              <div><FileText size={19} /><h2>Invoice History</h2></div>
              <button type="button">View All Invoices</button>
            </header>
            <div className="invoice-table" role="table" aria-label="Invoice history">
              {invoices.map((invoice) => (
                <article className="invoice-row" role="row" key={invoice.id}>
                  <div><strong>{invoice.id}</strong><small>{invoice.date}</small></div>
                  <span>{invoice.plan}</span>
                  <b>{invoice.amount}</b>
                  <em>{invoice.status}</em>
                  <button type="button" aria-label={`Download ${invoice.id}`}><Download size={16} /></button>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="workspace-settings-column">
          <section className="workspace-settings-card">
            <header><div><Building2 size={19} /><h2>Organization Profile</h2></div></header>
            <form onSubmit={(event) => event.preventDefault()}>
              <label>
                <span>Organization Name</span>
                <input defaultValue={workspaceName} />
              </label>
              <label>
                <span>Organization Logo</span>
                <button type="button" className="logo-upload-button"><Upload size={16} />Change Logo</button>
              </label>
              <label>
                <span>Primary Domain</span>
                <input defaultValue="acme.com" />
              </label>
              <label>
                <span>Default Language</span>
                <select defaultValue="English (US)"><option>English (US)</option><option>English (UK)</option></select>
              </label>
              <label>
                <span>Timezone</span>
                <select defaultValue="Eastern Time"><option>Eastern Time</option><option>UTC</option></select>
              </label>
            </form>
          </section>

          <section className="security-settings-card">
            <header><div><ShieldCheck size={19} /><h2>Security Preferences</h2></div></header>
            <div className="settings-toggle-list">
              <ToggleRow icon={LockKeyhole} title="Two-Factor Authentication (2FA)" enabled />
              <ToggleRow icon={Globe2} title="SSO (Single Sign-On)" />
              <ToggleRow icon={ShieldCheck} title="Password Policy" enabled />
            </div>
          </section>

          <section className="default-workspace-card">
            <header><div><SlidersHorizontal size={19} /><h2>Default Workspace Settings</h2></div></header>
            <form onSubmit={(event) => event.preventDefault()}>
              <label>
                <span>Default Project Visibility</span>
                <select defaultValue="Team Visible"><option>Team Visible</option><option>Private</option></select>
              </label>
              <label>
                <span>Member Join Policy</span>
                <select defaultValue="Invite Only"><option>Invite Only</option><option>Domain Auto-Join</option></select>
              </label>
              <label>
                <span>Project Create Permission</span>
                <select defaultValue="All Members"><option>All Members</option><option>Admins Only</option></select>
              </label>
              <button type="submit">Save Changes</button>
            </form>
          </section>
        </aside>
      </div>
    </section>
  )
}

function ToggleRow({ icon: Icon, title, enabled = false }: { icon: typeof ShieldCheck; title: string; enabled?: boolean }) {
  return (
    <article className="settings-toggle-row">
      <span><Icon size={17} /></span>
      <strong>{title}</strong>
      <button className={enabled ? 'enabled' : ''} type="button" aria-label={title}><i /></button>
    </article>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
