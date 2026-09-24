import type { ReactNode } from 'react'
import { Check, FileText, Folder, Network, Plus, WandSparkles } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Subscription, Usage } from '../../domains/billing/types'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { GenerationJob, SrsDocument } from '../../domains/srs/types'
import type { PipelineRun } from '../../domains/generationPipeline/types'
import type { AuthUser } from '../../domains/auth/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Card, FALLBACK_CHART_COLOR, Chip, EmptyState, LinkButton, PageHeader, ProgressBar, StatTile, STATUS_CHART_COLORS } from '../../shared/ui'

type MemberDashboardProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  projects: Project[]
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
  generationJobs: GenerationJob[]
  pipelineRuns: PipelineRun[]
  subscription: Subscription | null
  usage: Usage | null
}

function pipelineDonutStatus(status: string) {
  if (status === 'running') return 'running'
  if (status === 'failed') return 'failed'
  if (status === 'completed' || status === 'approved') return 'completed'
  return 'pending'
}

function pipelineRequirementCount(run: PipelineRun) {
  const revision = run.stages.find((stage) => stage.stage_name === 'requirements')
  const list = revision?.payload.requirements
  if (!Array.isArray(list)) return 0
  return list.filter((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).enabled !== false).length
}

export function MemberDashboard({
  user,
  projects,
  srsDocuments,
  diagrams,
  generationJobs,
  pipelineRuns,
  subscription,
  usage,
}: MemberDashboardProps) {
  const firstName = user.full_name.trim().split(/\s+/)[0] || 'there'
  const creditLimit = subscription?.plan.monthly_srs_generations ?? 100
  const creditsUsed = usage?.srs_generations ?? 0
  const creditPercent = creditLimit > 0 ? Math.min(100, Math.round((creditsUsed / creditLimit) * 100)) : 0

  const jobsByStatus = groupBy(generationJobs, (job) => job.status)
  const pipelineByStatus = groupBy(pipelineRuns, (run) => pipelineDonutStatus(run.status))
  const donutStatuses = new Set([...Object.keys(jobsByStatus), ...Object.keys(pipelineByStatus)])
  const donutData = Array.from(donutStatuses, (status) => ({
    name: status.replaceAll('_', ' '),
    value: (jobsByStatus[status]?.length ?? 0) + (pipelineByStatus[status]?.length ?? 0),
    color: STATUS_CHART_COLORS[status] ?? FALLBACK_CHART_COLOR,
  }))

  const recentProjects = [...projects]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5)
  const recentDocs = [
    ...srsDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      status: document.status,
      requirementCount: document.extracted_requirements?.length ?? 0,
      createdAt: document.created_at,
    })),
    ...pipelineRuns.map((run) => ({
      id: run.id,
      title: run.title,
      status: run.status,
      requirementCount: pipelineRequirementCount(run),
      createdAt: run.created_at,
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
  const activity = buildActivity(srsDocuments, diagrams, generationJobs, pipelineRuns)

  return (
    <section className="grid min-w-0 grid-cols-1 gap-6" id="overview">
      <PageHeader
        title="Dashboard"
        description={`Good to see you, ${firstName} — here's your workspace at a glance.`}
        actions={
          <LinkButton href="#srs">
            <Plus /> New SRS
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Projects" value={projects.length} icon={Folder} />
        <StatTile label="SRS Documents" value={srsDocuments.length + pipelineRuns.length} icon={FileText} />
        <StatTile label="Diagrams" value={diagrams.length} icon={Network} />
        <StatTile label="AI Jobs" value={generationJobs.length + pipelineRuns.length} icon={WandSparkles} />
        <StatTile label="SRS credits" value={`${creditPercent}%`} className="col-span-2 lg:col-span-1">
          <ProgressBar className="mt-2" value={creditPercent} />
          <div className="mt-1 font-mono text-[11px] text-fg-3">
            {creditsUsed.toLocaleString()} / {creditLimit.toLocaleString()}
          </div>
        </StatTile>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <PageHeader
            size="section"
            title="Recent Projects"
            actions={
              <a href="#projects" className="text-xs font-semibold text-accent hover:text-accent-dim">
                View all →
              </a>
            }
          />
          {recentProjects.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={Folder}
              title="No projects yet"
              description="Create a project to start generating SRS documents and diagrams."
              action={
                <LinkButton href="#projects" size="sm">
                  <Plus /> New Project
                </LinkButton>
              }
            />
          ) : (
            <div className="mt-4 grid gap-px">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-surface-2"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent ring-1 ring-inset ring-accent/15">
                    <Folder className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-fg">{project.name}</div>
                    <div className="truncate text-[11px] text-fg-3">{project.description || 'No description'}</div>
                  </div>
                  <Chip tone={project.status === 'archived' ? 'muted' : 'active'}>{formatStatus(project.status)}</Chip>
                  <span className="whitespace-nowrap text-[11px] text-fg-3">{relativeTime(project.updated_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <PageHeader size="section" title="AI Jobs by Status" />
          {donutData.length === 0 ? (
            <EmptyState className="mt-4" icon={WandSparkles} title="No AI jobs yet" />
          ) : (
            <>
              <div className="mx-auto mt-2 h-[150px] w-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={45} outerRadius={68} paddingAngle={2} stroke="none">
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid gap-2">
                {donutData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-[12.5px]">
                    <span className="flex items-center gap-2 capitalize text-fg-2">
                      <span className="size-2 rounded-full" style={{ background: entry.color }} />
                      {entry.name}
                    </span>
                    <span className="font-semibold text-fg">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="p-5">
          <PageHeader size="section" title="Recent SRS Documents" />
          {recentDocs.length === 0 ? (
            <EmptyState className="mt-4" icon={FileText} title="No SRS documents yet" />
          ) : (
            <div className="mt-3 grid gap-px">
              {recentDocs.map((document) => (
                <div key={document.id} className="flex items-center gap-2.5 rounded-md px-2 py-2.5 transition hover:bg-surface-2">
                  <FileText className="size-4 shrink-0 text-fg-3" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-fg">{document.title}</div>
                    <div className="font-mono text-[11px] text-fg-3">{document.requirementCount} requirements</div>
                  </div>
                  <Chip tone="muted">{formatStatus(document.status)}</Chip>
                  <span className="whitespace-nowrap text-[11px] text-fg-3">{relativeTime(document.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <PageHeader size="section" title="Recent Activity" />
          {activity.length === 0 ? (
            <EmptyState className="mt-4" title="Nothing here yet" />
          ) : (
            <div className="mt-3 grid gap-3.5">
              {activity.map((item) => (
                <div key={item.id} className="flex gap-2.5">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent2/15 text-accent2">
                    <item.icon className="size-3.5" />
                  </span>
                  <div>
                    <div className="text-[13px] text-fg">{item.title}</div>
                    <div className="mt-0.5 text-[11px] text-fg-3">{relativeTime(item.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <PlanCard subscription={subscription} used={creditsUsed} limit={creditLimit} percent={creditPercent} />
      </div>
    </section>
  )
}

function PlanCard({
  subscription,
  used,
  limit,
  percent,
}: {
  subscription: Subscription | null
  used: number
  limit: number
  percent: number
}) {
  const plan = subscription?.plan
  const renews = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const features = [
    plan?.can_generate_srs ? 'SRS generation' : null,
    plan?.can_generate_ai_diagrams ? 'AI class diagrams' : null,
    plan?.can_export_srs ? 'SRS export' : null,
    plan?.can_use_manual_drawio ? 'Manual draw.io editing' : null,
  ].filter((value): value is string => Boolean(value))

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#14123a] p-5.5 shadow-[var(--elev-2)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(320px_220px_at_100%_0%,rgba(139,92,246,0.55),transparent_65%),radial-gradient(300px_240px_at_0%_100%,rgba(79,70,229,0.55),transparent_65%)]" />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-extrabold text-white">{plan?.name ?? 'Free Plan'}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-emerald-200">{subscription?.status ?? 'free'}</span>
        </div>
        {renews ? <div className="mt-1 text-xs text-white/55">Renews {renews}</div> : null}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/60">
            <span>SRS credits</span>
            <span className="font-semibold text-white">
              {used.toLocaleString()} / {limit.toLocaleString()}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-violet-300" style={{ width: `${percent}%` }} />
          </div>
        </div>
        {features.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-[12.5px] text-white/80">
                <Check className="size-3.5 text-emerald-300" />
                {feature}
              </div>
            ))}
          </div>
        ) : null}
        <a
          href="#subscription"
          className="mt-5 block rounded-lg bg-white py-2 text-center text-[13px] font-semibold text-[#14123a] transition hover:bg-white/90"
        >
          Manage subscription
        </a>
      </div>
    </div>
  )
}

type ActivityItem = { id: string; title: ReactNode; time: string; icon: typeof FileText }

function buildActivity(
  srsDocuments: SrsDocument[],
  diagrams: Diagram[],
  jobs: GenerationJob[],
  pipelineRuns: PipelineRun[],
): ActivityItem[] {
  const entries: ActivityItem[] = [
    ...srsDocuments.map((document) => ({
      id: `doc-${document.id}`,
      title: (
        <>
          SRS document <strong>{document.title}</strong> {document.status}
        </>
      ),
      time: document.created_at,
      icon: FileText,
    })),
    ...diagrams.map((diagram) => ({
      id: `diagram-${diagram.id}`,
      title: (
        <>
          Diagram <strong>{diagram.title}</strong> updated
        </>
      ),
      time: diagram.updated_at,
      icon: Network,
    })),
    ...jobs.map((job) => ({
      id: `job-${job.id}`,
      title: (
        <>
          {job.job_type.replaceAll('_', ' ')} job {job.status}
        </>
      ),
      time: job.updated_at,
      icon: WandSparkles,
    })),
    ...pipelineRuns.map((run) => ({
      id: `pipeline-${run.id}`,
      title: (
        <>
          SRS pipeline <strong>{run.title}</strong> {run.status.replaceAll('_', ' ')}
        </>
      ),
      time: run.updated_at,
      icon: WandSparkles,
    })),
  ]
  return entries.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5)
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((accumulator, item) => {
    const bucket = key(item)
    ;(accumulator[bucket] ??= []).push(item)
    return accumulator
  }, {})
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/^\w/, (character) => character.toUpperCase())
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
