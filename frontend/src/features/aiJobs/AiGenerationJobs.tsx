import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  FolderKanban,
  LayoutGrid,
  Menu,
  MoreVertical,
  RefreshCcw,
  RotateCw,
  Search,
  User,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

type MetricTone = 'purple' | 'green' | 'blue' | 'red' | 'orange'
type JobStatus = 'In Progress' | 'Completed' | 'Failed' | 'Canceled'
type JobKind = 'SRS Document' | 'Diagram'

type JobMetric = {
  label: string
  value: string
  trend: string
  direction: 'up' | 'down'
  tone: MetricTone
  icon: LucideIcon
}

type GenerationJobRow = {
  id: string
  name: string
  project: string
  type: JobKind
  createdBy: string
  createdTime: string
  progress: number
  status: JobStatus
}

type Preset = {
  title: string
  description: string
  type: JobKind
  isDefault?: boolean
}

const metrics: JobMetric[] = [
  { label: 'Total Jobs', value: '56', trend: '32% from last month', direction: 'up', tone: 'purple', icon: FolderKanban },
  { label: 'Completed', value: '34', trend: '34% from last month', direction: 'up', tone: 'green', icon: CheckCircle2 },
  { label: 'In Progress', value: '12', trend: '8% from last month', direction: 'down', tone: 'blue', icon: RotateCw },
  { label: 'Failed', value: '3', trend: '25% from last month', direction: 'down', tone: 'red', icon: XCircle },
  { label: 'Avg. Generation Time', value: '2m 48s', trend: '12% from last month', direction: 'down', tone: 'orange', icon: Clock3 },
]

const jobs: GenerationJobRow[] = [
  { id: 'job-1', name: 'E-Commerce System SRS', project: 'E-Commerce System', type: 'SRS Document', createdBy: 'Mahin Rahman', createdTime: 'Jun 29, 2025 10:24 AM', progress: 75, status: 'In Progress' },
  { id: 'job-2', name: 'User Flow Diagram', project: 'Mobile Banking App', type: 'Diagram', createdBy: 'Sarah Ahmed', createdTime: 'Jun 29, 2025 10:15 AM', progress: 60, status: 'In Progress' },
  { id: 'job-3', name: 'Inventory Management SRS', project: 'Inventory System', type: 'SRS Document', createdBy: 'Mahin Rahman', createdTime: 'Jun 29, 2025 09:58 AM', progress: 100, status: 'Completed' },
  { id: 'job-4', name: 'System Architecture Diagram', project: 'HR Management System', type: 'Diagram', createdBy: 'Mahin Rahman', createdTime: 'Jun 29, 2025 09:41 AM', progress: 100, status: 'Completed' },
  { id: 'job-5', name: 'API Specification SRS', project: 'Payment Gateway', type: 'SRS Document', createdBy: 'Sarah Ahmed', createdTime: 'Jun 29, 2025 09:30 AM', progress: 100, status: 'Completed' },
  { id: 'job-6', name: 'Database ERD', project: 'Hospital Management', type: 'Diagram', createdBy: 'John Doe', createdTime: 'Jun 29, 2025 09:12 AM', progress: 35, status: 'In Progress' },
  { id: 'job-7', name: 'Learning Module SRS', project: 'Learning Management', type: 'SRS Document', createdBy: 'Mahin Rahman', createdTime: 'Jun 29, 2025 08:50 AM', progress: 0, status: 'Failed' },
  { id: 'job-8', name: 'Deployment Diagram', project: 'E-Commerce System', type: 'Diagram', createdBy: 'Sarah Ahmed', createdTime: 'Jun 29, 2025 08:35 AM', progress: 0, status: 'Canceled' },
]

const presets: Preset[] = [
  { title: 'SRS - Standard', description: 'Complete SRS document with all sections', type: 'SRS Document', isDefault: true },
  { title: 'SRS - Technical', description: 'Technical focused SRS with API specs', type: 'SRS Document' },
  { title: 'Diagram - Architecture', description: 'System architecture and component diagrams', type: 'Diagram' },
  { title: 'Diagram - Database', description: 'ERD and database schema diagrams', type: 'Diagram' },
]

const completedOutputs = jobs.filter((job) => job.status === 'Completed').slice(0, 3)
const usageData = [
  { name: 'Used Credits', value: 7234, color: '#5b35f6' },
  { name: 'Remaining', value: 2766, color: '#e9e5ff' },
]

export function AiGenerationJobs() {
  return (
    <section className="mx-auto grid max-w-400 gap-5 p-4 text-slate-800 sm:p-6" id="ai-jobs">
      <AiJobsTopbar />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => <JobMetricCard metric={metric} key={metric.label} />)}
      </div>
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <JobQueue />
        <aside className="grid content-start gap-5">
          <GenerationPresets />
          <UsageThisMonth />
          <RecentCompletedOutputs />
        </aside>
      </div>
    </section>
  )
}

