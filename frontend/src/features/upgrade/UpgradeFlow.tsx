import {
  BadgeCheck,
  Check,
  CreditCard,
  FileText,
  Folder,
  Home,
  ListChecks,
  LockKeyhole,
  Network,
  Rocket,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

type Plan = {
  name: string
  price: string
  description: string
  features: string[]
  action: string
  recommended?: boolean
}

type JourneyStep = {
  title: string
  description: string
  tone?: 'lock' | 'success'
  icon: IconComponent
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    description: 'For getting started',
    features: ['Up to 3 AI jobs / month', '10,000 credits / month', 'Basic AI features', 'Community support'],
    action: 'Current Plan',
  },
  {
    name: 'Pro',
    price: '$12',
    description: 'For power users',
    features: ['Up to 100 AI jobs / month', '100,000 credits / month', 'All AI features', 'Priority processing', 'Email support'],
    action: 'Upgrade to Pro',
    recommended: true,
  },
  {
    name: 'Team',
    price: '$29',
    description: 'For small teams',
    features: ['Everything in Pro', 'Team collaboration', 'Shared projects & docs', 'Role-based access', 'Admin controls', 'Priority support'],
    action: 'Upgrade to Team',
  },
]

const journeySteps: JourneyStep[] = [
  { title: '1. Sign Up', description: 'User signs up with email.', icon: User },
  { title: '2. Personal Workspace Created', description: 'Default personal workspace is created.', icon: Home },
  { title: '3. Create Project', description: 'User creates their first project.', icon: Folder },
  { title: '4. Add Requirements', description: 'User adds requirements to the project.', icon: ListChecks },
  { title: '5. Try AI Generate', description: 'User clicks AI Generate SRS.', icon: Sparkles },
  { title: '6. Paywall / Upgrade Prompt', description: 'Locked modal explains feature requires Pro.', icon: LockKeyhole, tone: 'lock' },
  { title: '7. Subscribe', description: 'User chooses Pro and completes payment.', icon: CreditCard },
  { title: '8. AI Features Unlocked', description: 'Unlimited AI generation and more credits unlocked.', icon: BadgeCheck, tone: 'success' },
]

const freeLimits = ['Up to 3 AI jobs / month', '10,000 credits / month', 'Basic AI features only', 'No advanced AI', 'No priority processing', 'No team features']
const conversionMoments = ['First AI Generate attempt', 'Usage nearing free limits', 'Upgrade banner on dashboard', 'Feature discovery (locked advanced AI)']

export function UpgradeFlow() {
  return (
    <section className="mx-auto grid max-w-400 gap-5 p-4 sm:p-6" id="subscription">
      <header className="rounded-2xl bg-slate-950 px-6 py-8 text-white sm:px-8">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-200">Individual User</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Unpaid to Paid Flow</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Free plan experience, upgrade prompts, pricing, and conversion journey for individual users.</p>
      </header>

      <div className="grid gap-5">
        <FreePlanPreview />
        <LockedFeatureModalPreview />
        <PricingUpgrade />
        <PaidJourney />
      </div>
    </section>
  )
}

function FreePlanPreview() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <SectionLabel index="1" title="Free Plan Dashboard" subtitle="Lower limits + upgrade banner" />
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-brand-700 to-violet-600 p-4 text-white">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/15"><Zap size={16} /></span>
            <div>
            <strong>You're on the Free Plan</strong>
            <p className="mt-1 text-sm text-white/80">AI SRS generation and advanced AI features require a Pro subscription.</p>
            </div>
          </div>
          <button className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-brand-700 shadow-sm" type="button">Upgrade Now</button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MiniMetric icon={Folder} label="Projects" value="2" note="1 from last month" />
          <MiniMetric icon={FileText} label="SRS Documents" value="3" note="1 from last month" />
          <MiniMetric icon={Network} label="Diagrams" value="1" note="0 from last month" />
          <MiniMetric icon={Sparkles} label="AI Jobs This Month" value="1 / 3" note="Resets in 23 days" />
          <CreditLimitMetric />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-bold text-slate-900">Free Plan</h3>
            <ul className="mt-3 grid gap-1.5 text-sm text-slate-600">
              <li>Up to 3 AI jobs / month</li>
              <li>10,000 credits / month</li>
              <li>Basic AI features only</li>
            </ul>
            <button className="mt-4 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white" type="button">Upgrade Now</button>
          </div>
          <div className="grid content-start gap-2 rounded-xl border border-slate-200 bg-white p-4">
            <strong className="text-slate-900">Usage Overview</strong>
            <span className="text-sm text-slate-500">AI Jobs Used</span>
            <b className="text-2xl text-slate-950">1 / 3</b>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><i className="block h-full rounded-full bg-brand-600" style={{ width: '33%' }} /></div>
            <small className="text-xs text-slate-500">Resets in 23 days</small>
          </div>
        </div>
      </div>
    </article>
  )
}

function LockedFeatureModalPreview() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <SectionLabel index="2" title="Locked Feature Modal" subtitle="AI Generate / Advanced AI" />
      <div className="mt-4 grid min-h-105 place-items-center rounded-xl bg-slate-900 p-4">
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
          <button className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" type="button" aria-label="Close"><X size={18} /></button>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-100 text-brand-700"><LockKeyhole size={30} /></span>
          <h2 className="mt-4 text-xl font-bold leading-7 text-slate-950">AI SRS Generation is for <strong className="text-brand-700">Pro Users</strong></h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">AI SRS generation and advanced AI features require an active paid subscription.</p>
          <ul className="mt-4 grid gap-2 text-left text-sm font-medium text-slate-700">
            <li className="flex items-center gap-2"><Sparkles className="text-brand-600" size={15} />Generate complete SRS with AI</li>
            <li className="flex items-center gap-2"><Zap className="text-brand-600" size={15} />Advanced AI analysis & suggestions</li>
            <li className="flex items-center gap-2"><Rocket className="text-brand-600" size={15} />Higher AI job limits</li>
            <li className="flex items-center gap-2"><BadgeCheck className="text-brand-600" size={15} />Priority processing</li>
          </ul>
          <div className="mt-5 flex justify-center gap-2">
            <button className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white" type="button">Upgrade Now</button>
            <button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700" type="button">View Plans</button>
          </div>
          <small className="mt-4 block text-xs text-slate-500">Already have a subscription? <a className="font-bold text-brand-600" href="#subscription">Sign in</a></small>
        </div>
      </div>
    </article>
  )
}

