import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { FileText, Folder, Network, WandSparkles } from 'lucide-react'
import type { AuthUser } from '../../domains/auth/types'
import type { Subscription, Usage } from '../../domains/billing/types'
import type { Diagram } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { GenerationJob, SrsDocument } from '../../domains/srs/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Card, Chip, DataTable, EmptyState, PageHeader, StatTile } from '../../shared/ui'

type SuperAdminPlatformDashboardProps = {
  user: AuthUser
  activeWorkspace: WorkspaceMembership | undefined
  projects: Project[]
  srsDocuments: SrsDocument[]
  diagrams: Diagram[]
  generationJobs: GenerationJob[]
  subscription: Subscription | null
  usage: Usage | null
}

const JOB_STATUS_COLORS: Record<string, string> = {
  completed: '#00d4aa',
  running: '#38bdf8',
  pending: '#818cf8',
  partially_completed: '#fbbf24',
  failed: '#f87171',
}

export function SuperAdminPlatformDashboard({
  activeWorkspace,
  projects,
  srsDocuments,
  diagrams,
  generationJobs,
  usage,
}: SuperAdminPlatformDashboardProps) {
  const jobsByStatus = generationJobs.reduce<Record<string, number>>((accumulator, job) => {
    accumulator[job.status] = (accumulator[job.status] ?? 0) + 1
    return accumulator
  }, {})
  const donutData = Object.entries(jobsByStatus).map(([status, value]) => ({
    name: status.replaceAll('_', ' '),
    value,
    color: JOB_STATUS_COLORS[status] ?? '#94a3b8',
  }))

  const recentJobs = [...generationJobs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6)

  return (
    <section className="grid gap-6" id="overview">
      <PageHeader
        title="Platform Overview"
        description={`Signed in on ${activeWorkspace?.workspace.name ?? 'the platform'}.`}
      />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Projects" value={projects.length} icon={Folder} />
        <StatTile label="SRS Documents" value={srsDocuments.length} icon={FileText} />
        <StatTile label="Diagrams" value={diagrams.length} icon={Network} />
        <StatTile label="AI Jobs" value={generationJobs.length} icon={WandSparkles} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <PageHeader size="section" title="Recent AI Jobs" />
          {recentJobs.length === 0 ? (
            <EmptyState className="mt-4" icon={WandSparkles} title="No AI jobs yet" />
          ) : (
            <div className="mt-4">
              <DataTable>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="font-mono text-[12px] text-fg">{job.id.slice(0, 8)}</td>
                      <td className="capitalize">{job.job_type.replaceAll('_', ' ')}</td>
                      <td>
                        <Chip tone={job.status === 'completed' ? 'active' : job.status === 'failed' ? 'danger' : 'sky'} className="capitalize">
                          {job.status.replaceAll('_', ' ')}
                        </Chip>
                      </td>
                      <td className="whitespace-nowrap">{new Date(job.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <PageHeader size="section" title="Jobs by Status" />
          {donutData.length === 0 ? (
            <EmptyState className="mt-4" icon={WandSparkles} title="No data" />
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

      {usage ? (
        <Card className="p-5">
          <PageHeader size="section" title="This Workspace Usage" />
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'SRS generations', value: usage.srs_generations },
              { label: 'AI diagrams', value: usage.ai_diagram_generations },
              { label: 'Manual saves', value: usage.manual_diagram_saves },
            ].map((row) => (
              <div key={row.label} className="rounded-md border border-border bg-surface-2 px-3 py-3">
                <div className="text-xs text-fg-3">{row.label}</div>
                <div className="mt-1 font-display text-xl font-extrabold text-fg">{row.value}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  )
}
