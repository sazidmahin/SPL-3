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
    <section className="mx-auto grid max-w-400 gap-5 p-4 sm:p-6" id="billing">
      <header>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">Organization Admin</span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Billing &amp; Workspace Settings</h1>
          <p className="mt-1 text-sm text-slate-500">These settings are available to Organization Admins / Owners only.</p>
        </div>
      </header>

      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="Billing and workspace sections">
        <button className="shrink-0 rounded-md bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700" type="button">Billing &amp; Subscription</button>
        <button className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50" type="button">Workspace Settings</button>
      </div>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_21rem]">
        <main className="grid gap-5">
          <section className={cardClass}>
            <header className={cardHeaderClass}>
              <div className="flex items-center gap-2 text-brand-600"><CreditCard size={19} /><h2 className={cardTitleClass}>Current Plan</h2></div>
              <button className={textButtonClass} type="button">Change Plan</button>
            </header>
            <div className="grid gap-5 p-4 sm:grid-cols-2">
              <div>
                <strong className="text-xl text-slate-950">{planName}</strong>
                <p className="mt-1 text-2xl font-bold text-slate-950">${price.toFixed(0)} <span className="text-sm font-medium text-slate-500">/ month</span></p>
                <span className="mt-1 text-sm text-slate-500">Billed monthly</span>
              </div>
              <ul className="grid content-start gap-2 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={16} />Unlimited projects</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={16} />Advanced AI generation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" size={16} />Priority support</li>
              </ul>
            </div>
          </section>

          <section className={cardClass}>
            <header className={cardHeaderClass}>
              <div className="flex items-center gap-2 text-brand-600"><BarChart3 size={19} /><h2 className={cardTitleClass}>Usage Overview</h2></div>
              <button className={`${textButtonClass} flex items-center gap-1`} type="button">This Month <ChevronDown size={14} /></button>
            </header>
            <div className="flex flex-wrap items-center gap-6 p-5">
              <div className="grid size-36 place-items-center rounded-full" style={{ background: `conic-gradient(#6d28d9 ${creditPercent * 3.6}deg, #ede9fe 0deg)` }}>
                <div className="grid size-27 place-content-center rounded-full bg-white text-center"><strong className="text-2xl text-slate-950">{creditPercent}%</strong><span className="text-xs text-slate-500">{formatNumber(creditsUsed)}</span></div>
              </div>
              <div className="grid gap-2">
                <strong className="text-lg text-slate-950">{formatNumber(creditsUsed)} / {formatNumber(creditLimit)} credits</strong>
                <p className="text-sm text-slate-500">Credits used this billing cycle.</p>
                <div className="flex items-center gap-2 text-sm text-slate-700"><span className="size-2 rounded-full bg-brand-600" /><b>Credits used</b></div>
                <div className="flex items-center gap-2 text-sm text-slate-700"><span className="size-2 rounded-full bg-brand-100" /><b>Credits remaining</b></div>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <header className={cardHeaderClass}>
              <div className="flex items-center gap-2 text-brand-600"><BarChart3 size={19} /><h2 className={cardTitleClass}>Credit Usage Trend</h2></div>
              <button className={`${textButtonClass} flex items-center gap-1`} type="button">6 Months <ChevronDown size={14} /></button>
            </header>
            <div className="flex h-42 items-end gap-3 px-5 py-5" aria-label="Credit usage trend">
              {usageTrend.map((height, index) => <span className="flex-1 rounded-t bg-brand-500" style={{ height: `${height}%` }} key={index} />)}
            </div>
          </section>

          <section className={cardClass}>
            <header className={cardHeaderClass}>
              <div className="flex items-center gap-2 text-brand-600"><CreditCard size={19} /><h2 className={cardTitleClass}>Payment Method</h2></div>
              <button className={textButtonClass} type="button">Update</button>
            </header>
            <article className="flex items-center gap-3 p-4">
              <span className="rounded bg-sky-700 px-2 py-1 text-xs font-black italic text-white">VISA</span>
              <div className="flex-1">
                <strong className="block text-sm text-slate-900">Visa ending in 4242</strong>
                <small className="text-xs text-slate-500">Expires 08/28</small>
              </div>
              <b className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Default</b>
            </article>
          </section>

          <section className={cardClass}>
            <header className={cardHeaderClass}>
              <div className="flex items-center gap-2 text-brand-600"><FileText size={19} /><h2 className={cardTitleClass}>Invoice History</h2></div>
              <button className={textButtonClass} type="button">View All Invoices</button>
            </header>
            <div className="overflow-x-auto">
            <div className="min-w-165" role="table" aria-label="Invoice history">
              {invoices.map((invoice) => (
                <article className="grid grid-cols-[1fr_1.3fr_.5fr_.5fr_3rem] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm" role="row" key={invoice.id}>
                  <div><strong className="block text-slate-900">{invoice.id}</strong><small className="text-xs text-slate-500">{invoice.date}</small></div>
                  <span>{invoice.plan}</span>
                  <b className="text-slate-900">{invoice.amount}</b>
                  <em className="w-fit rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold not-italic text-emerald-700">{invoice.status}</em>
                  <button className="grid size-8 place-items-center rounded text-slate-500 hover:bg-slate-100" type="button" aria-label={`Download ${invoice.id}`}><Download size={16} /></button>
                </article>
              ))}
            </div>
            </div>
          </section>
        </main>

        <aside className="grid gap-5">
          <section className={cardClass}>
            <header className={cardHeaderClass}><div className="flex items-center gap-2 text-brand-600"><Building2 size={19} /><h2 className={cardTitleClass}>Organization Profile</h2></div></header>
            <form className="grid gap-4 p-4" onSubmit={(event) => event.preventDefault()}>
              <label className="grid gap-1.5">
                <span className={labelClass}>Organization Name</span>
                <input className={fieldClass} defaultValue={workspaceName} />
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Organization Logo</span>
                <button type="button" className="flex w-fit items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"><Upload size={16} />Change Logo</button>
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Primary Domain</span>
                <input className={fieldClass} defaultValue="acme.com" />
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Default Language</span>
                <select className={fieldClass} defaultValue="English (US)"><option>English (US)</option><option>English (UK)</option></select>
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Timezone</span>
                <select className={fieldClass} defaultValue="Eastern Time"><option>Eastern Time</option><option>UTC</option></select>
              </label>
            </form>
          </section>

          <section className={cardClass}>
            <header className={cardHeaderClass}><div className="flex items-center gap-2 text-brand-600"><ShieldCheck size={19} /><h2 className={cardTitleClass}>Security Preferences</h2></div></header>
            <div className="grid p-4">
              <ToggleRow icon={LockKeyhole} title="Two-Factor Authentication (2FA)" enabled />
              <ToggleRow icon={Globe2} title="SSO (Single Sign-On)" />
              <ToggleRow icon={ShieldCheck} title="Password Policy" enabled />
            </div>
          </section>

          <section className={cardClass}>
            <header className={cardHeaderClass}><div className="flex items-center gap-2 text-brand-600"><SlidersHorizontal size={19} /><h2 className={cardTitleClass}>Default Workspace Settings</h2></div></header>
            <form className="grid gap-4 p-4" onSubmit={(event) => event.preventDefault()}>
              <label className="grid gap-1.5">
                <span className={labelClass}>Default Project Visibility</span>
                <select className={fieldClass} defaultValue="Team Visible"><option>Team Visible</option><option>Private</option></select>
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Member Join Policy</span>
                <select className={fieldClass} defaultValue="Invite Only"><option>Invite Only</option><option>Domain Auto-Join</option></select>
              </label>
              <label className="grid gap-1.5">
                <span className={labelClass}>Project Create Permission</span>
                <select className={fieldClass} defaultValue="All Members"><option>All Members</option><option>Admins Only</option></select>
              </label>
              <button className="rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-bold text-white" type="submit">Save Changes</button>
            </form>
          </section>
        </aside>
      </div>
    </section>
  )
}

function ToggleRow({ icon: Icon, title, enabled = false }: { icon: typeof ShieldCheck; title: string; enabled?: boolean }) {
  return (
    <article className="flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-100 text-brand-700"><Icon size={17} /></span>
      <strong className="flex-1 text-sm text-slate-800">{title}</strong>
      <button className={enabled ? 'relative h-6 w-11 rounded-full bg-brand-600 after:absolute after:right-1 after:top-1 after:size-4 after:rounded-full after:bg-white' : 'relative h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white'} type="button" aria-label={title}><i /></button>
    </article>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

const cardClass = 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
const cardHeaderClass = 'flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-4'
const cardTitleClass = 'text-base font-bold text-slate-950'
const textButtonClass = 'rounded-md px-2 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50'
const labelClass = 'text-sm font-semibold text-slate-700'
const fieldClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-100'
