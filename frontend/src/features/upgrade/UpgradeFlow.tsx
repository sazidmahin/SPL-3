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
import './UpgradeFlow.css'

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
    <section className="upgrade-flow" id="subscription">
      <header className="upgrade-flow-title">
        <span>Individual User</span>
        <h1>Unpaid to Paid Flow</h1>
        <p>Free plan experience, upgrade prompts, pricing, and conversion journey for individual users.</p>
      </header>

      <div className="upgrade-flow-grid">
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
    <article className="upgrade-card free-plan-preview">
      <SectionLabel index="1" title="Free Plan Dashboard" subtitle="Lower limits + upgrade banner" />
      <div className="mini-dashboard-frame">
        <div className="free-plan-banner">
          <div>
            <span><Zap size={16} /></span>
            <strong>You're on the Free Plan</strong>
            <p>AI SRS generation and advanced AI features require a Pro subscription.</p>
          </div>
          <button type="button">Upgrade Now</button>
        </div>
        <div className="free-metric-grid">
          <MiniMetric icon={Folder} label="Projects" value="2" note="1 from last month" />
          <MiniMetric icon={FileText} label="SRS Documents" value="3" note="1 from last month" />
          <MiniMetric icon={Network} label="Diagrams" value="1" note="0 from last month" />
          <MiniMetric icon={Sparkles} label="AI Jobs This Month" value="1 / 3" note="Resets in 23 days" />
          <CreditLimitMetric />
        </div>
        <div className="free-dashboard-bottom">
          <div className="free-subscription-panel">
            <h3>Free Plan</h3>
            <ul>
              <li>Up to 3 AI jobs / month</li>
              <li>10,000 credits / month</li>
              <li>Basic AI features only</li>
            </ul>
            <button type="button">Upgrade Now</button>
          </div>
          <div className="ai-usage-panel">
            <strong>Usage Overview</strong>
            <span>AI Jobs Used</span>
            <b>1 / 3</b>
            <div className="mini-progress"><i style={{ width: '33%' }} /></div>
            <small>Resets in 23 days</small>
          </div>
        </div>
      </div>
    </article>
  )
}

function LockedFeatureModalPreview() {
  return (
    <article className="upgrade-card locked-modal-preview">
      <SectionLabel index="2" title="Locked Feature Modal" subtitle="AI Generate / Advanced AI" />
      <div className="locked-modal-stage">
        <div className="locked-modal-card">
          <button className="locked-close" type="button" aria-label="Close"><X size={18} /></button>
          <span className="locked-orb"><LockKeyhole size={34} /></span>
          <h2>AI SRS Generation is for <strong>Pro Users</strong></h2>
          <p>AI SRS generation and advanced AI features require an active paid subscription.</p>
          <ul>
            <li><Sparkles size={15} />Generate complete SRS with AI</li>
            <li><Zap size={15} />Advanced AI analysis & suggestions</li>
            <li><Rocket size={15} />Higher AI job limits</li>
            <li><BadgeCheck size={15} />Priority processing</li>
          </ul>
          <div>
            <button type="button">Upgrade Now</button>
            <button type="button">View Plans</button>
          </div>
          <small>Already have a subscription? <a href="#subscription">Sign in</a></small>
        </div>
      </div>
    </article>
  )
}

function PricingUpgrade() {
  return (
    <article className="upgrade-card pricing-upgrade-card">
      <SectionLabel index="3" title="Pricing / Upgrade Page" subtitle="Free, Pro - Recommended, Team" />
      <div className="pricing-inner">
        <header>
          <h2>Choose the plan that's right for you</h2>
          <p>Simple, transparent pricing. Cancel anytime.</p>
          <span>Monthly <i /> Yearly <b>Save 20%</b></span>
        </header>
        <div className="pricing-plan-grid">
          {plans.map((plan) => <PlanCard plan={plan} key={plan.name} />)}
        </div>
      </div>
    </article>
  )
}

function PaidJourney() {
  return (
    <article className="upgrade-card paid-journey-card">
      <SectionLabel index="4" title="Unpaid to Paid User Journey" subtitle="High-Level Flow" />
      <div className="journey-strip">
        {journeySteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div className={step.tone ? `journey-step tone-${step.tone}` : 'journey-step'} key={step.title}>
              <span><Icon width={32} height={32} /></span>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              {index < journeySteps.length - 1 ? <i>?</i> : null}
            </div>
          )
        })}
      </div>
      <div className="journey-notes-grid">
        <InfoBox title="Key Conversion Moments" items={conversionMoments} tone="purple" />
        <InfoBox title="Free Plan Limits (Summary)" items={freeLimits} tone="green" />
      </div>
    </article>
  )
}

function SectionLabel({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
  return (
    <header className="upgrade-section-label">
      <span>{index}</span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  )
}

function MiniMetric({ icon: Icon, label, value, note }: { icon: IconComponent; label: string; value: string; note: string }) {
  return (
    <div className="free-mini-metric">
      <span><Icon width={22} height={22} /></span>
      <div><small>{label}</small><strong>{value}</strong></div>
      <p>{note}</p>
    </div>
  )
}

function CreditLimitMetric() {
  return (
    <div className="free-mini-metric credit-limit-mini">
      <span><CreditCard size={22} /></span>
      <div><small>Credit Usage</small><strong>18%</strong></div>
      <p>1,800 / 10,000 credits used</p>
      <div className="mini-progress"><i style={{ width: '18%' }} /></div>
    </div>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <section className={plan.recommended ? 'plan-card recommended' : 'plan-card'}>
      {plan.recommended ? <span className="recommended-ribbon">Recommended for individuals</span> : null}
      <h3>{plan.name}</h3>
      <strong>{plan.price}<small>{plan.name === 'Free' ? ' / month' : plan.name === 'Team' ? ' / user / month' : ' / month'}</small></strong>
      <p>{plan.description}</p>
      <ul>{plan.features.map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul>
      <button type="button">{plan.action}</button>
    </section>
  )
}

function InfoBox({ title, items, tone }: { title: string; items: string[]; tone: 'purple' | 'green' }) {
  return (
    <section className={`journey-info-box tone-${tone}`}>
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  )
}