function AiJobsTopbar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <button className="grid size-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100" type="button" aria-label="Toggle menu"><Menu size={21} /></button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950">AI Generation Jobs</h1>
          <p className="text-sm text-slate-500">Track and manage AI-generated SRS and diagram jobs</p>
        </div>
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
        <label className="flex min-w-58 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 sm:max-w-85">
          <Search size={18} />
          <input className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" placeholder="Search projects, docs, diagrams..." />
          <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block">Ctrl + K</kbd>
        </label>
        <button className="relative grid size-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100" type="button" aria-label="Notifications"><Bell size={19} /><span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">2</span></button>
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-brand-700"><User size={20} /></span>
          <div className="hidden sm:grid"><strong className="text-sm">Mahin Rahman</strong><small className="text-xs text-slate-500">Owner</small></div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  )
}

function JobMetricCard({ metric }: { metric: JobMetric }) {
  const Icon = metric.icon
  const DirectionIcon = metric.direction === 'up' ? ArrowUp : ArrowDown
  return (
    <article className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-1">
        <span className="text-sm font-medium text-slate-500">{metric.label}</span>
        <strong className="text-2xl font-bold text-slate-950">{metric.value}</strong>
        <small className={metric.direction === 'up' ? 'flex items-center gap-1 text-xs font-semibold text-emerald-600' : 'flex items-center gap-1 text-xs font-semibold text-rose-600'}>
          <DirectionIcon size={13} /> {metric.trend}
        </small>
      </div>
      <span className={`grid size-11 place-items-center rounded-xl ${metric.tone === 'purple' ? 'bg-brand-100 text-brand-700' : metric.tone === 'green' ? 'bg-emerald-100 text-emerald-700' : metric.tone === 'blue' ? 'bg-sky-100 text-sky-700' : metric.tone === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}><Icon size={23} /></span>
    </article>
  )
}

function JobQueue() {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="grid gap-4 border-b border-slate-200 p-4">
        <h2 className="text-lg font-bold text-slate-950">Job Queue</h2>
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Job filters">
          {['All Jobs', 'In Progress', 'Completed', 'Failed', 'Canceled'].map((tab, index) => (
            <button className={index === 0 ? 'shrink-0 rounded-md bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700' : 'shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100'} type="button" key={tab}>{tab}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-400"><Search size={16} /><input className="min-w-0 flex-1 text-sm text-slate-800 outline-none" placeholder="Search jobs..." /></label>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" type="button"><Filter size={16} />Filters</button>
          <button className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50" type="button" aria-label="Refresh"><RefreshCcw size={17} /></button>
        </div>
      </header>
      <div className="overflow-x-auto">
        <div className="min-w-245" role="table" aria-label="AI generation jobs">
          <div className="grid grid-cols-[2.5rem_1.55fr_1.15fr_0.85fr_1fr_1.25fr_0.85fr_0.85fr_5rem] items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500" role="row">
            <span><input type="checkbox" aria-label="Select all jobs" /></span>
            <span>Job Name</span>
            <span>Project</span>
            <span>Type</span>
            <span>Created By</span>
            <span>Created Time <ArrowUpDown size={13} /></span>
            <span>Progress</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {jobs.map((job) => <JobRow job={job} key={job.id} />)}
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
        <span>Showing 1 to 8 of 56 results</span>
        <div className="flex items-center gap-1" aria-label="Pagination">
          <button className="grid size-8 place-items-center rounded border border-slate-200 disabled:opacity-40" type="button" disabled><ChevronLeft size={16} /></button>
          <button className="grid size-8 place-items-center rounded bg-brand-600 text-sm font-bold text-white" type="button">1</button>
          <button className="grid size-8 place-items-center rounded text-sm font-semibold transition hover:bg-slate-100" type="button">2</button>
          <button className="grid size-8 place-items-center rounded text-sm font-semibold transition hover:bg-slate-100" type="button">3</button>
          <span>...</span>
          <button className="grid size-8 place-items-center rounded text-sm font-semibold transition hover:bg-slate-100" type="button">7</button>
          <button className="grid size-8 place-items-center rounded transition hover:bg-slate-100" type="button"><ChevronRight size={16} /></button>
        </div>
        <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-700" type="button">10 / page <ChevronDown size={14} /></button>
      </footer>
    </section>
  )
}

function JobRow({ job }: { job: GenerationJobRow }) {
  const Icon = job.type === 'SRS Document' ? FileText : LayoutGrid
  return (
    <article className="grid grid-cols-[2.5rem_1.55fr_1.15fr_0.85fr_1fr_1.25fr_0.85fr_0.85fr_5rem] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50" role="row">
      <span><input type="checkbox" aria-label={`Select ${job.name}`} /></span>
      <span className="flex items-center gap-2 font-semibold text-slate-800"><i className={job.type === 'SRS Document' ? 'grid size-8 place-items-center rounded-lg bg-brand-100 text-brand-700 not-italic' : 'grid size-8 place-items-center rounded-lg bg-sky-100 text-sky-700 not-italic'}><Icon size={17} /></i><strong>{job.name}</strong></span>
      <span>{job.project}</span>
      <span>{job.type}</span>
      <span>{job.createdBy}</span>
      <span>{job.createdTime}</span>
      <span><ProgressCell job={job} /></span>
      <span><JobStatusBadge status={job.status} /></span>
      <span className="flex items-center gap-1"><button className="grid size-7 place-items-center rounded text-slate-500 hover:bg-slate-200" type="button" aria-label="View"><Eye size={16} /></button>{job.status === 'Completed' ? <button className="grid size-7 place-items-center rounded text-slate-500 hover:bg-slate-200" type="button" aria-label="Download"><Download size={16} /></button> : job.status === 'Failed' ? <button className="grid size-7 place-items-center rounded text-slate-500 hover:bg-slate-200" type="button" aria-label="Retry"><RefreshCcw size={16} /></button> : <button className="grid size-7 place-items-center rounded text-slate-500 hover:bg-slate-200" type="button" aria-label="More"><MoreVertical size={16} /></button>}</span>
    </article>
  )
}

function ProgressCell({ job }: { job: GenerationJobRow }) {
  if (job.status === 'Failed' || job.status === 'Canceled') {
    return <span className={job.status === 'Failed' ? 'font-semibold text-rose-600' : 'font-semibold text-slate-500'}>{job.status}</span>
  }

  return (
    <div className="flex items-center gap-2">
      <i className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200"><b className="block h-full rounded-full bg-brand-600" style={{ width: `${job.progress}%` }} /></i>
      <small className="text-xs font-semibold text-slate-600">{job.progress}%</small>
    </div>
  )
}

function JobStatusBadge({ status }: { status: JobStatus }) {
  return <span className={status === 'Completed' ? 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700' : status === 'In Progress' ? 'rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700' : status === 'Failed' ? 'rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700' : 'rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600'}>{status}</span>
}

function GenerationPresets() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between gap-2"><h2 className="font-bold text-slate-950">Generation Presets</h2><button className="text-sm font-bold text-brand-600" type="button">Manage</button></header>
      <div className="mt-3 grid gap-2">
        {presets.map((preset) => {
          const Icon = preset.type === 'SRS Document' ? FileText : LayoutGrid
          return (
            <article className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-2.5" key={preset.title}>
              <span className={preset.type === 'SRS Document' ? 'grid size-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700' : 'grid size-8 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700'}><Icon size={17} /></span>
              <div className="grid flex-1 gap-0.5"><strong className="text-sm text-slate-800">{preset.title}</strong><small className="text-xs leading-4 text-slate-500">{preset.description}</small></div>
              {preset.isDefault ? <b className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] uppercase text-brand-700">Default</b> : null}
            </article>
          )
        })}
      </div>
      <a className="mt-3 flex items-center gap-1 text-sm font-bold text-brand-600" href="#ai-jobs">View all presets <ChevronRight size={15} /></a>
    </section>
  )
}

function UsageThisMonth() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-bold text-slate-950">Usage This Month</h2>
      <div className="grid items-center gap-2 sm:grid-cols-2 2xl:grid-cols-1">
        <div className="relative h-38">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={usageData} dataKey="value" innerRadius={48} outerRadius={62} startAngle={92} endAngle={-268} stroke="none">
                {usageData.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-content-center text-center"><strong className="text-xl text-slate-900">72%</strong><span className="text-[10px] leading-3 text-slate-500">7,234 / 10,000<br />credits used</span></div>
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Total Credits</dt><dd className="font-bold">10,000</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Used Credits</dt><dd className="font-bold">7,234</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Remaining</dt><dd className="font-bold">2,766</dd></div>
        </dl>
      </div>
      <footer className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>Resets on Jul 1, 2025</span><a className="flex items-center font-bold text-brand-600" href="#usage">View Usage <ChevronRight size={14} /></a></footer>
    </section>
  )
}

function RecentCompletedOutputs() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between gap-2"><h2 className="font-bold text-slate-950">Recent Completed Outputs</h2><button className="text-sm font-bold text-brand-600" type="button">View all</button></header>
      <div className="mt-3 grid gap-2">
        {completedOutputs.map((job) => {
          const Icon = job.type === 'SRS Document' ? FileText : LayoutGrid
          return (
            <article className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5" key={job.id}>
              <span className={job.type === 'SRS Document' ? 'grid size-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700' : 'grid size-8 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700'}><Icon size={17} /></span>
              <div className="grid flex-1 gap-0.5"><strong className="text-sm text-slate-800">{job.name}</strong><small className="text-xs text-slate-500">{job.createdTime}</small></div>
              <button className="grid size-8 place-items-center rounded text-slate-500 transition hover:bg-slate-200" type="button" aria-label={`Download ${job.name}`}><Download size={16} /></button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
