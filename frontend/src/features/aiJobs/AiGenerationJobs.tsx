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
import './AiGenerationJobs.css'

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
    <section className="ai-jobs-page" id="ai-jobs">
      <AiJobsTopbar />
      <div className="ai-jobs-metrics">
        {metrics.map((metric) => <JobMetricCard metric={metric} key={metric.label} />)}
      </div>
      <div className="ai-jobs-content-grid">
        <JobQueue />
        <aside className="ai-jobs-side-stack">
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
    <header className="ai-jobs-topbar">
      <div className="ai-jobs-heading">
        <button className="ai-jobs-menu" type="button" aria-label="Toggle menu"><Menu size={21} /></button>
        <div>
          <h1>AI Generation Jobs</h1>
          <p>Track and manage AI-generated SRS and diagram jobs</p>
        </div>
      </div>
      <div className="ai-jobs-top-actions">
        <label className="ai-jobs-search">
          <Search size={18} />
          <input placeholder="Search projects, docs, diagrams..." />
          <kbd>Ctrl + K</kbd>
        </label>
        <button className="ai-jobs-notification" type="button" aria-label="Notifications"><Bell size={19} /><span>2</span></button>
        <div className="ai-jobs-user">
          <span><User size={20} /></span>
          <div><strong>Mahin Rahman</strong><small>Owner</small></div>
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
    <article className="ai-job-metric-card">
      <div>
        <span>{metric.label}</span>
        <strong>{metric.value}</strong>
        <small className={metric.direction === 'up' ? 'trend-up' : 'trend-down'}>
          <DirectionIcon size={13} /> {metric.trend}
        </small>
      </div>
      <span className={`ai-job-metric-icon tone-${metric.tone}`}><Icon size={27} /></span>
    </article>
  )
}

function JobQueue() {
  return (
    <section className="job-queue-card">
      <header className="job-queue-header">
        <h2>Job Queue</h2>
        <div className="job-tabs" role="tablist" aria-label="Job filters">
          {['All Jobs', 'In Progress', 'Completed', 'Failed', 'Canceled'].map((tab, index) => (
            <button className={index === 0 ? 'active' : ''} type="button" key={tab}>{tab}</button>
          ))}
        </div>
        <div className="job-queue-tools">
          <label><Search size={16} /><input placeholder="Search jobs..." /></label>
          <button type="button"><Filter size={16} />Filters</button>
          <button type="button" aria-label="Refresh"><RefreshCcw size={17} /></button>
        </div>
      </header>
      <div className="jobs-table-wrap">
        <div className="jobs-table" role="table" aria-label="AI generation jobs">
          <div className="jobs-table-head" role="row">
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
      <footer className="job-queue-footer">
        <span>Showing 1 to 8 of 56 results</span>
        <div className="job-pagination" aria-label="Pagination">
          <button type="button" disabled><ChevronLeft size={16} /></button>
          <button className="active" type="button">1</button>
          <button type="button">2</button>
          <button type="button">3</button>
          <span>...</span>
          <button type="button">7</button>
          <button type="button"><ChevronRight size={16} /></button>
        </div>
        <button className="page-size-button" type="button">10 / page <ChevronDown size={14} /></button>
      </footer>
    </section>
  )
}

function JobRow({ job }: { job: GenerationJobRow }) {
  const Icon = job.type === 'SRS Document' ? FileText : LayoutGrid
  return (
    <article className="jobs-table-row" role="row">
      <span><input type="checkbox" aria-label={`Select ${job.name}`} /></span>
      <span className="job-name-cell"><i className={job.type === 'SRS Document' ? 'doc' : 'diagram'}><Icon size={20} /></i><strong>{job.name}</strong></span>
      <span>{job.project}</span>
      <span>{job.type}</span>
      <span>{job.createdBy}</span>
      <span>{job.createdTime}</span>
      <span><ProgressCell job={job} /></span>
      <span><JobStatusBadge status={job.status} /></span>
      <span className="job-row-actions"><button type="button" aria-label="View"><Eye size={16} /></button>{job.status === 'Completed' ? <button type="button" aria-label="Download"><Download size={16} /></button> : job.status === 'Failed' ? <button type="button" aria-label="Retry"><RefreshCcw size={16} /></button> : <button type="button" aria-label="More"><MoreVertical size={16} /></button>}</span>
    </article>
  )
}

function ProgressCell({ job }: { job: GenerationJobRow }) {
  if (job.status === 'Failed' || job.status === 'Canceled') {
    return <span className={`progress-text ${job.status.toLowerCase()}`}>{job.status}</span>
  }

  return (
    <div className="job-progress-cell">
      <i><b style={{ width: `${job.progress}%` }} /></i>
      <small>{job.progress}%</small>
    </div>
  )
}

function JobStatusBadge({ status }: { status: JobStatus }) {
  return <span className={`job-status-badge status-${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
}

function GenerationPresets() {
  return (
    <section className="ai-side-card presets-card">
      <header><h2>Generation Presets</h2><button type="button">Manage</button></header>
      <div className="preset-list">
        {presets.map((preset) => {
          const Icon = preset.type === 'SRS Document' ? FileText : LayoutGrid
          return (
            <article className="preset-row" key={preset.title}>
              <span className={preset.type === 'SRS Document' ? 'doc' : 'diagram'}><Icon size={18} /></span>
              <div><strong>{preset.title}</strong><small>{preset.description}</small></div>
              {preset.isDefault ? <b>Default</b> : null}
            </article>
          )
        })}
      </div>
      <a href="#ai-jobs">View all presets <ChevronRight size={15} /></a>
    </section>
  )
}

function UsageThisMonth() {
  return (
    <section className="ai-side-card usage-month-card">
      <h2>Usage This Month</h2>
      <div className="usage-month-body">
        <div className="usage-donut">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={usageData} dataKey="value" innerRadius={48} outerRadius={62} startAngle={92} endAngle={-268} stroke="none">
                {usageData.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div><strong>72%</strong><span>7,234 / 10,000<br />credits used</span></div>
        </div>
        <dl>
          <div><dt>Total Credits</dt><dd>10,000</dd></div>
          <div><dt>Used Credits</dt><dd>7,234</dd></div>
          <div><dt>Remaining</dt><dd>2,766</dd></div>
        </dl>
      </div>
      <footer><span>Resets on Jul 1, 2025</span><a href="#usage">View Usage <ChevronRight size={14} /></a></footer>
    </section>
  )
}

function RecentCompletedOutputs() {
  return (
    <section className="ai-side-card recent-outputs-card">
      <header><h2>Recent Completed Outputs</h2><button type="button">View all</button></header>
      <div className="recent-output-list">
        {completedOutputs.map((job) => {
          const Icon = job.type === 'SRS Document' ? FileText : LayoutGrid
          return (
            <article className="recent-output-row" key={job.id}>
              <span className={job.type === 'SRS Document' ? 'doc' : 'diagram'}><Icon size={18} /></span>
              <div><strong>{job.name}</strong><small>{job.createdTime}</small></div>
              <button type="button" aria-label={`Download ${job.name}`}><Download size={16} /></button>
            </article>
          )
        })}
      </div>
    </section>
  )
}