function PricingUpgrade() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <SectionLabel index="3" title="Pricing / Upgrade Page" subtitle="Free, Pro - Recommended, Team" />
      <div className="mt-4 rounded-xl bg-slate-50 p-4 sm:p-6">
        <header className="text-center">
          <h2 className="text-xl font-bold text-slate-950">Choose the plan that's right for you</h2>
          <p className="mt-1 text-sm text-slate-500">Simple, transparent pricing. Cancel anytime.</p>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">Monthly <i className="h-4 w-7 rounded-full bg-brand-600 before:ml-3 before:block before:size-3 before:translate-y-0.5 before:rounded-full before:bg-white" /> Yearly <b className="text-emerald-600">Save 20%</b></span>
        </header>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => <PlanCard plan={plan} key={plan.name} />)}
        </div>
      </div>
    </article>
  )
}

function PaidJourney() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <SectionLabel index="4" title="Unpaid to Paid User Journey" subtitle="High-Level Flow" />
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {journeySteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div className={step.tone === 'lock' ? 'relative rounded-xl border border-amber-200 bg-amber-50 p-4' : step.tone === 'success' ? 'relative rounded-xl border border-emerald-200 bg-emerald-50 p-4' : 'relative rounded-xl border border-slate-200 bg-slate-50 p-4'} key={step.title}>
              <span className={step.tone === 'lock' ? 'grid size-10 place-items-center rounded-lg bg-amber-100 text-amber-700' : step.tone === 'success' ? 'grid size-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700' : 'grid size-10 place-items-center rounded-lg bg-brand-100 text-brand-700'}><Icon width={22} height={22} /></span>
              <strong className="mt-3 block text-sm text-slate-900">{step.title}</strong>
              <p className="mt-1 text-sm leading-5 text-slate-600">{step.description}</p>
              {index < journeySteps.length - 1 ? <i className="absolute -right-2 top-1/2 z-10 hidden size-4 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-center text-xs text-white not-italic xl:grid">→</i> : null}
            </div>
          )
        })}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoBox title="Key Conversion Moments" items={conversionMoments} tone="purple" />
        <InfoBox title="Free Plan Limits (Summary)" items={freeLimits} tone="green" />
      </div>
    </article>
  )
}

function SectionLabel({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="grid size-7 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{index}</span>
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="basis-full text-sm text-slate-500 sm:basis-auto">{subtitle}</p>
    </header>
  )
}

function MiniMetric({ icon: Icon, label, value, note }: { icon: IconComponent; label: string; value: string; note: string }) {
  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-100 text-brand-700"><Icon width={18} height={18} /></span>
      <div className="grid"><small className="text-xs text-slate-500">{label}</small><strong className="text-lg text-slate-950">{value}</strong></div>
      <p className="text-xs text-slate-500">{note}</p>
    </div>
  )
}

function CreditLimitMetric() {
  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-100 text-brand-700"><CreditCard size={18} /></span>
      <div className="grid"><small className="text-xs text-slate-500">Credit Usage</small><strong className="text-lg text-slate-950">18%</strong></div>
      <p className="text-xs text-slate-500">1,800 / 10,000 credits used</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><i className="block h-full rounded-full bg-brand-600" style={{ width: '18%' }} /></div>
    </div>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <section className={plan.recommended ? 'relative rounded-xl border-2 border-brand-500 bg-white p-5 shadow-lg' : 'relative rounded-xl border border-slate-200 bg-white p-5'}>
      {plan.recommended ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">Recommended for individuals</span> : null}
      <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
      <strong className="mt-3 block text-3xl font-bold text-slate-950">{plan.price}<small className="text-sm font-medium text-slate-500">{plan.name === 'Free' ? ' / month' : plan.name === 'Team' ? ' / user / month' : ' / month'}</small></strong>
      <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
      <ul className="mt-4 grid gap-2 text-sm text-slate-700">{plan.features.map((feature) => <li className="flex gap-2" key={feature}><Check className="mt-0.5 shrink-0 text-emerald-600" size={14} />{feature}</li>)}</ul>
      <button className={plan.recommended ? 'mt-5 w-full rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-bold text-white' : 'mt-5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-700'} type="button">{plan.action}</button>
    </section>
  )
}

function InfoBox({ title, items, tone }: { title: string; items: string[]; tone: 'purple' | 'green' }) {
  return (
    <section className={tone === 'purple' ? 'rounded-xl border border-brand-200 bg-brand-50 p-4' : 'rounded-xl border border-emerald-200 bg-emerald-50 p-4'}>
      <h3 className={tone === 'purple' ? 'font-bold text-brand-900' : 'font-bold text-emerald-900'}>{title}</h3>
      <ul className={tone === 'purple' ? 'mt-3 grid gap-1.5 text-sm text-brand-900' : 'mt-3 grid gap-1.5 text-sm text-emerald-900'}>{items.map((item) => <li className="flex gap-2" key={item}><span>•</span>{item}</li>)}</ul>
    </section>
  )
}
